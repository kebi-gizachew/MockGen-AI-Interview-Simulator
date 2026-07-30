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

const withProvider = (openAiFn, mockFn) => {
  if (env.openAiApiKey) {
    return openAiFn;
  }
  return mockFn;
};

const generateInterviewResponse = async ({ userMessage, interviewContext }) => {
  validateInput({ userMessage, interviewContext });
  const provider = withProvider(
    generateOpenAiInterviewResponse,
    generateMockInterviewResponse
  );
  return provider({ userMessage, interviewContext });
};

const generateOpeningQuestion = async ({ interviewContext }) => {
  validateContext(interviewContext);
  const provider = withProvider(generateOpenAiOpeningQuestion, generateMockOpeningQuestion);
  return provider({ interviewContext });
};

const generateFinalSummary = async ({ interviewContext }) => {
  validateContext(interviewContext);
  const provider = withProvider(generateOpenAiFinalSummary, generateMockFinalSummary);
  return provider({ interviewContext });
};

module.exports = {
  generateInterviewResponse,
  generateOpeningQuestion,
  generateFinalSummary,
};
