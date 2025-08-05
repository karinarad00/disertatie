const express = require("express");
const multer = require("multer");
const fs = require("fs");
const oracledb = require("oracledb");
const oci = require("oci-sdk");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();
const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: uploadDir });

const provider = new oci.common.ConfigFileAuthenticationDetailsProvider();
const objectStorageClient = new oci.objectstorage.ObjectStorageClient({
  authenticationDetailsProvider: provider,
});

const namespaceName = "frwj8kfylvyk";
const bucketName = "cv-bucket";

router.post(
  "/upload-cv",
  authenticateToken,
  upload.single("cv"),
  async (req, res) => {
    const file = req.file;
    const userId = req.user.id;

    if (!file) {
      return res.status(400).json({ message: "Fișierul CV este obligatoriu." });
    }

    const objectName = `cv-uri/${userId}_${file.originalname}`;

    try {
      await objectStorageClient.putObject({
        namespaceName,
        bucketName,
        objectName,
        putObjectBody: fs.createReadStream(file.path),
        contentLength: fs.statSync(file.path).size,
      });

      // Creează link pre-autentificat (valid 1 oră)
      const parDetails = {
        name: `cv-link-${userId}-${Date.now()}`,
        bucketName: bucketName,
        accessType: "ObjectRead", // permisiune citire
        objectName: objectName,
        timeExpires: new Date(Date.now() + 1000 * 60 * 60), // 1 oră de valabilitate
      };

      const { preauthenticatedRequest } =
        await objectStorageClient.createPreauthenticatedRequest({
          namespaceName,
          bucketName,
          createPreauthenticatedRequestDetails: parDetails,
        });

      const preSignedUrl = `https://objectstorage.eu-frankfurt-1.oraclecloud.com${preauthenticatedRequest.accessUri}`;

      // Salvează în baza de date link-ul semnat
      const connection = await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING,
      });

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
    }
  }
);

module.exports = router;
