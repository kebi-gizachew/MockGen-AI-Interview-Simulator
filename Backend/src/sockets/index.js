const { Server } = require("socket.io");
const { registerChatSocketHandlers } = require("./chat.socket");

const initializeSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    registerChatSocketHandlers(io, socket);
  });

  return io;
};

module.exports = {
  initializeSocketServer,
};
