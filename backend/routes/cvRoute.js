const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const oci = require("oci-sdk");
const authenticateToken = require("../middleware/authMiddleware");
const cacheMiddleware = require("../middleware/cacheMiddleware");
const { executeQuery } = require("../db");

const router = express.Router();
const uploadDir = "uploads";

// Create temp folder
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer
const upload = multer({ dest: uploadDir });

// OCI setup
const provider = new oci.common.ConfigFileAuthenticationDetailsProvider();
const objectStorageClient = new oci.objectstorage.ObjectStorageClient({
  authenticationDetailsProvider: provider,
});

const namespaceName = process.env.NAMESPACE;
const bucketName = process.env.CV_BUCKET;

// ================= UPLOAD CV =================
router.post(
  "/upload",
  authenticateToken,
  upload.single("cv"),
  async (req, res) => {
    const file = req.file;
    const userId = req.user.id;

    if (!file) {
      return res.status(400).json({
        message: "Fișierul CV este obligatoriu.",
      });
    }

    try {
      // 🔹 Luăm CV-ul vechi
      const result = await executeQuery(
        `SELECT cv_url FROM utilizator WHERE id_utilizator = :id`,
        { id: userId },
      );

      if (result.length > 0 && result[0].CV_URL) {
        const oldUrl = result[0].CV_URL;
        const oldObjectName = oldUrl.split("/").pop();

        try {
          await objectStorageClient.deleteObject({
            namespaceName,
            bucketName,
            objectName: `cv-uri/${oldObjectName}`,
          });
        } catch (deleteErr) {
          console.warn("Nu am putut șterge CV-ul vechi:", deleteErr.message);
        }
      }

      const objectName = `cv-uri/${userId}_${file.originalname}`;

      // 🔹 Upload nou
      await objectStorageClient.putObject({
        namespaceName,
        bucketName,
        objectName,
        putObjectBody: fs.createReadStream(file.path),
        contentLength: fs.statSync(file.path).size,
      });

      // 🔹 Preauthenticated URL
      const { preauthenticatedRequest } =
        await objectStorageClient.createPreauthenticatedRequest({
          namespaceName,
          bucketName,
          createPreauthenticatedRequestDetails: {
            name: `cv-link-${userId}-${Date.now()}`,
            accessType: "ObjectRead",
            timeExpires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
            objectName,
          },
        });

      const preSignedUrl = `https://objectstorage.eu-frankfurt-1.oraclecloud.com${preauthenticatedRequest.accessUri}`;

      // 🔹 Salvăm în DB
      await executeQuery(
        `UPDATE utilizator SET cv_url = :url WHERE id_utilizator = :id`,
        { url: preSignedUrl, id: userId },
        { autoCommit: true },
      );

      res.json({
        message: "CV încărcat cu succes!",
        url: preSignedUrl,
      });
    } catch (err) {
      console.error("Eroare la upload CV:", err);
      res.status(500).json({
        message: "Eroare la încărcarea CV-ului.",
      });
    } finally {
      // ștergere fișier temp
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error("Eroare ștergere temp:", err);
        }
      });
    }
  },
);

// ================= PREVIEW CV =================
router.get("/preview_cv", async (req, res) => {
  try {
    const { cv_url } = req.query;

    if (!cv_url) {
      return res.status(400).json({ error: "Lipsește cvUrl" });
    }

    const decodedUrl = decodeURIComponent(cv_url);
    const response = await fetch(decodedUrl);

    if (!response.ok) {
      return res.status(400).json({
        error: "Nu am putut descărca PDF-ul",
      });
    }

    const tempPath = path.join(uploadDir, `cv_temp_${Date.now()}.pdf`);
    const fileStream = fs.createWriteStream(tempPath);

    await new Promise((resolve, reject) => {
      response.body.pipe(fileStream);
      response.body.on("error", reject);
      fileStream.on("finish", resolve);
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=cv.pdf");

    const readStream = fs.createReadStream(tempPath);
    readStream.pipe(res);

    readStream.on("close", () => {
      fs.unlink(tempPath, (err) => {
        if (err) console.error("Eroare ștergere temp:", err);
      });
    });
  } catch (err) {
    console.error("Eroare preview CV:", err);
    res.status(500).json({
      error: "Eroare la afișarea CV-ului",
    });
  }
});

// ================= CANDIDATES POOL =================
router.get("/candidates-pool", authenticateToken, async (req, res) => {
  try {
    const candidates = await executeQuery(
      `SELECT u.id_utilizator, u.username, u.email, u.phone, u.experience, u.imagine_profil, u.cv_url,
              o.denumire_oras AS location
       FROM Utilizator u
       LEFT JOIN Oras o ON u.location = o.id_oras
       WHERE u.cv_url IS NOT NULL AND u.tip_utilizator = 'Candidat'`,
    );
    res.json(candidates);
  } catch (err) {
    console.error("Eroare la preluarea pool-ului de candidați:", err);
    res.status(500).json({ error: "Eroare server." });
  }
});

// ================= ANALYZE CV =================
router.post("/analyze", cacheMiddleware, async (req, res) => {
  try {
    const { cvUrl } = req.body;

    if (!cvUrl) {
      return res.status(400).json({ error: "Lipsește cvUrl" });
    }

    const pyRes = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvUrl }),
    });

    if (!pyRes.ok) {
      const text = await pyRes.text();
      return res.status(500).json({
        error: "Python backend error",
        details: text,
      });
    }

    const data = await pyRes.json();
    res.json(data);
  } catch (err) {
    console.error("Eroare analyze:", err);
    res.status(500).json({
      error: "Eroare internă la analiza CV-ului",
    });
  }
});

// ================= SUGGESTIONS =================
router.post("/suggestions", cacheMiddleware, async (req, res) => {
  const { cvUrl } = req.body;

  if (!cvUrl) {
    return res.status(400).json({
      error: "Lipsește URL-ul CV-ului.",
    });
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvUrl }),
    });

    const data = await response.json();

    res.json({
      jobs: data.jobs,
    });
  } catch (err) {
    console.error("Eroare sugestii:", err);
    res.status(500).json({
      error: "Eroare la generarea sugestiilor.",
    });
  }
});

// ================= JOB-CV MATCH =================
router.post("/job-cv-match", cacheMiddleware, async (req, res) => {
  try {
    const response = await fetch("http://127.0.0.1:8000/job-cv-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Eroare job-cv-match:", err);
    res.status(500).json({ error: "Eroare la matching." });
  }
});

module.exports = router;
