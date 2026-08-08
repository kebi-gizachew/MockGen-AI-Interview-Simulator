const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../config/db");
const env = require("../config/env");
const HttpError = require("../utils/httpError");
const { sendWelcomeEmail, sendVerificationEmail } = require("./email.service");

const SALT_ROUNDS = 12;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS);

const comparePassword = async (password, hash) => bcrypt.compare(password, hash);

const generateToken = (userId) =>
  jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

// Hash verification tokens before storing so a DB leak cannot be used to
// verify arbitrary accounts. The user-facing token travels only via email.
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const generateVerificationToken = () => crypto.randomBytes(32).toString("hex");

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatar: user.avatar ?? null,
  provider: user.provider ?? "email",
  isVerified: Boolean(user.isVerified),
  createdAt: user.createdAt,
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Professional password policy. Every rule must pass; the error message lists
// the exact rules that failed so clients can render them as a live checklist.
const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: "at least 8 characters" },
  { test: (p) => /[A-Z]/.test(p), label: "at least one uppercase letter (A-Z)" },
  { test: (p) => /[a-z]/.test(p), label: "at least one lowercase letter (a-z)" },
  { test: (p) => /\d/.test(p), label: "at least one number (0-9)" },
  {
    test: (p) => /[^A-Za-z0-9]/.test(p),
    label: "at least one special character (e.g. ! @ # $ % ^ & *)",
  },
];

// Returns the labels of the password rules that FAILED (empty when valid).
const validatePasswordStrength = (password) => {
  const value = String(password || "");
  return PASSWORD_RULES.filter((rule) => !rule.test(value)).map((rule) => rule.label);
};

const registerUser = async ({ email, password, name }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new HttpError(400, "Email and password are required.");
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new HttpError(400, "Please provide a valid email address.");
  }

  // Server-side enforcement — frontend validation alone is never enough.
  const failedRules = validatePasswordStrength(password);
  if (failedRules.length > 0) {
    throw new HttpError(
      400,
      `Password must include ${failedRules.join(", ")}.`
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new HttpError(409, "An account with this email already exists.");
  }

  const hashedPassword = await hashPassword(password);

  // Accounts are fully active on registration: a professional welcome email is
  // sent (never a "verify your email" demand), and the verification endpoints
  // remain available for legacy accounts created before this behaviour.
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      name: name?.trim() || null,
      provider: "email",
      isVerified: true,
    },
  });

  // Best-effort email: never fail registration because mail is unavailable.
  try {
    await sendWelcomeEmail({
      to: user.email,
      name: user.name,
    });
  } catch (error) {
    console.warn(
      "[auth] Failed to send welcome email:",
      error && error.message ? error.message : error
    );
  }

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

  if (!user.password) {
    // Account was created via Google — no password set.
    throw new HttpError(401, "This account uses Google sign-in. Please continue with Google.");
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

// Verify an email address using the one-time token from the email link.
const verifyEmail = async ({ token }) => {
  if (!token || typeof token !== "string") {
    throw new HttpError(400, "Verification token is required.");
  }

  const user = await prisma.user.findFirst({
    where: { verificationToken: hashToken(token) },
  });

  if (!user) {
    throw new HttpError(400, "This verification link is invalid or has already been used.");
  }

  if (user.verificationTokenExpires && new Date(user.verificationTokenExpires) < new Date()) {
    throw new HttpError(400, "This verification link has expired. Request a new one.");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    },
  });

  return { user: sanitizeUser(updated) };
};

// Issue a fresh verification token + email (rate-limited at the route level).
const resendVerificationEmail = async ({ email }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new HttpError(400, "Please provide a valid email address.");
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw new HttpError(404, "No account found with this email.");
  }

  if (user.isVerified) {
    throw new HttpError(400, "This account is already verified.");
  }

  if (user.provider === "google") {
    throw new HttpError(400, "Google accounts are verified automatically.");
  }

  const verificationToken = generateVerificationToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationToken: hashToken(verificationToken),
      verificationTokenExpires: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  });

  await sendVerificationEmail({
    to: user.email,
    name: user.name,
    token: verificationToken,
  });

  return { email: user.email };
};

// Google OAuth callback — find or create the user, then issue a JWT.
const googleAuthCallback = async ({ profile }) => {
  const email = String(profile?.emails?.[0]?.value || "").trim().toLowerCase();
  const googleId = String(profile?.id || "");
  const name = profile?.displayName || profile?.name?.givenName || null;
  const avatar = profile?.photos?.[0]?.value || null;

  if (!googleId || !email) {
    throw new HttpError(401, "Google did not return a valid profile.");
  }

  // 1. Existing account by googleId.
  let user = await prisma.user.findUnique({ where: { googleId } });

  // 2. Link to an existing email/password account with the same email.
  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId,
          avatar: avatar ?? byEmail.avatar,
          name: byEmail.name ?? name,
          // Google verified this address — activate the account.
          isVerified: true,
          verificationToken: null,
          verificationTokenExpires: null,
        },
      });
    }
  }

  // 3. Brand-new Google account.
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        googleId,
        name,
        avatar,
        provider: "google",
        password: null,
        isVerified: true,
      },
    });

    // Consistency with email/password registration (Issue 4): every brand-new
    // account gets the welcome email — regardless of the sign-up provider. The
    // welcome template thanks the user, confirms the account, and never asks
    // for email verification. Best-effort: never fail the OAuth callback over
    // mail being unavailable.
    try {
      await sendWelcomeEmail({
        to: user.email,
        name: user.name,
      });
    } catch (error) {
      console.warn(
        "[auth] Failed to send welcome email (google signup):",
        error && error.message ? error.message : error
      );
    }
  }

  const token = generateToken(user.id);
  return { user: sanitizeUser(user), token };
};

const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      provider: true,
      isVerified: true,
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
  verifyEmail,
  resendVerificationEmail,
  googleAuthCallback,
  getUserById,
  validatePasswordStrength,
  PASSWORD_RULES,
};
