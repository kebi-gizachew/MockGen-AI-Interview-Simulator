const { AI_RESPONSE_TYPES } = require("../../../constants/interview.constants");

const normalizeContext = (interviewContext) => {
  if (!interviewContext) return "";
  if (typeof interviewContext === "string") return interviewContext;

  try {
    return JSON.stringify(interviewContext);
  } catch (error) {
    return String(interviewContext);
  }
};

const generateMockInterviewResponse = async ({ userMessage, interviewContext }) => {
  const lowerMessage = String(userMessage || "").toLowerCase();
  const context = normalizeContext(interviewContext).toLowerCase();
  const shouldReturnFeedback =
    lowerMessage.includes("answer") ||
    lowerMessage.includes("solution") ||
    context.includes("review");

  if (shouldReturnFeedback) {
    return {
      type: AI_RESPONSE_TYPES.FEEDBACK,
      message:
        "Good attempt. Clarify trade-offs and mention time/space complexity for a stronger interview response.",
      score: 72,
    };
  }

  return {
    type: AI_RESPONSE_TYPES.QUESTION,
    message:
      "Design a rate limiter for a high-traffic API. Explain your data model and how you handle distributed servers.",
    score: 0,
  };
};

const generateMockOpeningQuestion = async ({ interviewContext }) => {
  const title = interviewContext?.title || "Mock Interview";

  return {
    type: AI_RESPONSE_TYPES.QUESTION,
    message: `Welcome to your ${title}. Let's begin with a warm-up: explain the difference between concurrency and parallelism, and when you would choose each approach.`,
    score: 0,
  };
};

const generateMockFinalSummary = async ({ interviewContext }) => {
  const messageCount = interviewContext?.history?.length || 0;

  return {
    type: AI_RESPONSE_TYPES.SUMMARY,
    message: `Interview complete. You answered ${messageCount} exchanges. Strengths: clear communication and structured thinking. Areas to improve: dive deeper into trade-offs and quantify complexity when discussing solutions.`,
    score: 75,
  };
};

module.exports = {
  generateMockInterviewResponse,
  generateMockOpeningQuestion,
  generateMockFinalSummary,
};
