const express = require("express");
const router = express.Router();
const { executeQuery } = require("../db");

// Ruta pentru joburile de la companiile cu subscriptie activa
router.get("/paid", async (req, res) => {
  try {
    const jobs = await executeQuery(`
      SELECT j.*
      FROM job j
      JOIN companie c ON j.ID_COMPANIE = c.ID_COMPANIE
      JOIN utilizator u ON u.ID_COMPANIE = c.ID_COMPANIE
      WHERE u.SUBSCRIPTIE_ACTIVA = 1
    `);
    res.json(jobs);
  } catch (err) {
    console.error("Eroare în /api/jobs/paid:", err);
    res
      .status(500)
      .json({ error: "Eroare la preluarea joburilor cu subscriptie activa" });
  }
});

// Ruta pentru toate joburile
router.get("/all", async (req, res) => {
  try {
    const jobs = await executeQuery(`
      SELECT 
        j.id_job,
        j.titlu,
        j.data_postarii,
        j.tip_job,
        j.nivel_experienta,
        c.id_companie,
        c.denumire_companie,
        c.logo
      FROM job j
      LEFT JOIN companie c ON j.id_companie = c.id_companie
      LEFT JOIN domeniu d ON j.id_domeniu = d.id_domeniu
    `);
    res.json(jobs);
  } catch (err) {
    console.error("Eroare în /api/jobs/all:", err);
    res.status(500).json({ error: "Eroare la preluarea tuturor joburilor" });
  }
});

// Ruta pentru un singur job după ID
router.get("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const jobs = await executeQuery(
      `
      SELECT 
        j.id_job,
        j.titlu,
        j.descriere,
        j.link_extern,
        j.data_postarii,
        j.tip_job,
        j.nivel_experienta,
        c.id_companie,
        c.denumire_companie,
        c.email_contact,
        c.website,
        c.descriere AS descriere_companie,
        c.logo,
        d.id_domeniu,
        d.denumire_domeniu
      FROM job j
      LEFT JOIN companie c ON j.id_companie = c.id_companie
      LEFT JOIN domeniu d ON j.id_domeniu = d.id_domeniu
      WHERE j.id_job = :id
      `,
      { id: Number(id) }
    );

    if (jobs.length === 0) {
      return res.status(404).json({ error: "Jobul nu a fost găsit" });
    }

    res.json(jobs[0]);
  } catch (err) {
    console.error(`Eroare în /api/jobs/${id}:`, err);
    res.status(500).json({ error: "Eroare la preluarea jobului" });
  }
});

module.exports = router;
