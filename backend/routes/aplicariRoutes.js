// routes/aplicariRoutes.js
const express = require("express");
const router = express.Router();
const { executeQuery } = require("../db");
const authenticateToken = require("../middleware/authMiddleware");


router.get("/:jobId/", authenticateToken, async (req, res) => {
  const { jobId } = req.params;
  
  try {
    // Preluăm aplicațiile pentru job-ul respectiv + info user
    const applications = await executeQuery(
      `SELECT a.ID_APLICARE, a.ID_UTILIZATOR, a.ID_JOB, a.CV_URL_APLICARE,
              a.DATA_APLICARII, a.STATUS_APLICARE,
              u.USERNAME, u.EMAIL, u.IMAGINE_PROFIL
       FROM aplicare_job a
       JOIN utilizator u ON u.ID_UTILIZATOR = a.ID_UTILIZATOR
       WHERE a.ID_JOB = :jobId`,
      { jobId },
    );

    res.json(applications);
  } catch (err) {
    console.error("Eroare la preluarea aplicațiilor:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});

router.post("/:jobId/apply", authenticateToken, async (req, res) => {
  const { jobId } = req.params;
  const { id_utilizator } = req.body;
  console.log("Aplicare job - jobId:", jobId, "id_utilizator:", id_utilizator);
  
  try {
    // Verificăm dacă utilizatorul a aplicat deja
    const existing = await executeQuery(
      "SELECT * FROM aplicare_job WHERE ID_JOB = :jobId AND ID_UTILIZATOR = :id_utilizator",
      { jobId, id_utilizator }
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: "Ai aplicat deja la acest job." });
    }

    // Preluăm CV-ul utilizatorului
    const userCv = await executeQuery(
      "SELECT CV_URL FROM utilizator WHERE ID_UTILIZATOR = :id_utilizator",
      { id_utilizator }
    );

    if (userCv.length === 0 || !userCv[0].CV_URL) {
      return res.status(400).json({ message: "Utilizatorul nu are un CV încărcat." });
    }

    // Inserăm aplicația
    await executeQuery(
      `INSERT INTO aplicare_job (ID_JOB, ID_UTILIZATOR, CV_URL_APLICARE, DATA_APLICARII, STATUS_APLICARE)
       VALUES (:jobId, :id_utilizator, :cv_url, CURRENT_DATE, 'Trimisa')`,
      { jobId, id_utilizator, cv_url: userCv[0].CV_URL }
    );

    res.status(201).json({ message: "Aplicație trimisă cu succes!" });
  } catch (err) {
    console.error("Eroare la adăugarea aplicației:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});

module.exports = router;
