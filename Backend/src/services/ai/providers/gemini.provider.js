/**
 * Gemini AI provider.
 *
 * Calls Google's Gemini API through its OpenAI-compatible endpoint
 * (https://generativelanguage.googleapis.com/v1beta/openai/) using the
 * official OpenAI Node SDK, so the request/response contract is identical
 * to a standard OpenAI call. Configured via env: AI_PROVIDER,
 * GEMINI_API_KEY, GEMINI_MODEL.
 */

const OpenAI = require("openai");
const env = require("../../../config/env");
const { AI_RESPONSE_TYPES } = require("../../../constants/interview.constants");
const { RECOMMENDATIONS, recommendationFromScore } = require("../../../utils/recommendation");
const { analyzeAnswer } = require("../answer-analysis");

const GEMINI_OPENAI_COMPAT_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/";

const STAGE_GUIDANCE = {
  opening: [
    "The interview has just started. Present the problem from interviewContext.question and ask the candidate to explain their approach BEFORE writing code.",
    "Ask one focused question at a time: first their high-level approach, then edge cases, then expected time/space complexity.",
  ],
  approach: [
    "The candidate has started talking. Interview stage: approach discussion (no code submitted yet).",
    "Probe their plan like a senior interviewer: ask about the naive vs optimal solution, data structures, edge cases, and expected complexity.",
    "Do NOT ask them to write code yet if their approach is still unclear. Keep them talking through the plan first.",
  ],
  post_submission: [
    "The candidate has submitted code (see interviewContext.codeSubmissions). Reference their ACTUAL code and test results.",
    "Follow up like a real interviewer based on the evidence:",
    "- If tests failed: ask them to debug — which test fails, what the expected vs actual output is, and to walk through the logic.",
    "- If all tests pass: ask a follow-up such as: can you optimize this (better time/space)? what happens with very large input? can you explain this part of your implementation? why did you choose this data structure?",
    "- If there is a compile/runtime error: point them at the error and ask them to fix it.",
    "Provide a hint only when the candidate explicitly asks; never write the solution for them.",
  ],
};

