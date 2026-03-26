const express = require("express");
const router = express.Router();
const { executeQuery } = require("../db");
const cacheMiddleware = require("../middleware/cacheMiddleware");

// GET lista domenii
router.get("/all", cacheMiddleware, async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT id_domeniu, denumire_domeniu 
      FROM Domeniu
      ORDER BY denumire_domeniu
    `);
    
    res.json(result);
  } catch (err) {
    console.error("Eroare la preluarea domeniilor:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// GET detalii domeniu după id
router.get("/:id", cacheMiddleware, async (req, res) => {
  const id = Number(req.params.id);

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "ID domeniu invalid." });
  }

  try {
    const rows = await executeQuery(
      `
      SELECT id_domeniu, denumire_domeniu, descriere
      FROM Domeniu
      WHERE id_domeniu = :id
      `,
      { id },
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Domeniul nu a fost găsit." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Eroare la preluarea domeniului:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});

module.exports = router;
