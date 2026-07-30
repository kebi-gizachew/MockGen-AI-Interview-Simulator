const jwt = require("jsonwebtoken");
const env = require("../config/env");
const authService = require("../services/auth.service");

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required."));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch (error) {
      return next(new Error("Invalid or expired token."));
    }

    const user = await authService.getUserById(decoded.userId);
    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication failed."));
  }
};

module.exports = socketAuthMiddleware;
