const {
  generateInterviewResponse,
  generateFinalSummary,
} = require("./ai/ai.service");
const interviewService = require("./interview.service");
const messageService = require("./message.service");
const questionService = require("./question.service");
const feedbackService = require("./feedback.service");
const HttpError = require("../utils/httpError");
const {
  MESSAGE_ROLES,
  SESSION_STATUS,
  AI_RESPONSE_TYPES,
  TIME_EXPIRED_MESSAGE,
} = require("../constants/interview.constants");

const sanitizeQuestionForContext = (question) => {
  if (!question) return null;
  return {
    title: question.title,
    description: question.description,
    difficulty: question.difficulty,
    topic: question.topic,
    company: question.company,
    functionName: question.functionName,
    frequencyRank: question.frequencyRank ?? null,
    interviewFrequency: question.interviewFrequency ?? null,
    examples: question.examples,
    constraints: question.constraints,
  };
};

const computePerformanceSignals = (session, messages, submissions) => {
  const codeSubmissions = submissions || [];
  // Submissions arrive ordered newest-first (see interviewService.getSessionById).
  const withTests = codeSubmissions.filter(
    (s) =>
      s.passedTests !== null &&
      s.passedTests !== undefined &&
      s.totalTests !== null &&
      s.totalTests !== undefined &&
      s.totalTests > 0
  );

  const rate = (submission) => submission.totalTests > 0 ? submission.passedTests / submission.totalTests : 0;
  const bestPassRate = withTests.length ? Math.max(...withTests.map(rate)) : null;
  const firstSubmission = withTests[withTests.length - 1] || null; // oldest
  const lastSubmission = withTests[0] || null; // most recent
  const firstPassRate = firstSubmission ? rate(firstSubmission) : null;
  const lastPassRate = lastSubmission ? rate(lastSubmission) : null;
  const improvedAcrossSubmissions =
    firstPassRate !== null && lastPassRate !== null && lastPassRate > firstPassRate + 0.05;

  const userMessages = (messages || []).filter((m) => m.role === MESSAGE_ROLES.USER);
  const allUserText = userMessages.map((m) => String(m.content || "")).join(" ");
  const lowerAll = allUserText.toLowerCase();

  // Count hint requests, ignoring negations like "I don't need a hint".
  const hintMentions = (lowerAll.match(/\bhint\b/g) || []).length;
  const negatedHints = (lowerAll.match(/\b(?:no|don'?t|not)\s+(?:need\s+)?a?\s*hint\b/g) || []).length;
  const hintsRequested = Math.max(0, hintMentions - negatedHints);

  // "I don't know"-style responses — evidence of NO demonstrated progress.
  // A message only counts when the don't-know phrase is dominant: if it also
  // contains substantive content (a data structure, complexity, an approach),
  // the candidate is reasoning even while hedging, so it is NOT counted.
  const DONT_KNOW_PHRASE =
    /\bi don'?t know\b|\bi(?:'m| am) not sure\b|\bnot sure\b|\bno idea\b|\bi have no idea\b|\bdon'?t understand\b|\bdon'?t know how\b|\bcan'?t think\b|\bstuck\b|\bunsure\b/i;
  const SUBSTANTIVE_MARKER =
    /\b(hash ?map|hash table|dictionary|two pointers?|sliding window|binary search|recursi\w+|bfs|dfs|sort\w*|stacks?|queues?|heap|priority queue|greedy|dynamic programming|\bdp\b|memoiz\w+|backtrack\w*|union find|linked list|monotonic)\b|o\(|time complexity|space complexity|big o|approach|algorithm|brute|optimize|data structure|complexity|edge case/i;
  const dontKnowResponses = userMessages.filter((m) => {
    const text = String(m.content || "");
    return DONT_KNOW_PHRASE.test(text) && !SUBSTANTIVE_MARKER.test(text);
  }).length;
  const complexityStated =
    lowerAll.includes("o(") || /\btime complexity\b|\bspace complexity\b/.test(lowerAll);
  const edgeCasesDiscussed =
    /\bedge\b|\bcorner\b|\bempty\b|\blarge input\b|\bboundary\b|\bnull\b/.test(lowerAll);

  // Approach discussion counts only when it happened BEFORE the first submission.
  const approachMessages = firstSubmission
    ? userMessages.filter((m) => new Date(m.createdAt) < new Date(firstSubmission.createdAt))
    : userMessages;
  const approachDiscussed = approachMessages.some((m) =>
    /\b(approach|algorithm|idea|think|plan|brute|optimize|data structure|strategy|solution)\b/i.test(
      String(m.content || "")
    )
  );

  const totalUserLength = userMessages.reduce((a, m) => a + String(m.content || "").length, 0);
  const avgUserMessageLength = userMessages.length
    ? Math.round(totalUserLength / userMessages.length)
    : 0;

  return {
    bestTestPassRate: bestPassRate === null ? null : Math.round(bestPassRate * 100),
    submissionsCount: codeSubmissions.length,
    firstPassRate: firstPassRate === null ? null : Math.round(firstPassRate * 100),
    lastPassRate: lastPassRate === null ? null : Math.round(lastPassRate * 100),
    improvedAcrossSubmissions: Boolean(improvedAcrossSubmissions),
    hintsRequested,
    dontKnowResponses,
    approachDiscussed: Boolean(approachDiscussed),
    complexityStated: Boolean(complexityStated),
    edgeCasesDiscussed: Boolean(edgeCasesDiscussed),
    userMessageCount: userMessages.length,
    avgUserMessageLength,
  };
};

const detectStage = (interviewContext) => {
  if ((interviewContext.codeSubmissions || []).length > 0) return "post_submission";
  const hasUserMessage = (interviewContext.history || []).some((m) => m.role === MESSAGE_ROLES.USER);
  return hasUserMessage ? "approach" : "opening";
};

const buildInterviewContext = (session, messages, { question, submissions } = {}) => {
  const context = {
    sessionId: session.id,
    title: session.title,
    company: session.company,
    role: session.role,
    difficulty: session.difficulty,
    language: session.language,
    durationMinutes: session.durationMinutes,
    status: session.status,
    question: sanitizeQuestionForContext(question),
    // Bound context size: only the most recent submissions, truncated.
    codeSubmissions: (submissions || [])
      .slice(-3)
      .map((submission) => ({
        language: submission.language,
        code: String(submission.code || "").slice(0, 4000),
        notes: submission.notes,
        passedTests: submission.passedTests,
        totalTests: submission.totalTests,
      })),
    history: messages.map((message) => ({
      role: message.role,
      content: message.content,
      metadata: message.metadata ?? null,
    })),
    // Anti-repetition: assistant questions already asked in this session, so
    // the AI never repeats a follow-up question the candidate already answered.
    askedQuestions: messages
      .filter((m) => m.role === MESSAGE_ROLES.ASSISTANT)
      .map((m) => String(m.content || ""))
      .filter((content) => /[?？]/.test(content))
      .slice(-10),
    // Response-driven context: the most recent assistant question still on the
    // table. The AI must evaluate whether the candidate's latest reply actually
    // answers it BEFORE generating a follow-up — and if not, re-engage the same
    // topic instead of moving on.
    pendingQuestion: (() => {
      const assistantMessages = messages.filter((m) => m.role === MESSAGE_ROLES.ASSISTANT);
      const lastQuestion = [...assistantMessages].reverse().find((m) =>
        /[?？]/.test(String(m.content || ""))
      );
      // Keep the TAIL of long messages (the actual question is asked at the
      // end; the head is problem description/examples already in history).
      return lastQuestion ? String(lastQuestion.content).slice(-2000) : null;
    })(),
  };

  return {
    ...context,
    performanceSignals: computePerformanceSignals(session, messages, submissions),
    stage: detectStage(context),
  };
};

const buildOpeningMessage = ({ session, question }) => {
  const header = [
    `Welcome to your ${session.title || "Mock Interview"}.`,
    session.company ? ` This screen is tailored to ${session.company}.` : "",
    session.role ? ` Target role: ${session.role}.` : "",
    session.durationMinutes ? ` You have ${session.durationMinutes} minutes.` : "",
  ].join("");

  if (!question) {
    return header + "\n\nLet's begin. Describe your background and we'll jump into a technical problem.";
  }

  const exampleLines = (question.examples || [])
    .map(
      (example, index) =>
        `**Example ${index + 1}:** Input: \`${example.input}\` → Output: \`${example.output}\`${
          example.explanation ? ` — ${example.explanation}` : ""
        }`
    )
    .join("\n");

  const constraintLines = (question.constraints || []).map((c) => `- ${c}`).join("\n");

  // Realism touch: tell the candidate how commonly this problem appears at
  // their target company, using the curated interview-frequency metadata.
  const frequencyLines =
    question.interviewFrequency && session.company
      ? [
          "",
          question.interviewFrequency === "very_high"
            ? `> 💡 **${question.title}** is among the **most frequently reported** coding problems at ${session.company} — treat it like a top-priority screen.`
            : question.interviewFrequency === "high"
              ? `> 💡 **${question.title}** is a **frequently reported** ${session.company} interview problem — expect it to be asked with follow-ups.`
              : `> ℹ️ **${question.title}** shows up in ${session.company} interviews from time to time.`,
        ]
      : [];

  return [
    header,
    "",
    `## Coding Problem: ${question.title}`,
    `**Difficulty:** ${question.difficulty} · **Topic:** ${question.topic}`,
    "",
    question.description,
    "",
    exampleLines,
    "",
    "### Constraints",
    constraintLines,
    ...frequencyLines,
    "",
    `Implement \`${question.functionName}\` in the **Code Workspace** tab and run it against the test cases. ` +
      "Before you start coding, walk me through your approach: which algorithm and data structures do you " +
      "plan to use, and what time/space complexity are you targeting?",
  ].join("\n");
};

const startInterview = async ({
  userId,
  title,
  company,
  role,
  difficulty,
  language,
  durationMinutes,
}) => {
  const question = await questionService.getRandomQuestionForUser({
    userId,
    difficulty,
    company,
    role,
  });

  const session = await interviewService.createSession({
    userId,
    title,
    company,
    role,
    difficulty,
    language,
    durationMinutes,
    questionId: question?.id ?? null,
  });

  // Deterministic structured opening — no blocking LLM call on session start.
  const openingContent = buildOpeningMessage({ session, question });
  const openingMessage = await messageService.createMessage({
    interviewSessionId: session.id,
    role: MESSAGE_ROLES.ASSISTANT,
    content: openingContent,
    metadata: {
      type: AI_RESPONSE_TYPES.QUESTION,
      score: 0,
      ...(question ? { question: sanitizeQuestionForContext(question) } : {}),
    },
  });

  return {
    session,
    openingMessage,
    aiResponse: {
      type: AI_RESPONSE_TYPES.QUESTION,
      message: openingContent,
      score: 0,
    },
  };
};

const processCandidateMessage = async ({ sessionId, userId, message }) => {
  const trimmedMessage = String(message || "").trim();

  if (!trimmedMessage) {
    throw new HttpError(400, "Message is required.");
  }

  const session = await interviewService.getSessionById({
    sessionId,
    userId,
    includeMessages: true,
    includeQuestion: true,
    includeSubmissions: true,
  });

  interviewService.assertSessionActive(session);

  // Automatic completion: when the configured duration has elapsed, stop
  // accepting answers, close the interview professionally and generate the
  // report. The client then sees HTTP 410 and routes to the debrief.
  if (interviewService.isSessionExpired(session)) {
    await endInterview({ sessionId, userId, autoExpired: true });
    throw new HttpError(410, TIME_EXPIRED_MESSAGE);
  }

  // Persist the user message only AFTER the AI responds successfully so that
  // a failed request can be retried without duplicating transcript messages.
  const transientUserMessage = {
    role: MESSAGE_ROLES.USER,
    content: trimmedMessage,
  };
  const interviewContext = buildInterviewContext(session, [...session.messages, transientUserMessage], {
    question: session.question,
    submissions: session.codeSubmissions,
  });

  const aiResponse = await generateInterviewResponse({
    userMessage: trimmedMessage,
    interviewContext,
  });

  const userMessage = await messageService.createMessage({
    interviewSessionId: sessionId,
    role: MESSAGE_ROLES.USER,
    content: trimmedMessage,
  });

  const assistantMessage = await messageService.createMessage({
    interviewSessionId: sessionId,
    role: MESSAGE_ROLES.ASSISTANT,
    content: aiResponse.message,
    metadata: {
      type: aiResponse.type,
      score: aiResponse.score,
    },
  });

  return {
    userMessage,
    assistantMessage,
    aiResponse,
  };
};

const endInterview = async ({ sessionId, userId, autoExpired = false }) => {
  const session = await interviewService.getSessionById({
    sessionId,
    userId,
    includeMessages: true,
    includeQuestion: true,
    includeSubmissions: true,
  });

  if (session.status === SESSION_STATUS.COMPLETED) {
    throw new HttpError(400, "Interview session is already completed.");
  }

  const interviewContext = buildInterviewContext(session, session.messages, {
    question: session.question,
    submissions: session.codeSubmissions,
  });

  // Auto-completion closing line: the AI interviewer ends the session
  // professionally before the debrief lands. Type is deliberately NOT
  // "summary" so the debrief page still finds the real evaluation message.
  if (autoExpired) {
    await messageService.createMessage({
      interviewSessionId: sessionId,
      role: MESSAGE_ROLES.ASSISTANT,
      content:
        "⏰ **Time's up.** Your interview time has ended. Thank you for completing this " +
        "session — I'll generate your performance report now.",
      metadata: { type: AI_RESPONSE_TYPES.QUESTION, score: 0 },
    });
  }

  const aiResponse = await generateFinalSummary({ interviewContext });

  // Persist the structured evaluation.
  const feedback = await feedbackService.createFeedback({
    interviewSessionId: sessionId,
    feedback: aiResponse,
  });

  const summaryMessage = await messageService.createMessage({
    interviewSessionId: sessionId,
    role: MESSAGE_ROLES.ASSISTANT,
    content: aiResponse.message,
    metadata: {
      type: AI_RESPONSE_TYPES.SUMMARY,
      score: aiResponse.score,
    },
  });

  const updatedSession = await interviewService.endSession({
    sessionId,
    userId,
    score: aiResponse.score,
  });

  return {
    session: updatedSession,
    summaryMessage,
    feedback,
    aiResponse: {
      type: AI_RESPONSE_TYPES.SUMMARY,
      message: aiResponse.message,
      score: aiResponse.score,
    },
  };
};

module.exports = {
  startInterview,
  processCandidateMessage,
  endInterview,
};
