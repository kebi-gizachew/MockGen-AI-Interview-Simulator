const prisma = require("../config/db");
const { questions: SEED_QUESTIONS } = require("../data/questions.seed");
const { tierForRank, FREQUENCY_TIERS } = require("../data/company-frequency");
const { DIFFICULTIES } = require("../constants/interview.constants");

/**
 * Interview question selection service.
 *
 * Selection is per-user and adaptive:
 *   - Company interview-frequency dominates: the most frequently reported
 *     questions at the target company are prioritised, then frequent ones,
 *     and only then less common ones. Frequency is per (question, company)
 *     pair via the QuestionCompany many-to-many join.
 *   - A question appears in a company's pool whenever that company is
 *     associated with it (no duplicated rows per company).
 *   - Questions the user already worked on are avoided when possible.
 *   - The user's role biases the topic pool AND the per-question role
 *     relevance metadata (backend -> graphs/DP, etc.).
 *   - Topics where the user historically scored lower get higher weight, so
 *     practice targets weaknesses instead of repeating strengths.
 *   - Difficulty/company filters are applied then relaxed gracefully so a
 *     session always receives a question.
 */

// Role -> topic keywords that are relevant for that role. `null` means "all topics".
const ROLE_TOPICS = {
  "software engineer intern": null,
  "backend engineer": ["arrays", "hash", "strings", "stack", "trees", "graphs", "bfs", "dfs", "dynamic programming", "intervals", "binary search", "greedy", "queue", "union find"],
  "frontend engineer": ["arrays", "hash", "strings", "trees", "stack", "two pointers", "sliding window", "heap"],
  "full stack engineer": ["arrays", "hash", "strings", "stack", "trees", "two pointers", "sliding window", "linked lists"],
  "machine learning engineer": ["arrays", "hash", "strings", "dynamic programming", "two pointers", "sliding window", "graphs", "bfs", "dfs"],
  "data engineer": ["arrays", "hash", "strings", "dynamic programming", "heap", "binary search", "greedy"],
  "data scientist": ["arrays", "hash", "dynamic programming", "two pointers", "sliding window", "greedy"],
};

const getRoleTopics = (role) => {
  if (!role) return null;
  return ROLE_TOPICS[String(role).toLowerCase()] ?? null;
};

// Company -> topic keywords the company is known to emphasize in real interviews.
// Used as a soft boost so company-specific interviews feel authentic, never a
// hard filter (a company must still be able to serve any difficulty).
const COMPANY_TOPICS = {
  google: ["arrays", "hash", "graphs", "trees", "dynamic programming", "binary search", "sliding window", "heap"],
  amazon: ["arrays", "hash", "strings", "two pointers", "greedy", "heap", "union find", "dynamic programming"],
  meta: ["arrays", "hash", "strings", "two pointers", "trees", "dynamic programming", "stack"],
  microsoft: ["arrays", "hash", "trees", "graphs", "binary search", "linked lists", "dynamic programming"],
  apple: ["arrays", "hash", "strings", "trees", "dynamic programming", "binary search", "stack"],
  netflix: ["arrays", "hash", "strings", "two pointers", "sliding window", "backtracking"],
  uber: ["arrays", "hash", "graphs", "trees", "greedy", "binary search", "heap"],
  airbnb: ["arrays", "hash", "strings", "two pointers", "backtracking", "dynamic programming"],
  stripe: ["arrays", "hash", "strings", "dynamic programming", "greedy", "stack", "heap"],
  openai: ["arrays", "hash", "strings", "trees", "dynamic programming", "greedy"],
};

const getCompanyTopics = (company) => {
  if (!company) return null;
  return COMPANY_TOPICS[String(company).toLowerCase()] ?? null;
};

const topicMatchesKeywords = (topic, keywords) => {
  if (!keywords) return true;
  const lower = String(topic || "").toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
};

// Weight multipliers per interview-frequency tier. These make the selection
// feel like a real company screen: while fresh "very_high"/"high" questions
// are available they dominate the pick; once solved (x0.2 penalty below) the
// next highest-ranked available question wins instead.
const FREQUENCY_MULTIPLIER = {
  very_high: 3.0,
  high: 2.0,
  medium: 1.0,
  low: 0.45,
};

