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
const stripePaymentRoute = require("./routes/stripePayment");



const app = express();
const port = 5000;

// Middleware
app.use(cacheMiddleware);

app.use(cors({ origin: "http://localhost:3000" }));
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
app.use("/api/companii", companyRoutes);
app.use("/api/cv", uploadCvRoute);
app.use("/api/stripe", stripePaymentRoute);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
