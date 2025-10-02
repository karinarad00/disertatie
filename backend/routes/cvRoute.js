const express = require("express");
const multer = require("multer");
const fs = require("fs");
const oracledb = require("oracledb");
const oci = require("oci-sdk");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();
const uploadDir = "uploads";

// Creează folder temporar dacă nu există
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer setup
const upload = multer({ dest: uploadDir });

// Oracle SDK setup
const provider = new oci.common.ConfigFileAuthenticationDetailsProvider();
const objectStorageClient = new oci.objectstorage.ObjectStorageClient({
  authenticationDetailsProvider: provider,
});

const namespaceName = process.env.NAMESPACE;
const bucketName = process.env.BUCKET;

router.post(
  "/upload",
  authenticateToken,
  upload.single("cv"),
  async (req, res) => {
    const file = req.file;
    const userId = req.user.id;

    if (!file) {
      return res.status(400).json({ message: "Fișierul CV este obligatoriu." });
    }

    const connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
    });

    try {
      // Șterge CV-ul vechi dacă există
      const result = await connection.execute(
        `SELECT cv_url FROM utilizator WHERE id_utilizator = :id`,
        { id: userId }
      );

      if (result.rows.length > 0 && result.rows[0][0]) {
        const oldUrl = result.rows[0][0];
        const oldObjectName = oldUrl.split("/").pop();

        try {
          await objectStorageClient.deleteObject({
            namespaceName,
            bucketName,
            objectName: `cv-uri/${oldObjectName}`,
          });
          console.log("CV vechi șters din bucket:", oldObjectName);
        } catch (deleteErr) {
          console.warn("Nu am putut șterge CV-ul vechi:", deleteErr.message);
        }
      }

      // Numele obiectului pentru CV-ul nou
      const objectName = `cv-uri/${userId}_${file.originalname}`;

      // Upload fișier în Object Storage
      await objectStorageClient.putObject({
        namespaceName,
        bucketName,
        objectName,
        putObjectBody: fs.createReadStream(file.path),
        contentLength: fs.statSync(file.path).size,
      });

      // Creează Preauthenticated Request (link temporar extins la 24 ore)
      const parDetails = {
        name: `cv-link-${userId}-${Date.now()}`,
        accessType: "ObjectRead",
        timeExpires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 ore
        objectName: objectName,
      };

      const { preauthenticatedRequest } =
        await objectStorageClient.createPreauthenticatedRequest({
          namespaceName,
          bucketName,
          createPreauthenticatedRequestDetails: parDetails,
        });

      const preSignedUrl = `https://objectstorage.eu-frankfurt-1.oraclecloud.com${preauthenticatedRequest.accessUri}`;

      // Salvează link-ul în baza de date
      await connection.execute(
        `UPDATE utilizator SET cv_url = :url WHERE id_utilizator = :id`,
        { url: preSignedUrl, id: userId },
        { autoCommit: true }
      );

      res.json({ message: "CV încărcat cu succes!", url: preSignedUrl });
    } catch (err) {
      console.error("Eroare la upload CV:", err);
      res.status(500).json({ message: "Eroare la încărcarea CV-ului." });
    } finally {
      fs.unlink(file.path, (err) => {
        if (err) console.error("Eroare la ștergerea fișierului temporar:", err);
      });
      await connection.close();
    }
  }
);


router.post("/analyze", async (req, res) => {
  try {
    const { cvUrl } = req.body;
    if (!cvUrl) {
      return res.status(400).json({ error: "Lipsește cvUrl" });
    }

    // Trimite către microserviciul Python
    const pyRes = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvUrl }),
    });

    const data = await pyRes.json();
    res.json(data);
  } catch (err) {
    console.error("Eroare backend analiza CV:", err);
    res.status(500).json({ error: "Eroare internă la analiza CV-ului" });
  }
});

router.post("/suggestions", async (req, res) => {
  const { cvUrl } = req.body;

  if (!cvUrl)
    return res.status(400).json({ error: "Lipsește URL-ul CV-ului." });

  try {
    const response = await fetch("http://127.0.0.1:8000/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvUrl }),
    });

    const data = await response.json();
    res.json({ jobs: data.jobs });
  } catch (err) {
    console.error("Eroare sugestii:", err);
    res.status(500).json({ error: "Eroare la generarea sugestiilor." });
  }
});


module.exports = router;