/**
 * Frequency weight for a question. Prefers the (question, company) join row
 * when the row was loaded (see getRandomQuestionForUser's include), so a
 * question asked by many companies is ranked by its frequency at the CURRENT
 * company, not its primary company. Falls back to the top-level primary-
 * company values.
 */
const frequencyMultiplier = (question) => {
  const link = question.companies && Array.isArray(question.companies) ? question.companies[0] : null;
  const rank = link ? link.frequencyRank : question.frequencyRank;
  const storedTier = link ? link.interviewFrequency : question.interviewFrequency;
  if (rank == null) return 1.0;
  const tier =
    storedTier && FREQUENCY_TIERS.includes(storedTier) ? storedTier : tierForRank(rank);
  let multiplier = FREQUENCY_MULTIPLIER[tier];
  if (multiplier == null) multiplier = 1.0;
  // Subtle intra-tier preference: within the same tier, earlier ranks still
  // edge out later ones (rank 1 gets +15%, rank 6+ gets +0%).
  multiplier *= 1 + Math.max(0, 1 - (Number(rank) - 1) / 5) * 0.15;
  return multiplier;
};

const slugify = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "company";

/**
 * Upsert the bundled question bank into the database (idempotent). Also syncs
 * the Company table and the QuestionCompany many-to-many links with per-company
 * interview-frequency metadata.
 */
// Run an async function over a list with bounded concurrency. The bundled
// bank can be large; batching this way turns ~1,500 sequential DB round-trips
// (slow against a remote database) into a handful of parallel waves.
const mapLimit = async (items, limit, fn) => {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const index = i++;
      await fn(items[index], index);
    }
  });
  await Promise.all(workers);
};

const seedQuestions = async () => {
  let count = 0;

  // 1. Ensure every company referenced by the bank exists.
  const companyNames = [
    ...new Set(
      SEED_QUESTIONS.flatMap((q) => (q.companies || []).filter(Boolean))
    ),
  ];
  for (const name of companyNames) {
    await prisma.company.upsert({
      where: { name },
      create: { name, slug: slugify(name) },
      update: {},
    });
  }

  // Single lookups so the hot loop never hits the DB per question/link.
  const companyRows = await prisma.company.findMany({ select: { id: true, name: true } });
  const companyIdByName = new Map(companyRows.map((c) => [c.name, c.id]));
  const existingRows = await prisma.question.findMany({ select: { id: true, title: true } });
  const questionIdByTitle = new Map(existingRows.map((q) => [q.title, q.id]));

  // 2. Upsert questions + their company links (idempotent).
  await mapLimit(SEED_QUESTIONS, 8, async (question) => {
    const companies = (question.companies || []).filter(Boolean);
    const primary = question.company || companies[0] || null;

    const data = {
      title: question.title,
      description: question.description,
      difficulty: question.difficulty,
      topic: question.topic,
      company: primary,
      frequencyRank: question.frequencyRank ?? null,
      interviewFrequency: question.interviewFrequency ?? null,
      roles: question.roles ?? [],
      functionName: question.functionName,
      argTypes: question.argTypes ?? null,
      examples: question.examples,
      constraints: question.constraints,
      testCases: question.testCases,
      starterCode: question.starterCode,
    };

    const existingId = questionIdByTitle.get(question.title);
    const saved = existingId
      ? await prisma.question.update({ where: { id: existingId }, data })
      : await prisma.question.create({ data });
    if (!existingId) {
      count += 1;
      questionIdByTitle.set(question.title, saved.id);
    }

    // Sync many-to-many company links with per-company frequency metadata.
    for (const company of companies) {
      const companyId = companyIdByName.get(company);
      if (!companyId) continue;
      const freq = (question.companyFrequencies && question.companyFrequencies[company]) || {};
      await prisma.questionCompany.upsert({
        where: {
          questionId_companyId: {
            questionId: saved.id,
            companyId,
          },
        },
        create: {
          questionId: saved.id,
          companyId,
          frequencyRank: freq.frequencyRank ?? null,
          interviewFrequency: freq.interviewFrequency ?? null,
        },
        update: {
          frequencyRank: freq.frequencyRank ?? null,
          interviewFrequency: freq.interviewFrequency ?? null,
        },
      });
    }
  });

  return count;
};

