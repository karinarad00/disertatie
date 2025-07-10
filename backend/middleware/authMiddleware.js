const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // format: Bearer <token>

  if (!token) return res.status(401).json({ message: "Token lipsă." });

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err)
      return res.status(403).json({ message: "Token invalid sau expirat." });

    req.user = user; // salvează datele userului decodificate
    next();
  });
}

module.exports = authenticateToken;
