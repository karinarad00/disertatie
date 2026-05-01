const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const { executeQuery } = require("../db");
const cacheMiddleware = require("../middleware/cacheMiddleware");

// GET lista companii
router.get("/all", cacheMiddleware, async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT id_companie, denumire_companie 
      FROM Companie 
      ORDER BY denumire_companie
    `);

    res.json(result);
  } catch (err) {
    console.error("Eroare la preluarea companiilor:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// GET geocodare prin proxy (rămâne la fel)
router.get("/geocode", cacheMiddleware, async (req, res) => {
  const address = req.query.q;

  if (!address || address.trim() === "") {
    return res.status(400).json({ message: "Adresa lipsă." });
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address,
    )}&format=json&limit=1`;

    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "Project/1.0 (your_email@example.com)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return res.status(502).json({
        message: "Eroare la geocodare: Nominatim a refuzat cererea.",
      });
    }

    const data = await response.json();
    res.json(data.length ? data : [{ lat: 0, lon: 0 }]);
  } catch (error) {
    console.error("Eroare geocodare:", error);
    res.status(500).json({ message: "Eroare la geocodare." });
  }
});

// GET locații pentru hartă
router.get("/locations", cacheMiddleware, async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        j.id_job,
        j.titlu,
        c.id_companie,
        c.denumire_companie AS company,
        cc.adresa AS address,
        o.id_oras,
        o.denumire_oras AS city,
        cc.latitudine AS lat,
        cc.longitudine AS lng
      FROM Job j
      JOIN Companie c ON j.id_companie = c.id_companie
      JOIN CentruCompanie cc ON c.id_companie = cc.id_companie
      JOIN Oras o ON cc.id_oras = o.id_oras
      WHERE cc.latitudine IS NOT NULL
        AND cc.longitudine IS NOT NULL
    `);

    res.json(result);
  } catch (err) {
    console.error("Eroare la preluarea locațiilor:", err);
    res.status(500).json({ message: "Eroare server la locații." });
  }
});

// GET detalii companie după id (cu locații array)
router.get("/:id", cacheMiddleware, async (req, res) => {
  const id = Number(req.params.id);

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "ID invalid." });
  }

  try {
    const rows = await executeQuery(
      `
      SELECT 
        c.id_companie,
        c.denumire_companie,
        c.descriere,
        c.logo,
        c.email,
        c.telefon,
        c.website,
        cc.adresa,
        o.denumire_oras AS city
      FROM Companie c
      LEFT JOIN CentruCompanie cc ON c.id_companie = cc.id_companie
      LEFT JOIN Oras o ON cc.id_oras = o.id_oras
      WHERE c.id_companie = :id
      `,
      { id },
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Compania nu a fost găsită." });
    }

    const companyInfo = {
      id_companie: rows[0].ID_COMPANIE,
      denumire_companie: rows[0].DENUMIRE_COMPANIE,
      descriere: rows[0].DESCRIERE,
      logo: rows[0].LOGO,
      email: rows[0].EMAIL,
      telefon: rows[0].TELEFON,
      website: rows[0].WEBSITE,
      locations: [],
    };

    rows.forEach((row) => {
      if (row.ADRESA || row.CITY) {
        companyInfo.locations.push({
          address: row.ADRESA || "",
          city: row.CITY || "",
        });
      }
    });

    res.json(companyInfo);
  } catch (err) {
    console.error("Eroare la preluarea companiei:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});

module.exports = router;
