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

module.exports = router;
