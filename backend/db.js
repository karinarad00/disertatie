require("dotenv").config();
const oracledb = require("oracledb");

process.env.TNS_ADMIN = process.env.WALLET_LOCATION;

async function initialize() {
  try {
    await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_ALIAS,
      poolMin: 1,
      poolMax: 5,
      poolIncrement: 1,
    });
    console.log("Connection pool created");
  } catch (err) {
    console.error("Failed to create pool", err);
  }
}

module.exports = { initialize };
