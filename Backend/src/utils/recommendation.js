/**
 * Hiring recommendation bands — the single source of truth used by both AI
 * providers and the feedback normalizer, so a recommendation can NEVER
 * disagree with the score that produced it.
 *
 * These read like a real hiring committee: a candidate who passes everything
 * and explains well is a Strong Hire; one who never produced runnable code or
 * failed most tests lands in Needs Improvement / Not Ready Yet (the scoring
 * caps in the providers guarantee those cases cannot reach Hire bands).
 */

const RECOMMENDATIONS = {
  STRONG_HIRE: "Strong Hire",
  HIRE: "Hire",
  LEANING_HIRE: "Leaning Hire",
  NEEDS_IMPROVEMENT: "Needs Improvement",
  NOT_READY: "Not Ready Yet",
};

const recommendationFromScore = (score) => {
  const value = Number(score);
  if (!Number.isFinite(value)) return RECOMMENDATIONS.NEEDS_IMPROVEMENT;
  if (value >= 85) return RECOMMENDATIONS.STRONG_HIRE;
  if (value >= 70) return RECOMMENDATIONS.HIRE;
  if (value >= 55) return RECOMMENDATIONS.LEANING_HIRE;
  if (value >= 40) return RECOMMENDATIONS.NEEDS_IMPROVEMENT;
  return RECOMMENDATIONS.NOT_READY;
};

module.exports = {
  RECOMMENDATIONS,
  recommendationFromScore,
};
