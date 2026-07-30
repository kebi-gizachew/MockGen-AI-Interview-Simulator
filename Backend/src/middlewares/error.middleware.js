const env = require("../config/env");

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  const message =
    statusCode === 500 && env.nodeEnv === "production"
      ? "Internal Server Error"
      : err.message || "Error";

  res.status(statusCode).json({
    status: "error",
    message,
  });
};

module.exports = errorMiddleware;
