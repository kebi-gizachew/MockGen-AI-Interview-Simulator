const dotenv = require("dotenv");

// Load environment variables before the rest of the app boots.
dotenv.config();

const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  // Frontend base URL (used for verification / OAuth redirect links)
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  // SMTP (email verification). Optional: when absent, emails are logged.
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  mailFrom: process.env.MAIL_FROM || "MockGen AI <no-reply@mockgen.ai>",
  // Google OAuth. Optional: when absent, Google sign-in is hidden.
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/google/callback`,
};

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is required. Add it to your .env file.");
}

if (!env.jwtSecret) {
  throw new Error("JWT_SECRET is required. Add it to your .env file.");
}

module.exports = env;
