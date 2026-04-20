const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/health.routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/", healthRoutes);

// Centralized error handling (must be registered last)
app.use(errorMiddleware);

module.exports = app;
