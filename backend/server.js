require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initialize } = require("./db");
const userRoutes = require("./routes/userRoutes");
const jobsRoutes = require("./routes/jobsRoutes");
const companyRoutes = require("./routes/companyRoutes");
const cacheMiddleware = require("./middleware/cacheMiddleware");

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});