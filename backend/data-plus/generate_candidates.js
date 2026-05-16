const oracledb = require("oracledb");
const bcrypt = require("bcrypt");
const path = require("path");
// Point to the .env file in the 'backend' directory
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

oracledb.initOracleClient({ libDir: process.env.INSTANT_CLIENT_LIB_DIR });

const CANDIDATES = [
  {
    username: "andrei.popescu",
    email: "andrei.popescu@test.com",
    password: "Password123!",
  },
  {
    username: "mihai.ionescu",
    email: "mihai.ionescu@test.com",
    password: "Password123!",
  },
  {
    username: "alexandru.dumitru",
    email: "alexandru.dumitru@test.com",
    password: "Password123!",
  },
  {
    username: "elena.stoica",
    email: "elena.stoica@test.com",
    password: "Password123!",
  },
  {
    username: "ana.marin",
    email: "ana.marin@test.com",
    password: "Password123!",
  },
  {
    username: "cristian.georgescu",
    email: "cristian.georgescu@test.com",
    password: "Password123!",
  },
  {
    username: "ioana.dinu",
    email: "ioana.dinu@test.com",
    password: "Password123!",
  },
  {
    username: "florin.radu",
    email: "florin.radu@test.com",
    password: "Password123!",
  },
  {
    username: "diana.ilie",
    email: "diana.ilie@test.com",
    password: "Password123!",
  },
  {
    username: "vasile.matei",
    email: "vasile.matei@test.com",
    password: "Password123!",
  },
  {
    username: "georgiana.enache",
    email: "georgiana.enache@test.com",
    password: "Password123!",
  },
  {
    username: "adrian.stan",
    email: "adrian.stan@test.com",
    password: "Password123!",
  },
];

async function generateCandidates() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
    });
    console.log("Connected to database");

    for (const cand of CANDIDATES) {
      const hashedPassword = await bcrypt.hash(cand.password, 10);
      
      try {
        await connection.execute(
          `INSERT INTO Utilizator (
            id_utilizator, username, email, parola, tip_utilizator
          ) VALUES (
            seq_utilizator.NEXTVAL, :username, :email, :password, 'Candidat'
          )`,
          {
            username: cand.username,
            email: cand.email,
            password: hashedPassword,
          },
          { autoCommit: true }
        );
        console.log(`Created: ${cand.username}`);
      } catch (err) {
        if (err.code === 'ORA-00001') {
          console.log(`Skipping: ${cand.username} (already exists)`);
        } else {
          throw err;
        }
      }
    }
  } catch (err) {
    console.error("Error generating candidates:", err);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

generateCandidates();