const normalizeDifficulty = (difficulty) => {
  if (!difficulty) return undefined;
  const lower = String(difficulty).toLowerCase();
  return DIFFICULTIES.includes(lower) ? lower : undefined;
};

/**
 * Gather this user's question history: which question ids they have already
 * worked on, and their average score per topic (for weakness weighting).
 */
const getUserHistory = async (userId) => {
  const usedIds = new Set();
  const topicScores = {};
  // Only the most recent question ids (oldest first). Used for recency
  // weighting so questions from the last few sessions are penalised harder
  // than ones tried long ago.
  const recentIds = [];
  const RECENT_LIMIT = 8;

  if (!userId) return { usedIds, topicScores, recentIds: [] };

  try {
    const sessions = await prisma.interviewSession.findMany({
      where: { userId, questionId: { not: null } },
      select: {
        questionId: true,
        score: true,
        startedAt: true,
        question: { select: { topic: true } },
      },
      orderBy: { startedAt: "asc" },
    });

    for (const session of sessions) {
      if (session.questionId) {
        usedIds.add(session.questionId);
        recentIds.push(session.questionId);
      }
      if (session.score != null && session.question?.topic) {
        const topic = session.question.topic;
        (topicScores[topic] = topicScores[topic] || []).push(session.score);
      }
    }
  } catch (error) {
    console.warn("Failed to load user question history:", error.message);
  }

  return { usedIds, topicScores, recentIds: recentIds.slice(-RECENT_LIMIT) };
};

const average = (values) =>
  values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;

/**
 * Weighted random pick. Candidates preferred: frequently reported company
 * questions (per-company frequencyRank/interviewFrequency), in-role topics,
 * company-relevant topics, role-relevant questions, weaker topics, and
 * questions not previously attempted. Recent picks are penalised so rotation
 * feels varied. Random jitter keeps picks varied.
 */
const pickWeighted = (candidates, { usedIds, topicScores, roleTopics, companyTopics, recentIds, role }) => {
  const recent = new Set(recentIds || []);

  const weights = candidates.map((question) => {
    // Company interview-frequency is the dominant factor: most frequently
    // reported questions are picked first, less common ones only after those
    // are exhausted (or already solved by this user).
    let weight = frequencyMultiplier(question);

    if (topicMatchesKeywords(question.topic, roleTopics)) weight *= 1.4;
    if (topicMatchesKeywords(question.topic, companyTopics)) weight *= 1.3;

    // Per-question role relevance: when the user selected a role, questions
    // marked relevant to it get a boost and clearly irrelevant ones a small
    // penalty (never enough to override company-frequency ordering).
    if (role && Array.isArray(question.roles) && question.roles.length > 0) {
      if (question.roles.includes(role)) weight *= 1.25;
      else weight *= 0.9;
    }

    const scores = topicScores[question.topic];
    if (scores && scores.length > 0) {
      const avg = average(scores);
      // Weak-topic boost is multiplicative and capped so it can never override
      // the company-frequency ordering: a fresh frequent question always beats
      // a rare question, even in a historically weak topic.
      weight *= 1 + Math.min(0.8, (100 - avg) / 50);
    }

    if (usedIds.has(question.id)) weight *= 0.2;
    // Seen very recently: strongly penalised so interviews keep feeling fresh.
    if (recent.has(question.id)) weight *= 0.35;

    return weight;
  });

  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
};

/**
 * Select a question for a specific user, considering their history, role,
 * performance and the requested difficulty/company.
 */
