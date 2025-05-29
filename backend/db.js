const oracledb = require("oracledb");
oracledb.fetchAsString = [oracledb.CLOB];
require("dotenv").config();
oracledb.initOracleClient({ libDir: process.env.INSTANT_CLIENT_LIB_DIR });

async function initialize() {
  try {
    await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
    });

    console.log("Oracle DB connection pool created");
  } catch (err) {
    console.error("Failed to create Oracle DB pool", err);
    throw err;
  }
}

async function executeQuery(sql, binds = [], options = {}) {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      ...options,
    });
    return result.rows;
  } catch (err) {
    console.error("Error executing query:", err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("Error closing connection:", closeErr);
      }
    }
  }
}

module.exports = {
  initialize,
  executeQuery,
};
