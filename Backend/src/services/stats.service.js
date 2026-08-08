const prisma = require("../config/db");
const { SESSION_STATUS } = require("../constants/interview.constants");

// Short-lived in-memory cache: the landing page is hit by every visitor, and
// the counts only change when users register / finish interviews, so serving
// a cached snapshot for up to CACHE_TTL_MS avoids a DB round-trip per view
// (also absorbs Neon cold starts). Counts are aggregate and non-sensitive.
const CACHE_TTL_MS = 60 * 1000;
let cache = { data: null, expiresAt: 0 };

/**
 * Aggregate, public-facing platform statistics.
 *
 * Safe for public access: only aggregate counts are returned — never user
 * records, interview content, or code. Counts are computed in the database
 * (Prisma count), so no rows are pulled into memory.
 */
const getPublicStats = async () => {
  const now = Date.now();
  if (cache.data && now < cache.expiresAt) {
    return cache.data;
  }

  const [registeredUsers, completedInterviews, codeSubmissions] = await Promise.all([
    prisma.user.count(),
    // Only sessions actually finished by the candidate count as completed
    // (status "completed"), not every session that was merely created.
    prisma.interviewSession.count({ where: { status: SESSION_STATUS.COMPLETED } }),
    prisma.codeSubmission.count(),
  ]);

  cache = {
    data: { registeredUsers, completedInterviews, codeSubmissions },
    expiresAt: now + CACHE_TTL_MS,
  };
  return cache.data;
};

module.exports = {
  getPublicStats,
};