const getRandomQuestionForUser = async ({ userId, difficulty, company, role, topic } = {}) => {
  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const { usedIds, topicScores, recentIds } = await getUserHistory(userId);
  const roleTopics = getRoleTopics(role);
  const companyTopics = getCompanyTopics(company);

  // Lazy-sync the DB bank on first access. The bundled bank is the source of
  // truth: whenever the database holds fewer questions than the bank, or fewer
  // many-to-many company links than the bank declares, the idempotent seeder
  // upserts the missing rows. This covers fresh databases, databases seeded
  // before the company-expansion feature existed, and deployments that add new
  // questions to the bank later (the migration backfill alone only ever links
  // each question to its primary company).
  try {
    const total = await prisma.question.count();
    const expectedLinks = SEED_QUESTIONS.reduce(
      (sum, q) => sum + (q.companies || []).filter(Boolean).length,
      0
    );
    const linkCount = await prisma.questionCompany.count();
    if (total < SEED_QUESTIONS.length || linkCount < expectedLinks) {
      const seeded = await seedQuestions();
      if (seeded > 0) {
        console.log(`Seeded ${seeded} new question(s) / synced company links.`);
      } else {
        console.log("Synced many-to-many company links.");
      }
    } else {
      const missingFrequency = await prisma.question.count({
        where: { frequencyRank: null },
      });
      if (missingFrequency > 0) {
        await seedQuestions();
        console.log(`Backfilled interview-frequency metadata on ${missingFrequency} question(s).`);
      }
    }
  } catch (error) {
    console.warn("Question DB check failed:", error.message);
  }

  let questions = [];

  // Candidate query chain: relax topic/company/difficulty one at a time so a
  // question is always found, preferring the most specific match.
  const attemptQueries = [];
  const seenQueries = new Set();
  const addQuery = (difficultyOn, topicOn, companyOn) => {
    const where = {};
    if (difficultyOn && normalizedDifficulty) where.difficulty = normalizedDifficulty;
    if (topicOn && topic) where.topic = { contains: topic, mode: "insensitive" };
    if (companyOn && company) {
      // Many-to-many: the question is in the company's pool when any of its
      // QuestionCompany links points at that company.
      where.companies = { some: { company: { name: company } } };
    }
    const key = JSON.stringify(where);
    if (!seenQueries.has(key)) {
      seenQueries.add(key);
      attemptQueries.push(where);
    }
  };
  addQuery(true, true, true);
  addQuery(true, true, false);
  addQuery(true, false, true);
  addQuery(true, false, false);
  addQuery(false, false, false);

  try {
    for (const where of attemptQueries) {
      questions = await prisma.question.findMany({
        where,
        // Load only the join row for the target company so the frequency
        // multiplier ranks by this company's frequency for that question.
        ...(company
          ? {
              include: {
                companies: {
                  where: { company: { name: company } },
                  select: { frequencyRank: true, interviewFrequency: true },
                },
              },
            }
          : {}),
      });
      if (questions.length > 0) break;
    }
  } catch (error) {
    console.warn("Question DB lookup failed, using in-memory bank:", error.message);
    questions = [];
  }

  // In-memory fallback (DB unavailable or unseeded).
  if (questions.length === 0) {
    let pool = SEED_QUESTIONS;
    if (normalizedDifficulty) pool = pool.filter((q) => q.difficulty === normalizedDifficulty);
    if (topic) {
      const withTopic = pool.filter((q) =>
        q.topic.toLowerCase().includes(String(topic).toLowerCase())
      );
      if (withTopic.length > 0) pool = withTopic;
    }
    if (company) {
      const withCompany = pool.filter(
        (q) => (q.companies || []).includes(company) || q.company === company
      );
      if (withCompany.length > 0) pool = withCompany;
    }
    questions = pool;
  }

  // Prefer questions not yet attempted, but only if a varied pool remains.
  const fresh = questions.filter((q) => !usedIds.has(q.id));
  const pool = fresh.length >= 2 ? fresh : questions;
  return pickWeighted(pool, { usedIds, topicScores, roleTopics, companyTopics, recentIds, role });
};

/**
 * Plain random question (no user context / public endpoint).
 */
const getRandomQuestion = async ({ difficulty, topic, company } = {}) => {
  return getRandomQuestionForUser({ difficulty, topic, company, userId: null });
};

module.exports = {
  seedQuestions,
  getRandomQuestion,
  getRandomQuestionForUser,
  ROLE_TOPICS,
};
