const env = require("../../config/env");
const {
  generateMockInterviewResponse,
} = require("./providers/mock.provider");
const {
  generateOpenAiInterviewResponse,
} = require("./providers/openai.provider");

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const validateInput = ({ userMessage, interviewContext }) => {
  if (!userMessage || typeof userMessage !== "string") {
    throw new Error("userMessage must be a non-empty string.");
  }

  if (
    interviewContext !== undefined &&
    typeof interviewContext !== "string" &&
    !isPlainObject(interviewContext)
  ) {
    throw new Error("interviewContext must be a string or plain object.");
  }
};

// Public reusable API for generating interview prompts/feedback.
const generateInterviewResponse = async ({ userMessage, interviewContext }) => {
  validateInput({ userMessage, interviewContext });

  if (env.openAiApiKey) {
    return generateOpenAiInterviewResponse({ userMessage, interviewContext });
  }

  return generateMockInterviewResponse({ userMessage, interviewContext });
};

module.exports = {
  generateInterviewResponse,
};
