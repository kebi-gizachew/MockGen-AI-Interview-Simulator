const prisma = require("../config/db");
const HttpError = require("../utils/httpError");
const { RECOMMENDATIONS, recommendationFromScore } = require("../utils/recommendation");

const normalizeScore = (value, fallback = 0) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
};

const normalizeStringList = (value, fallback = []) => {
  if (!Array.isArray(value)) return fallback;
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 20);
};

// Honesty guard: the persisted recommendation is ALWAYS the score-derived
// verdict, so a recommendation can never be inflated (e.g. "Strong Hire" on a
// score of 50 is impossible). The model's value is logged only when it
// differs, to surface drift in the prompt.
const normalizeRecommendation = (value, score) => {
  const expected = recommendationFromScore(score);
  const candidate = String(value || "").trim();
  if (candidate && candidate !== expected) {
    console.warn(`[feedback] Model recommendation "${candidate}" ignored in favor of score-derived "${expected}".`);
  }
  return expected;
};

const createFeedback = async ({ interviewSessionId, feedback }) => {
  if (!feedback || typeof feedback !== "object") {
    throw new HttpError(500, "AI feedback was not structured correctly.");
  }

  const score = normalizeScore(feedback.score, 0);
  const data = {
    interviewSessionId,
    score,
    problemSolving: normalizeScore(feedback.problemSolving),
    codeQuality: normalizeScore(feedback.codeQuality),
    communication: normalizeScore(feedback.communication),
    optimization: normalizeScore(feedback.optimization),
    recommendation: normalizeRecommendation(feedback.recommendation, score),
    strengths: normalizeStringList(feedback.strengths),
    weaknesses: normalizeStringList(feedback.weaknesses),
    recommendations: normalizeStringList(feedback.recommendations),
    summary: String(feedback.summary || "").trim() || "Interview evaluation summary unavailable.",
  };

  // Upsert avoids a TOCTOU race when endInterview is invoked concurrently.
  return prisma.feedback.upsert({
    where: { interviewSessionId },
    update: data,
    create: data,
  });
};

const getFeedbackBySessionId = async ({ sessionId, userId }) => {
  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });

  if (!session) {
    throw new HttpError(404, "Interview session not found.");
  }

  const feedback = await prisma.feedback.findUnique({
    where: { interviewSessionId: sessionId },
  });

  return feedback;
};

module.exports = {
  createFeedback,
  getFeedbackBySessionId,
};
