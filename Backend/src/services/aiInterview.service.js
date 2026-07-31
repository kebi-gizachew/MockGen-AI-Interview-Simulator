const {
  generateInterviewResponse,
  generateOpeningQuestion,
  generateFinalSummary,
} = require("./ai/ai.service");
const interviewService = require("./interview.service");
const messageService = require("./message.service");
const HttpError = require("../utils/httpError");
const {
  MESSAGE_ROLES,
  SESSION_STATUS,
} = require("../constants/interview.constants");

const buildInterviewContext = (session, messages) => ({
  sessionId: session.id,
  title: session.title,
  status: session.status,
  history: messages.map((message) => ({
    role: message.role,
    content: message.content,
    metadata: message.metadata ?? null,
  })),
});

const buildAiMetadata = (aiResponse) => ({
  type: aiResponse.type,
  score: aiResponse.score,
});

const startInterview = async ({ userId, title }) => {
  const session = await interviewService.createSession({ userId, title });
  const interviewContext = buildInterviewContext(session, []);

  const aiResponse = await generateOpeningQuestion({ interviewContext });

  const openingMessage = await messageService.createMessage({
    interviewSessionId: session.id,
    role: MESSAGE_ROLES.ASSISTANT,
    content: aiResponse.message,
    metadata: buildAiMetadata(aiResponse),
  });

  return {
    session,
    openingMessage,
    aiResponse,
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
  });

  interviewService.assertSessionActive(session);

  const userMessage = await messageService.createMessage({
    interviewSessionId: sessionId,
    role: MESSAGE_ROLES.USER,
    content: trimmedMessage,
  });

  const allMessages = [...session.messages, userMessage];
  const interviewContext = buildInterviewContext(session, allMessages);

  const aiResponse = await generateInterviewResponse({
    userMessage: trimmedMessage,
    interviewContext,
  });

  const assistantMessage = await messageService.createMessage({
    interviewSessionId: sessionId,
    role: MESSAGE_ROLES.ASSISTANT,
    content: aiResponse.message,
    metadata: buildAiMetadata(aiResponse),
  });

  return {
    userMessage,
    assistantMessage,
    aiResponse,
  };
};

const endInterview = async ({ sessionId, userId }) => {
  const session = await interviewService.getSessionById({
    sessionId,
    userId,
    includeMessages: true,
  });

  if (session.status === SESSION_STATUS.COMPLETED) {
    throw new HttpError(400, "Interview session is already completed.");
  }

  const interviewContext = buildInterviewContext(session, session.messages);
  const aiResponse = await generateFinalSummary({ interviewContext });

  const summaryMessage = await messageService.createMessage({
    interviewSessionId: sessionId,
    role: MESSAGE_ROLES.ASSISTANT,
    content: aiResponse.message,
    metadata: buildAiMetadata(aiResponse),
  });

  const updatedSession = await interviewService.endSession({ sessionId, userId });

  return {
    session: updatedSession,
    summaryMessage,
    aiResponse,
  };
};

module.exports = {
  startInterview,
  processCandidateMessage,
  endInterview,
};