const createChatSystemPrompt = (stage) =>
  [
    "You are a senior software engineer conducting a realistic coding interview. Be professional, supportive, but honest — like a real FAANG interviewer.",
    "The candidate solves the problem in interviewContext.question. Use the transcript (interviewContext.history) and submitted code to stay grounded.",
    ...(STAGE_GUIDANCE[stage] || STAGE_GUIDANCE.opening),
    "Communication matters: notice whether the candidate explains reasoning, states complexity, and handles pushback.",
    "Ground each follow-up in the candidate's most recent answer — quote or paraphrase their own words so they can see you are listening. Never answer a question they already answered, and never re-ask it.",
    "ANSWER-EVALUATION GATE (do this before every reply): interviewContext.pendingQuestion is your most recent question and the candidate's latest message is their reply to it. Determine whether they actually answered it: fully, partially, not at all, misunderstood, avoided, or changed the topic.",
    "- If the candidate did NOT answer the pending question (changed topic, answered something unrelated, or gave filler): DO NOT move on. Say the question was not answered, rephrase it, and probe the SAME topic from a different angle. Stay there until there is evidence they understand it.",
    "- If they answered partially: confirm the correct part, then push specifically on the unanswered part.",
    "- If they misunderstood the question: clarify what you were actually asking, then re-ask.",
    "- Only move to a new topic once the current one is demonstrably understood. Never assume a question was answered just because the candidate wrote something.",
    "ANSWER-ANALYSIS ANCHOR: interviewContext.answerAnalysis is a deterministic read of the candidate's latest message — category (hint_request | dont_know | off_topic | filler | incorrect | correct | substantive), whether the pending question was answered, mentioned algorithms, complexity claims, and a structured wrong-claim correction. Treat it as a starting point, NEVER a substitute for reading the candidate's actual words. If the analysis says 'incorrect' with a correction, respond to the wrong claim directly with the correct fact.",
    "READ-THE-ANSWER RULE: your reply MUST depend on the candidate's exact message. Quote or paraphrase their own words before responding. Different answers to the same question must produce visibly different replies:",
    "- Correct explanation (e.g. 'I use a hashmap because it allows O(1) average lookup'): confirm the specific fact and chain to the next step — 'Good — hash map lookups average O(1). Can you explain why that improves the complexity compared to checking every pair with nested loops?'",
    "- Incorrect explanation (e.g. 'A hashmap makes this O(log n)'): correct it concretely — 'Let's revisit that. Hash map lookup is usually O(1) average case. Can you explain how that affects the overall complexity?' — never move on silently.",
    "- Incomplete answer (e.g. 'I think a sliding window works'): push on the missing reasoning — 'Why does a sliding window apply to this problem? What condition allows the window to expand or shrink?'",
    "- No answer (e.g. 'I don't know'): do not praise. Break it down — 'That's okay. Let's break it down. What is the simplest brute-force approach you can think of?' then narrow to one concept at a time.",
    "- Any other substantive answer: respond to the SPECIFIC content (the data structure they named, the complexity they claimed, the edge case they raised) with the next logical probing question.",
    "NEVER give empty compliments. If an answer is weak, wrong, or absent, say so honestly and help them move forward. 'Solid answer', 'Great job', 'Thanks for the discussion' are forbidden as reactions to non-answers.",
    "When the candidate says 'I don't know' / 'not sure' / 'no idea' (check interviewContext.performanceSignals.dontKnowResponses):",
    "- Do NOT praise the answer. Guide learning with concrete questions, one step at a time.",
    "- First: ask what part is confusing (input/output vs how to start), or ask for the brute-force approach, or ask them to identify the input and expected output for Example 1.",
    "- Then: narrow to a single concept they can answer (e.g. 'What is the average lookup complexity of a hash map?'), and after they answer, build on it ('Correct — O(1). Given that, how does it affect the overall complexity?').",
    "- Explain a concept only when it unblocks them; otherwise keep them thinking.",
    "When the candidate answers CORRECTLY: confirm the specific fact and chain to the next step (e.g. 'Correct — hash map lookups average O(1). Given that, how does that change the overall complexity of your approach?'). Do not just say 'good'.",
    "When the candidate answers INCORRECTLY: point out the specific error and let them correct it; do not quietly move on.",
    "Verify the candidate's claims like a real interviewer:",
    "- If they name a data structure or algorithm, ask them to justify it against the naive alternative (e.g. 'You chose a hash map — why does O(1) lookup beat the brute-force O(n²) scan here?').",
    "- If they state a time/space complexity, check it against the algorithm they described. When it is wrong, push back concretely (e.g. 'You mentioned O(n), but the nested loop suggests O(n²) — can you walk me through it?').",
    "- If they miss edge cases (empty input, duplicates, large inputs), ask them what could break the solution.",
    "NEVER repeat a question you have already asked. interviewContext.askedQuestions lists the assistant questions already asked in this session; if your intended question matches one of them (same topic or phrasing), ask a different, deeper follow-up instead.",
    "Return ONLY valid JSON with this exact shape:",
    '{ "type": "question | feedback", "message": "string", "score": number }',
    "Rules:",
    '- "type" must be "question" or "feedback".',
    '- If type is "question", score must be 0.',
    '- If type is "feedback" (a substantive evaluation of their answer), score must be an honest integer 0-100 reflecting their communication and solution quality in THIS exchange.',
    '- Anchor feedback scores to interviewContext.performanceSignals: test pass rate (passed vs failed), hints requested, whether the approach/complexity/edge cases were discussed, and how the candidate improved across submissions. Never return fixed or template scores — two candidates with different evidence must get different scores.',
    "- Keep messages concise (2-4 sentences) and interview-focused. Ask ONE question at a time.",
    "- Never ask the same question twice; escalate to a deeper angle (edge cases, complexity, trade-offs) once a topic is covered.",
  ].join("\n");

