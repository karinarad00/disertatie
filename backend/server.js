const express = require("express");
const app = express();
const cors = require("cors");
const port = 5000;

require("dotenv").config();

// Middleware for parsing JSON request bodies
app.use(express.json());
//cors permission
app.use(cors({ origin: "http://localhost:3000" }));

// Import routers
const userRoutes = require("./routes/userRoutes");
const dataRoutes = require("./routes/dataRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const promotedRoutes = require("./routes/promotedRoutes");
const statsRoutes = require("./routes/statsRoutes");

// Use routers
app.use("/api/user", userRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/favorite", favoriteRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/promoted", promotedRoutes);
app.use("/api/stats", statsRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
