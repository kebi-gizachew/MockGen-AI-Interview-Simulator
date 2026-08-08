const env = require("../../config/env");
const HttpError = require("../../utils/httpError");
const {
  generateMockInterviewResponse,
  generateMockOpeningQuestion,
  generateMockFinalSummary,
} = require("./providers/mock.provider");
const {
  generateGeminiInterviewResponse,
  generateGeminiOpeningQuestion,
  generateGeminiFinalSummary,
} = require("./providers/gemini.provider");

// Boot-time visibility: log which provider is active so misconfiguration is
// obvious in the server logs (a mock response otherwise looks identical to
// a Gemini response).
const activeProvider =
  env.aiProvider === "mock" || !env.geminiApiKey
    ? "mock"
    : `gemini (${env.geminiModel})`;
console.log(`[ai] active provider: ${activeProvider}`);

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const validateInput = ({ userMessage, interviewContext }) => {
  if (!userMessage || typeof userMessage !== "string") {
    throw new HttpError(400, "userMessage must be a non-empty string.");
  }

  if (
    interviewContext !== undefined &&
    typeof interviewContext !== "string" &&
    !isPlainObject(interviewContext)
  ) {
    throw new HttpError(400, "interviewContext must be a string or plain object.");
  }
};

const validateContext = (interviewContext) => {
  if (
    interviewContext !== undefined &&
    typeof interviewContext !== "string" &&
    !isPlainObject(interviewContext)
  ) {
    throw new HttpError(400, "interviewContext must be a string or plain object.");
  }
};

// Gemini is used when AI_PROVIDER is not "mock" and a GEMINI_API_KEY is
// configured. Any Gemini failure falls back to the mock provider so the
// interview never breaks (same behavior as the previous OpenAI provider).
const executeWithFallback = async (geminiFn, mockFn, args) => {
  if (env.aiProvider !== "mock" && env.geminiApiKey) {
    try {
      return await geminiFn(args);
    } catch (error) {
      console.warn("Gemini provider failed, falling back to mock provider:", error.message);
      return mockFn(args);
    }
  }
  return mockFn(args);
};

const generateInterviewResponse = async ({ userMessage, interviewContext }) => {
  validateInput({ userMessage, interviewContext });
  return executeWithFallback(
    generateGeminiInterviewResponse,
    generateMockInterviewResponse,
    { userMessage, interviewContext }
  );
};

const generateOpeningQuestion = async ({ interviewContext }) => {
  validateContext(interviewContext);
  return executeWithFallback(
    generateGeminiOpeningQuestion,
    generateMockOpeningQuestion,
    { interviewContext }
  );
};

const generateFinalSummary = async ({ interviewContext }) => {
  validateContext(interviewContext);
  return executeWithFallback(
    generateGeminiFinalSummary,
    generateMockFinalSummary,
    { interviewContext }
  );
};

module.exports = {
  generateInterviewResponse,
  generateOpeningQuestion,
  generateFinalSummary,
};