const createOpeningSystemPrompt = () =>
  [
    "You are an AI Interview Coach starting a mock technical interview.",
    "Return ONLY valid JSON with this exact shape:",
    '{ "type": "question", "message": "string", "score": 0 }',
    "Rules:",
    "- Greet the candidate briefly and ask one strong opening technical question.",
    "- Tailor the question to the interview context when provided.",
    "- score must always be 0.",
  ].join("\n");

const createSummarySystemPrompt = () =>
  [
    "You are a senior interviewer writing the final debrief for a coding interview. Be honest and specific — never inflate scores.",
    "interviewContext.performanceSignals contains objective measurements you MUST anchor your scoring to:",
    "- bestTestPassRate / firstPassRate / lastPassRate: fraction of hidden test cases the submitted code passed (null = no submission).",
    "- improvedAcrossSubmissions: whether later submissions fixed earlier mistakes (reward this).",
    "- hintsRequested: number of times the candidate asked for hints (penalize).",
    "- approachDiscussed: whether they explained their plan before coding (reward).",
    "- complexityStated: whether they stated time/space complexity (reward).",
    "- edgeCasesDiscussed: whether they reasoned about edge cases (reward).",
    "- userMessageCount / avgUserMessageLength: communication depth.",
    "- dontKnowResponses: number of \"I don't know\"-style replies (heavy penalty — evidence of no progress).",
    "- Never return fixed or template scores. Two interviews with different signals must produce different scores, and each sub-score must move with its signal.",
    "ZERO-BASED scoring — there is no baseline:",
    "- Every sub-score starts at 0; points are earned ONLY from demonstrated progress (passing tests, explaining an approach, stating complexity, discussing edge cases, improving after feedback).",
    "- A candidate who produced no code, no approach, and no meaningful explanation must score near 0 (0-5). Completing or attending the interview itself earns nothing.",
    "- Repeatedly answering \"I don't know\" (see dontKnowResponses) must yield a very low score (0-5) and must be called out in weaknesses/recommendations.",
    "- Partial credit for incomplete code only when there is real evidence of problem solving (some tests passing, a reasoned approach).",
    "- Do NOT invent strengths: if there is nothing genuinely positive, return an EMPTY 'strengths' array.",
    "Scoring guidance (out of 100):",
    "- Correctness dominates: a candidate passing all tests scores substantially higher than one whose code fails or does not run.",
    "- A solution that never compiles/runs or misses every test cannot score above ~50 regardless of communication.",
    "- Each hint requested and each unstated complexity should visibly lower the relevant sub-scores.",
    "- A candidate who barely attempted the problem (no runnable submission, no approach discussion) must receive a low score.",
    "Hiring recommendation (must match the score exactly):",
    `- score >= 85: "${RECOMMENDATIONS.STRONG_HIRE}"`,
    `- score >= 70: "${RECOMMENDATIONS.HIRE}"`,
    `- score >= 55: "${RECOMMENDATIONS.LEANING_HIRE}"`,
    `- score >= 40: "${RECOMMENDATIONS.NEEDS_IMPROVEMENT}"`,
    `- score < 40: "${RECOMMENDATIONS.NOT_READY}"`,
    "- Never recommend positively for an interview that never produced runnable, passing code.",
    "Return ONLY valid JSON with this exact shape:",
    '{ "type": "summary", "message": "string", "score": number, "problemSolving": number, "codeQuality": number, "communication": number, "optimization": number, "recommendation": "Strong Hire | Hire | Leaning Hire | Needs Improvement | Not Ready Yet", "strengths": ["..."], "weaknesses": ["..."], "recommendations": ["..."] }',
    "Rules:",
    '- "type" must be "summary".',
    '- "message" is a concise overall debrief paragraph (3-5 sentences) — honest, professional, supportive, and specific about what happened in THIS interview.',
    "- All scores are integers between 0 and 100 and must be consistent with the performance signals.",
    '- "strengths", "weaknesses" and "recommendations" are arrays of 2-4 concise strings each, referencing actual evidence from the transcript or code.',
    "- The overall score should be a sensible blend of the four sub-scores (correctness matters most).",
    `- "recommendation" must be exactly one of: ${Object.values(RECOMMENDATIONS).join(" | ")} and must match the score band above.`,
  ].join("\n");

