const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const oracledb = require("oracledb");

// GET lista companii
router.get("/all", async (req, res) => {
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
router.get("/geocode", async (req, res) => {
  const address = req.query.q;

  if (!address || address.trim() === "") {
    return res.status(400).json({ message: "Adresa lipsă." });
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address
    )}&format=json&limit=1`;

    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "YourAppName/1.0",
      },
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Eroare geocodare:", error);
    res.status(500).json({ message: "Eroare la geocodare." });
  }
});

// GET locații pentru hartă
router.get("/locations", async (req, res) => {
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
