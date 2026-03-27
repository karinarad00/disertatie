require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { initialize } = require("./db");
const userRoutes = require("./routes/userRoutes");
const jobsRoutes = require("./routes/jobsRoutes");
const domeniiRoutes = require("./routes/domeniiRoutes");
const companyRoutes = require("./routes/companyRoutes");
const cacheMiddleware = require("./middleware/cacheMiddleware");
const cvRoute = require("./routes/cvRoute");
const stripePaymentRoute = require("./routes/stripePayment");
const aplicariRoutes = require("./routes/aplicariRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");

const app = express();
const port = 5000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Middleware
app.use(cacheMiddleware);

app.use((req, res, next) => {
  if (req.originalUrl === "/api/stripe/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

initialize();

app.use("/api/users", userRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/domenii", domeniiRoutes);
app.use("/api/companii", companyRoutes);
app.use("/api/cv", cvRoute);
app.use("/api/stripe", stripePaymentRoute);
app.use("/api/aplicari", aplicariRoutes);
app.use("/api/favorites", favoriteRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
