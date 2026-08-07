/**
 * Seed the Question table from the bundled question bank.
 * Run: node scripts/seed-questions.js
 */
const prisma = require("../src/config/db");
const questionService = require("../src/services/question.service");

const main = async () => {
  try {
    const count = await questionService.seedQuestions();
    const total = await prisma.question.count();
    console.log(`Seeded/updated ${count} question(s). Total questions in DB: ${total}`);
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
