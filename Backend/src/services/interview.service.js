const prisma = require("../config/db");
const HttpError = require("../utils/httpError");
const {
  SESSION_STATUS,
  MESSAGE_ROLES,
  DIFFICULTIES,
  TIME_EXPIRED_MESSAGE,
} = require("../constants/interview.constants");
const messageService = require("./message.service");
const codeSubmissionService = require("./codeSubmission.service");
const codeExecutionService = require("./codeExecution.service");
const feedbackService = require("./feedback.service");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const VALID_STATUSES = Object.values(SESSION_STATUS);

const sessionSelect = {
  id: true,
  title: true,
  company: true,
  role: true,
  difficulty: true,
  language: true,
  durationMinutes: true,
  score: true,
  questionId: true,
  status: true,
  startedAt: true,
  endedAt: true,
  createdAt: true,
  updatedAt: true,
};

const parsePagination = ({ page, limit }) => {
  const parsedPage = Math.max(Number(page) || DEFAULT_PAGE, 1);
  const parsedLimit = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  };
};

const createSession = async ({
  userId,
  title,
  company,
  role,
  difficulty,
  language,
  durationMinutes,
  questionId,
}) => {
  const normalizedDifficulty = difficulty
    ? String(difficulty).toLowerCase()
    : undefined;
  if (normalizedDifficulty && !DIFFICULTIES.includes(normalizedDifficulty)) {
    throw new HttpError(
      400,
      `Invalid difficulty. Allowed values: ${DIFFICULTIES.join(", ")}.`
    );
  }

  return prisma.interviewSession.create({
    data: {
      userId,
      title: title?.trim() || "Mock Interview",
      company: company?.trim() || null,
      role: role?.trim() || null,
      difficulty: normalizedDifficulty || null,
      language: language?.trim() || null,
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      questionId: questionId || null,
      status: SESSION_STATUS.ACTIVE,
    },
  });
};

const getUserSessions = async (userId, { status, page, limit } = {}) => {
  const pagination = parsePagination({ page, limit });
  const where = { userId };

  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      throw new HttpError(
        400,
        `Invalid status filter. Allowed values: ${VALID_STATUSES.join(", ")}.`
      );
    }
    where.status = status;
  }

  const [sessions, total] = await Promise.all([
    prisma.interviewSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
      select: {
        ...sessionSelect,
        question: {
          select: { id: true, title: true, topic: true, difficulty: true },
        },
        _count: {
          select: { messages: true, codeSubmissions: true },
        },
      },
    }),
    prisma.interviewSession.count({ where }),
  ]);

  return {
    sessions,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit) || 1,
    },
  };
};

const getSessionById = async ({
  sessionId,
  userId,
  includeMessages = false,
  includeQuestion = false,
  includeSubmissions = false,
}) => {
  const session = await prisma.interviewSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      ...(includeMessages
        ? {
            messages: {
              orderBy: { createdAt: "asc" },
              select: messageService.messageSelect,
            },
          }
        : {}),
      ...(includeQuestion
        ? {
            question: {
              include: {
                companies: { include: { company: { select: { name: true } } } },
              },
            },
          }
        : {}),
      ...(includeSubmissions
        ? {
            codeSubmissions: {
              orderBy: { createdAt: "desc" },
            },
          }
        : {}),
    },
  });

  if (!session) {
    throw new HttpError(404, "Interview session not found.");
  }

  // Expose the question's companies as a plain array of names (the join rows
  // are internal to the many-to-many relation).
  if (includeQuestion && session.question) {
    session.question.companies = (session.question.companies || [])
      .map((link) => link.company?.name)
      .filter(Boolean);
  }

  return session;
};

const assertSessionActive = (session) => {
  if (session.status !== SESSION_STATUS.ACTIVE) {
    throw new HttpError(400, "This interview session is no longer active.");
  }
};

// True when an ACTIVE session has a configured duration that has elapsed.
// The AI flow auto-completes such sessions; other endpoints (code submit,
// raw messages) reject late actions with HTTP 410.
const isSessionExpired = (session) => {
  if (!session || session.status !== SESSION_STATUS.ACTIVE) return false;
  const minutes = Number(session.durationMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) return false;
  const started = new Date(session.startedAt).getTime();
  if (!Number.isFinite(started)) return false;
  return Date.now() >= started + minutes * 60 * 1000;
};

const assertSessionNotExpired = (session) => {
  if (isSessionExpired(session)) {
    throw new HttpError(410, TIME_EXPIRED_MESSAGE);
  }
};

const updateSession = async ({ sessionId, userId, title }) => {
  const trimmedTitle = title?.trim();

  if (!trimmedTitle) {
    throw new HttpError(400, "Title is required.");
  }

  await getSessionById({ sessionId, userId });

  return prisma.interviewSession.update({
    where: { id: sessionId },
    data: { title: trimmedTitle },
    select: sessionSelect,
  });
};

