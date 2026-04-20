const { PrismaClient } = require("@prisma/client");

// Single Prisma client instance shared across the application.
const prisma = new PrismaClient();

module.exports = prisma;
