const OpenAI = require("openai");
const env = require("../../../config/env");
const { AI_RESPONSE_TYPES } = require("../../../constants/interview.constants");

const createChatSystemPrompt = () =>
  [
    "You are an AI Interview Coach.",
    "Return ONLY valid JSON with this exact shape:",
    '{ "type": "question | feedback", "message": "string", "score": number }',
    "Rules:",
    '- "type" must be either "question" or "feedback".',
    '- If type is "question", score should be 0.',
    '- If type is "feedback", score should be an integer between 0 and 100.',
    "- Keep message concise and interview-focused.",
  ].join("\n");

const createOpeningSystemPrompt = () =>
  [
    "You are an AI Interview Coach starting a mock technical interview.",
    "Return ONLY valid JSON with this exact shape:",
    '{ "type": "question", "message": "string", "score": 0 }',
    "Rules:",
    "- Greet the candidate briefly and ask one strong opening technical question.",
    "- Tailor the question to the interview title when provided.",
    "- score must always be 0.",
  ].join("\n");

const createSummarySystemPrompt = () =>
  [
    "You are an AI Interview Coach providing a final interview debrief.",
    "Return ONLY valid JSON with this exact shape:",
    '{ "type": "summary", "message": "string", "score": number }',
    "Rules:",
    '- "type" must be "summary".',
    "- Summarize strengths, weaknesses, and concrete next steps.",
    "- score must be an integer between 0 and 100 representing overall performance.",
  ].join("\n");

let openaiClientInstance = null;

const getOpenAiClient = () => {
  if (!env.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }
  if (!openaiClientInstance) {
    openaiClientInstance = new OpenAI({ apiKey: env.openAiApiKey });
  }
  return openaiClientInstance;
};

const parseModelResponse = (rawText, allowedTypes) => {
  let parsed;
  try {
    const cleanedText = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    parsed = JSON.parse(cleanedText);
  } catch (error) {
    throw new Error("OpenAI response was not valid JSON.");
  }

  if (
    !parsed ||
    !allowedTypes.includes(parsed.type) ||
    typeof parsed.message !== "string" ||
    typeof parsed.score !== "number"
  ) {
    throw new Error("OpenAI response JSON does not match expected structure.");
  }

  const normalizedScore = Math.max(0, Math.min(100, Math.round(parsed.score)));
  const score =
    parsed.type === AI_RESPONSE_TYPES.QUESTION ? 0 : normalizedScore;

  return {
    type: parsed.type,
    message: parsed.message.trim(),
    score,
  };
};

const callOpenAi = async ({ systemPrompt, payload }) => {
  const openai = getOpenAiClient();
  const completion = await openai.chat.completions.create({
    model: env.openAiModel,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(payload) },
    ],
  });

  const content = completion?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI did not return any content.");
  }

  return content;
};

const generateOpenAiInterviewResponse = async ({ userMessage, interviewContext }) => {
  const content = await callOpenAi({
    systemPrompt: createChatSystemPrompt(),
    payload: { userMessage, interviewContext },
  });

  return parseModelResponse(content, [
    AI_RESPONSE_TYPES.QUESTION,
    AI_RESPONSE_TYPES.FEEDBACK,
  ]);
};

const generateOpenAiOpeningQuestion = async ({ interviewContext }) => {
  const content = await callOpenAi({
    systemPrompt: createOpeningSystemPrompt(),
    payload: { interviewContext },
  });

  return parseModelResponse(content, [AI_RESPONSE_TYPES.QUESTION]);
};

const generateOpenAiFinalSummary = async ({ interviewContext }) => {
  const content = await callOpenAi({
    systemPrompt: createSummarySystemPrompt(),
    payload: { interviewContext },
  });

  return parseModelResponse(content, [AI_RESPONSE_TYPES.SUMMARY]);
};

module.exports = {
  generateOpenAiInterviewResponse,
  generateOpenAiOpeningQuestion,
  generateOpenAiFinalSummary,
};
