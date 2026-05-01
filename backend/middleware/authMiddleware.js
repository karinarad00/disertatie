const jwt = require("jsonwebtoken");
require("dotenv").config();

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  console.log("Auth Header arriving at backend:", authHeader);

  const token = authHeader && authHeader.split(" ")[1]; // format: Bearer <token>

  if (!token) {
    console.warn("No token provided in request headers.");
    return res.status(401).json({ message: "Token lipsă." });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      console.error("JWT Verification Error:", err.message);
      return res.status(403).json({ message: "Token invalid sau expirat." });
    }

    req.user = user; // salvează datele userului decodificate
    next();
  });
}

module.exports = authenticateToken;
