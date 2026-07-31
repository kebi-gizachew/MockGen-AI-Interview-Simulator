const env = require("../config/env");

const getPrismaError = (err) => {
  if (!err?.code?.startsWith("P")) {
    return null;
  }

  switch (err.code) {
    case "P2021":
      return {
        statusCode: 503,
        message: "Database schema is not initialized. Run npm run prisma:migrate.",
      };
    case "P2025":
      return {
        statusCode: 404,
        message: "Record not found.",
      };
    default:
      return {
        statusCode: 500,
        message:
          env.nodeEnv === "production"
            ? "Database error."
            : err.message || "Database error.",
      };
  }
};

const errorMiddleware = (err, req, res, next) => {
  const prismaError = getPrismaError(err);
  const statusCode = prismaError?.statusCode || err.statusCode || 500;

  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  const message =
    prismaError?.message ||
    (statusCode === 500 && env.nodeEnv === "production"
      ? "Internal Server Error"
      : err.message || "Error");

  res.status(statusCode).json({
    status: "error",
    message,
  });
};

module.exports = errorMiddleware;
