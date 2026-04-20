const app = require("./app");
const http = require("http");
const env = require("./config/env");
const prisma = require("./config/db");
const { initializeSocketServer } = require("./sockets");

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL via Prisma");

    const httpServer = http.createServer(app);
    initializeSocketServer(httpServer);

    httpServer.listen(env.port, () => {
      console.log(
        `Server + Socket.io running in ${env.nodeEnv} mode on http://localhost:${env.port}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
