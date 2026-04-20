const prisma = require("../config/db");

const getHealthStatus = async () => {
  // Lightweight DB ping verifies Prisma + PostgreSQL connectivity.
  await prisma.$queryRaw`SELECT 1`;

  return {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  getHealthStatus,
};