const endSession = async ({ sessionId, userId, score }) => {
  const session = await getSessionById({ sessionId, userId });

  if (session.status === SESSION_STATUS.COMPLETED) {
    throw new HttpError(400, "Interview session is already completed.");
  }

  const normalizedScore =
    score !== undefined && score !== null
      ? Math.max(0, Math.min(100, Math.round(Number(score))))
      : null;

  return prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      status: SESSION_STATUS.COMPLETED,
      endedAt: new Date(),
      ...(normalizedScore !== null ? { score: normalizedScore } : {}),
    },
    select: sessionSelect,
  });
};

const deleteSession = async ({ sessionId, userId }) => {
  await getSessionById({ sessionId, userId });

  await prisma.interviewSession.delete({
    where: { id: sessionId },
  });
};

/**
 * Persist a chat message. The public endpoint is restricted to user/assistant
 * roles and cannot set metadata (scores / system messages are server-owned),
 * so clients cannot forge evaluation results.
 */
const saveMessage = async ({ sessionId, userId, role, content, metadata }) => {
  const trimmedRole = String(role || "").trim();
  const trimmedContent = String(content || "").trim();

  if (!trimmedRole || !trimmedContent) {
    throw new HttpError(400, "Role and content are required.");
  }

  const ALLOWED_PUBLIC_ROLES = [MESSAGE_ROLES.USER, MESSAGE_ROLES.ASSISTANT];
  if (!ALLOWED_PUBLIC_ROLES.includes(trimmedRole)) {
    throw new HttpError(
      400,
      `Invalid role. Clients may only write "${ALLOWED_PUBLIC_ROLES.join(
        '", "'
      )}" messages.`
    );
  }

  const session = await getSessionById({ sessionId, userId });
  assertSessionActive(session);
  assertSessionNotExpired(session);

  return messageService.createMessage({
    interviewSessionId: sessionId,
    role: trimmedRole,
    content: trimmedContent,
    // Client-supplied metadata (e.g. scores) is intentionally ignored.
    metadata: undefined,
  });
};

const runCode = async ({ sessionId, userId, language, code }) => {
  const session = await getSessionById({ sessionId, userId, includeQuestion: true });

  if (!session.question) {
    throw new HttpError(400, "This session has no coding question assigned.");
  }

  return codeExecutionService.executeCode({
    language,
    code,
    functionName: session.question.functionName,
    testCases: session.question.testCases,
    argTypes: session.question.argTypes,
  });
};

const submitCode = async ({ sessionId, userId, language, code, notes }) => {
  const session = await getSessionById({ sessionId, userId, includeQuestion: true });
  assertSessionActive(session);
  assertSessionNotExpired(session);

  // Execute the solution against the session question test cases.
  let result = null;
  let passedTests = null;
  let totalTests = null;

  if (session.question) {
    const execution = await codeExecutionService.executeCode({
      language,
      code,
      functionName: session.question.functionName,
      testCases: session.question.testCases,
      argTypes: session.question.argTypes,
    });

    if (execution.error) {
      result = { error: execution.error };
    } else {
      result = execution;
      passedTests = execution.passed;
      totalTests = execution.total;
    }
  }

  const submission = await codeSubmissionService.createSubmission({
    interviewSessionId: sessionId,
    language,
    code,
    notes,
    result,
    passedTests,
    totalTests,
  });

  // Server-owned transcript note — clients cannot inject system messages.
  const resultSummary =
    passedTests !== null ? ` ${passedTests}/${totalTests} test cases passed.` : "";
  await messageService.createMessage({
    interviewSessionId: sessionId,
    role: MESSAGE_ROLES.SYSTEM,
    content: `Candidate submitted a ${language} solution.${resultSummary}`,
    metadata: { type: "system" },
  });

  return submission;
};

const getCodeSubmissions = async ({ sessionId, userId }) => {
  await getSessionById({ sessionId, userId });
  return codeSubmissionService.getSubmissionsBySessionId(sessionId);
};

const deleteCodeSubmission = async ({ sessionId, userId, submissionId }) => {
  await getSessionById({ sessionId, userId });
  return codeSubmissionService.deleteSubmission({
    submissionId,
    interviewSessionId: sessionId,
  });
};

const getFeedback = async ({ sessionId, userId }) => {
  return feedbackService.getFeedbackBySessionId({ sessionId, userId });
};

module.exports = {
  createSession,
  getUserSessions,
  getSessionById,
  assertSessionActive,
  assertSessionNotExpired,
  isSessionExpired,
  updateSession,
  endSession,
  deleteSession,
  saveMessage,
  runCode,
  submitCode,
  getCodeSubmissions,
  deleteCodeSubmission,
  getFeedback,
};
