const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const env = require("../config/env");
const HttpError = require("../utils/httpError");

const SALT_ROUNDS = 12;

const hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS);

const comparePassword = async (password, hash) => bcrypt.compare(password, hash);

const generateToken = (userId) =>
  jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt,
});

const registerUser = async ({ email, password, name }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new HttpError(400, "Email and password are required.");
  }

  if (password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new HttpError(409, "An account with this email already exists.");
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      name: name?.trim() || null,
    },
  });

  const token = generateToken(user.id);

  return {
    user: sanitizeUser(user),
    token,
  };
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new HttpError(400, "Email and password are required.");
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const isValidPassword = await comparePassword(password, user.password);

  if (!isValidPassword) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const token = generateToken(user.id);

  return {
    user: sanitizeUser(user),
    token,
  };
};

const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new HttpError(401, "Invalid or expired token.");
  }

  return user;
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  registerUser,
  loginUser,
  getUserById,
};
