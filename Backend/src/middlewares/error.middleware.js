const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 ? "Internal Server Error" : err.message || "Error";

  res.status(statusCode).json({
    status: "error",
    message,
  });
};

module.exports = errorMiddleware;
