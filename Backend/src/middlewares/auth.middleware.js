const jwt = require("jsonwebtoken");
const env = require("../config/env");
const HttpError = require("../utils/httpError");
const authService = require("../services/auth.service");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpError(401, "Authentication required.");
    }

    const token = authHeader.slice(7);

    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch (error) {
      throw new HttpError(401, "Invalid or expired token.");
    }

    if (!decoded || !decoded.userId) {
      throw new HttpError(401, "Invalid or expired token.");
    }

    const user = await authService.getUserById(decoded.userId);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
