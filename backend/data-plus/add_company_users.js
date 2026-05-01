require("dotenv").config({ path: "../.env" });
const { initialize, executeQuery } = require("../db");
const bcrypt = require("bcrypt");

async function addCompanyUsers() {
  await initialize();

  try {
    // Get all companies
    const companies = await executeQuery(`SELECT id_companie, denumire_companie, email, telefon FROM Companie`);

    for (const company of companies) {
      const { ID_COMPANIE, DENUMIRE_COMPANIE, EMAIL, TELEFON } = company;

      // Simple username format
      const username = DENUMIRE_COMPANIE.toLowerCase().replace(/[^a-z0-9]/g, "");
      const password = `${username}1234`;
      const email = EMAIL || `${username}@company.ro`;
      const phone = TELEFON || "0000000000";

      // Check if user already exists
      const existing = await executeQuery(
        `SELECT COUNT(*) AS COUNT FROM Utilizator WHERE username = :username`,
        { username }
      );

      if (existing[0].COUNT > 0) {
        console.log(`Skipping: ${username} already exists.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert into Utilizator
      await executeQuery(
        `INSERT INTO Utilizator (
          id_utilizator, username, email, parola, tip_utilizator, phone, id_companie
        ) VALUES (
          seq_utilizator.NEXTVAL, :username, :email, :password, 'Angajator', :phone, :id_companie
        )`,
        {
          username,
          email,
          password: hashedPassword,
          phone,
          id_companie: ID_COMPANIE
        },
        { autoCommit: true },
      );

      console.log(`Added: ${username}`);
    }

    console.log("Successfully processed all companies.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit();
  }
}

addCompanyUsers();
