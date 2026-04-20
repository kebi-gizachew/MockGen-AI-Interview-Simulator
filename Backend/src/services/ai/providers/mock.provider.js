const OUTPUT_TYPES = {
  QUESTION: "question",
  FEEDBACK: "feedback",
};

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
      type: OUTPUT_TYPES.FEEDBACK,
      message:
        "Good attempt. Clarify trade-offs and mention time/space complexity for a stronger interview response.",
      score: 72,
    };
  }

  return {
    type: OUTPUT_TYPES.QUESTION,
    message:
      "Design a rate limiter for a high-traffic API. Explain your data model and how you handle distributed servers.",
    score: 0,
  };
};

module.exports = {
  generateMockInterviewResponse,
};