let geminiClientInstance = null;

const getGeminiClient = () => {
  if (!env.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }
  if (!geminiClientInstance) {
    geminiClientInstance = new OpenAI({
      apiKey: env.geminiApiKey,
      baseURL: GEMINI_OPENAI_COMPAT_BASE_URL,
    });
  }
  return geminiClientInstance;
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
    throw new Error("Gemini response was not valid JSON.");
  }

  if (
    !parsed ||
    !allowedTypes.includes(parsed.type) ||
    typeof parsed.message !== "string" ||
    typeof parsed.score !== "number"
  ) {
    throw new Error("Gemini response JSON does not match expected structure.");
  }

  const clamp = (value, fallback) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(0, Math.min(100, Math.round(num)));
  };

  const list = (value) => {
    if (!Array.isArray(value)) return [];
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 8);
  };

  const normalizedScore = clamp(parsed.score, 0);
  const score = parsed.type === AI_RESPONSE_TYPES.QUESTION ? 0 : normalizedScore;

  return {
    type: parsed.type,
    message: parsed.message.trim(),
    score,
    // Structured feedback fields (only populated for summaries)
    problemSolving: clamp(parsed.problemSolving, 0),
    codeQuality: clamp(parsed.codeQuality, 0),
    communication: clamp(parsed.communication, 0),
    optimization: clamp(parsed.optimization, 0),
    // The verdict must match the score band exactly; anything else (model
    // drift or inflation) is corrected to the score-derived verdict. The
    // feedback service re-enforces this at persist time.
    recommendation:
      Object.values(RECOMMENDATIONS).includes(parsed.recommendation) &&
      parsed.recommendation === recommendationFromScore(normalizedScore)
        ? parsed.recommendation
        : recommendationFromScore(normalizedScore),
    strengths: list(parsed.strengths),
    weaknesses: list(parsed.weaknesses),
    recommendations: list(parsed.recommendations),
  };
};

const callGemini = async ({ systemPrompt, payload }) => {
  const gemini = getGeminiClient();
  const completion = await gemini.chat.completions.create({
    model: env.geminiModel,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(payload) },
    ],
  });

  const content = completion?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Gemini did not return any content.");
  }

  return content;
};

const generateGeminiInterviewResponse = async ({ userMessage, interviewContext }) => {
  // Safety net: if the caller did not attach answerAnalysis, compute it here so
  // the model is always anchored to a structured read of the candidate's reply.
  const context = interviewContext?.answerAnalysis
    ? interviewContext
    : {
        ...interviewContext,
        answerAnalysis: analyzeAnswer({
          userMessage,
          pendingQuestion: interviewContext?.pendingQuestion,
          question: interviewContext?.question,
          history: interviewContext?.history,
        }),
      };

  const content = await callGemini({
    systemPrompt: createChatSystemPrompt(context?.stage || "opening"),
    payload: { userMessage, interviewContext: context },
  });

  return parseModelResponse(content, [
    AI_RESPONSE_TYPES.QUESTION,
    AI_RESPONSE_TYPES.FEEDBACK,
  ]);
};

const generateGeminiOpeningQuestion = async ({ interviewContext }) => {
  const content = await callGemini({
    systemPrompt: createOpeningSystemPrompt(),
    payload: { interviewContext },
  });

  return parseModelResponse(content, [AI_RESPONSE_TYPES.QUESTION]);
};

const generateGeminiFinalSummary = async ({ interviewContext }) => {
  const content = await callGemini({
    systemPrompt: createSummarySystemPrompt(),
    payload: { interviewContext },
  });

  return parseModelResponse(content, [AI_RESPONSE_TYPES.SUMMARY]);
};

module.exports = {
  generateGeminiInterviewResponse,
  generateGeminiOpeningQuestion,
  generateGeminiFinalSummary,
};
