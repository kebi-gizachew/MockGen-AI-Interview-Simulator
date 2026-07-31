const env = require("../../config/env");
const HttpError = require("../../utils/httpError");
const {
  generateMockInterviewResponse,
  generateMockOpeningQuestion,
  generateMockFinalSummary,
} = require("./providers/mock.provider");
const {
  generateOpenAiInterviewResponse,
  generateOpenAiOpeningQuestion,
  generateOpenAiFinalSummary,
} = require("./providers/openai.provider");

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

const executeWithFallback = async (openAiFn, mockFn, args) => {
  if (env.openAiApiKey) {
    try {
      return await openAiFn(args);
    } catch (error) {
      console.warn("OpenAI provider failed, falling back to mock provider:", error.message);
      return mockFn(args);
    }
  }
  return mockFn(args);
};

const generateInterviewResponse = async ({ userMessage, interviewContext }) => {
  validateInput({ userMessage, interviewContext });
  return executeWithFallback(
    generateOpenAiInterviewResponse,
    generateMockInterviewResponse,
    { userMessage, interviewContext }
  );
};

const generateOpeningQuestion = async ({ interviewContext }) => {
  validateContext(interviewContext);
  return executeWithFallback(
    generateOpenAiOpeningQuestion,
    generateMockOpeningQuestion,
    { interviewContext }
  );
};

const generateFinalSummary = async ({ interviewContext }) => {
  validateContext(interviewContext);
  return executeWithFallback(
    generateOpenAiFinalSummary,
    generateMockFinalSummary,
    { interviewContext }
  );
};

module.exports = {
  generateInterviewResponse,
  generateOpeningQuestion,
  generateFinalSummary,
};
