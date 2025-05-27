require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initialize } = require("./db");
const jobsRoutes = require("./routes/jobsRoutes");

const app = express();
const port = 5000;

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));

initialize();

app.use("/api/jobs", jobsRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
