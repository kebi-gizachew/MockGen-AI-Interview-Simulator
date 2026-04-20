const OpenAI = require("openai");
const env = require("../../../config/env");

const OUTPUT_TYPES = {
  QUESTION: "question",
  FEEDBACK: "feedback",
};

const createSystemPrompt = () =>
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

const parseModelResponse = (rawText) => {
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    throw new Error("OpenAI response was not valid JSON.");
  }

  if (
    !parsed ||
    (parsed.type !== OUTPUT_TYPES.QUESTION && parsed.type !== OUTPUT_TYPES.FEEDBACK) ||
    typeof parsed.message !== "string" ||
    typeof parsed.score !== "number"
  ) {
    throw new Error("OpenAI response JSON does not match expected structure.");
  }

  const normalizedScore = Math.max(0, Math.min(100, Math.round(parsed.score)));
  return {
    type: parsed.type,
    message: parsed.message.trim(),
    score: parsed.type === OUTPUT_TYPES.QUESTION ? 0 : normalizedScore,
  };
};

const generateOpenAiInterviewResponse = async ({ userMessage, interviewContext }) => {
  if (!env.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const openai = new OpenAI({ apiKey: env.openAiApiKey });
  const completion = await openai.chat.completions.create({
    model: env.openAiModel,
    temperature: 0.3,
    messages: [
      { role: "system", content: createSystemPrompt() },
      {
        role: "user",
        content: JSON.stringify({
          userMessage,
          interviewContext,
        }),
      },
    ],
  });

  const content = completion?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI did not return any content.");
  }

  return parseModelResponse(content);
};

module.exports = {
  generateOpenAiInterviewResponse,
};
