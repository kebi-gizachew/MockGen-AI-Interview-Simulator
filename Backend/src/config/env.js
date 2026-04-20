const dotenv = require("dotenv");

// Load environment variables before the rest of the app boots.
dotenv.config();

const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
};

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is required. Add it to your .env file.");
}

module.exports = env;
