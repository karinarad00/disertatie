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
const port = 5000;

// Middleware
app.use(cacheMiddleware);

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));

initialize();

app.use("/api/users", userRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/companii", companyRoutes);
app.use("/api/users", uploadCvRoute);

console.log("Static files path:", path.join(__dirname, "../frontend/build"));

// ===== 🔽 Servește React din build (IMPORTANT!) =====
app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});
// ===================================================

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
