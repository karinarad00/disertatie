require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const { initialize } = require("./db");
const userRoutes = require("./routes/userRoutes");
const jobsRoutes = require("./routes/jobsRoutes");
const companyRoutes = require("./routes/companyRoutes");
const cacheMiddleware = require("./middleware/cacheMiddleware");
const uploadCvRoute = require("./routes/uploadCvRoute");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cacheMiddleware);
app.use(express.json());

// CORS: permite accesul din frontend-ul tău (prod sau local)
app.use(
  cors({
    origin: ["http://localhost:3000"], // adaugă și domeniul de producție după deploy
    credentials: true,
  })
);

initialize();

// API routes
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/companii", companyRoutes);
app.use("/api/users", uploadCvRoute);

// ===== 🔽 Servește React din build (IMPORTANT!) =====
app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});
// ===================================================

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
