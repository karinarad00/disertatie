const express = require("express");
const router = express.Router();
const { executeQuery } = require("../db");

// Ruta pentru joburile plătite
router.get("/paid", async (req, res) => {
  try {
    const jobs = await executeQuery("SELECT * FROM job WHERE paid = 1");
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: "Eroare la preluarea joburilor plătite" });
  }
});

// Ruta pentru toate joburile
router.get("/all", async (req, res) => {
  try {
    const jobs = await executeQuery("SELECT * FROM job");
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: "Eroare la preluarea tuturor joburilor" });
  }
});

module.exports = router;
