const express = require("express");
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


module.exports = router;
