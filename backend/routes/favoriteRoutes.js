const express = require("express");
const router = express.Router();
const { executeQuery } = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const oracledb = require("oracledb");

// Adaugă un job în lista de favorite
router.post("/add", authenticateToken, async (req, res) => {
  const { ID_JOB } = req.body;
  const ID_UTILIZATOR = req.user.id; // presupunem că token-ul furnizează id-ul utilizatorului

  if (!ID_JOB) {
    return res.status(400).json({ error: "ID_JOB este obligatoriu" });
  }

  try {
    const sql = `
      INSERT INTO lista_favorite (ID_UTILIZATOR, ID_JOB, DATA_ADAUGARII)
      VALUES (:ID_UTILIZATOR, :ID_JOB, SYSDATE)
      RETURNING ID_UTILIZATOR INTO :outId
    `;

    const binds = {
      ID_UTILIZATOR,
      ID_JOB,
      outId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    };

    await executeQuery(sql, binds, { autoCommit: true });

    res.json({ message: "Job adăugat la favorite cu succes!" });
  } catch (err) {
    console.error("Eroare la adăugarea în favorite:", err);
    res.status(500).json({ error: "Eroare server" });
  }
});

// Elimină un job din lista de favorite
router.delete("/remove", authenticateToken, async (req, res) => {
  const { ID_JOB } = req.body;
  const ID_UTILIZATOR = req.user.id;

  if (!ID_JOB) {
    return res.status(400).json({ error: "ID_JOB este obligatoriu" });
  }

  try {
    const sql = `
      DELETE FROM lista_favorite
      WHERE ID_UTILIZATOR = :ID_UTILIZATOR AND ID_JOB = :ID_JOB
    `;

    await executeQuery(sql, { ID_UTILIZATOR, ID_JOB }, { autoCommit: true });

    res.json({ message: "Job eliminat din favorite cu succes!" });
  } catch (err) {
    console.error("Eroare la eliminarea din favorite:", err);
    res.status(500).json({ error: "Eroare server" });
  }
});

// Preia lista de favorite a utilizatorului
router.get("/list", authenticateToken, async (req, res) => {
  const ID_UTILIZATOR = req.user.id;

  try {
    const sql = `
      SELECT ID_JOB
      FROM lista_favorite
      WHERE ID_UTILIZATOR = :ID_UTILIZATOR
    `;

    const result = await executeQuery(sql, { ID_UTILIZATOR });
    res.json(result.map((r) => r.ID_JOB));
  } catch (err) {
    console.error("Eroare la preluarea favorite:", err);
    res.status(500).json({ error: "Eroare server" });
  }
});

router.get("/all", authenticateToken, async (req, res) => {
  const ID_UTILIZATOR = req.user.id;

  try {
    const sql = `
      SELECT 
        j.id_job AS ID_JOB,
        j.titlu AS TITLU,
        j.data_postarii AS DATA_POSTARII,
        j.tip_job AS TIP_JOB,
        j.nivel_experienta AS NIVEL_EXPERIENTA,
        j.salariu_min,
        j.salariu_max,
        c.id_companie AS ID_COMPANIE,
        c.denumire_companie AS DENUMIRE_COMPANIE,
        c.logo AS LOGO,
        LISTAGG(o.denumire_oras, ', ') WITHIN GROUP (ORDER BY o.denumire_oras) AS LOCATIE,
        d.denumire_domeniu AS DOMENIU
      FROM lista_favorite lf
      JOIN job j ON lf.id_job = j.id_job
      LEFT JOIN companie c ON j.id_companie = c.id_companie
      LEFT JOIN centrucompanie cc ON cc.id_companie = c.id_companie
      LEFT JOIN oras o ON cc.id_oras = o.id_oras
      LEFT JOIN domeniu d ON j.id_domeniu = d.id_domeniu
      WHERE lf.id_utilizator = :ID_UTILIZATOR
      GROUP BY 
        j.id_job, 
        j.titlu, 
        j.data_postarii, 
        j.tip_job, 
        j.nivel_experienta,
        j.salariu_min,
        j.salariu_max,
        c.id_companie,
        c.denumire_companie,
        c.logo,
        d.denumire_domeniu
      ORDER BY j.data_postarii DESC
    `;

    const jobs = await executeQuery(sql, { ID_UTILIZATOR });
    res.json(jobs);
  } catch (err) {
    console.error("Eroare la preluarea favorite full:", err);
    res.status(500).json({ error: "Eroare server" });
  }
});

module.exports = router;
