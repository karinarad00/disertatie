const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const oracledb = require("oracledb");
const cacheMiddleware = require("../middleware/cacheMiddleware");

// GET lista companii
router.get("/all", cacheMiddleware, async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT id_companie, denumire_companie FROM Companie ORDER BY denumire_companie`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Eroare la preluarea companiilor:", err);
    res.status(500).json({ message: "Eroare server." });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error(e);
      }
    }
  }
});

// GET geocodare prin proxy
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
      console.error(
        `Nominatim returned ${response.status} ${response.statusText}`,
      );
      return res
        .status(502)
        .json({ message: "Eroare la geocodare: Nominatim a refuzat cererea." });
    }

    const data = await response.json();

    // Return default coordinates if no result
    if (!data || data.length === 0) {
      return res.json([{ lat: 0, lon: 0 }]);
    }

    res.json(data);
  } catch (error) {
    console.error("Eroare geocodare:", error);
    res.status(500).json({ message: "Eroare la geocodare." });
  }
});

// GET locații pentru hartă
router.get("/locations", cacheMiddleware, async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT 
         c.denumire_companie AS company,
         cc.adresa AS address,
         o.denumire_oras AS city
       FROM Companie c
       JOIN CentruCompanie cc ON c.id_companie = cc.id_companie
       JOIN Oras o ON cc.id_oras = o.id_oras`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Eroare la preluarea locațiilor:", err);
    res.status(500).json({ message: "Eroare server la locații." });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error(e);
      }
    }
  }
});

module.exports = router;
