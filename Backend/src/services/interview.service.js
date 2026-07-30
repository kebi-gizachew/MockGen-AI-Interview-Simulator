const prisma = require("../config/db");
const HttpError = require("../utils/httpError");
const { SESSION_STATUS, ALLOWED_MESSAGE_ROLES } = require("../constants/interview.constants");
const messageService = require("./message.service");
const codeSubmissionService = require("./codeSubmission.service");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const VALID_STATUSES = Object.values(SESSION_STATUS);

const sessionSelect = {
  id: true,
  title: true,
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

const createSession = async ({ userId, title }) => {
  return prisma.interviewSession.create({
    data: {
      userId,
      title: title?.trim() || "Mock Interview",
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

const getSessionById = async ({ sessionId, userId, includeMessages = false }) => {
  const session = await prisma.interviewSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: includeMessages
      ? {
          messages: {
            orderBy: { createdAt: "asc" },
            select: messageService.messageSelect,
          },
        }
      : undefined,
  });

  if (!session) {
    throw new HttpError(404, "Interview session not found.");
  }

  return session;
};

const assertSessionActive = (session) => {
  if (session.status !== SESSION_STATUS.ACTIVE) {
    throw new HttpError(400, "This interview session is no longer active.");
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

const endSession = async ({ sessionId, userId }) => {
  const session = await getSessionById({ sessionId, userId });

  if (session.status === SESSION_STATUS.COMPLETED) {
    throw new HttpError(400, "Interview session is already completed.");
  }

  return prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      status: SESSION_STATUS.COMPLETED,
      endedAt: new Date(),
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

const saveMessage = async ({ sessionId, userId, role, content, metadata }) => {
  const trimmedRole = String(role || "").trim();
  const trimmedContent = String(content || "").trim();

  if (!trimmedRole || !trimmedContent) {
    throw new HttpError(400, "Role and content are required.");
  }

  if (!ALLOWED_MESSAGE_ROLES.includes(trimmedRole)) {
    throw new HttpError(
      400,
      `Invalid role. Allowed values: ${ALLOWED_MESSAGE_ROLES.join(", ")}.`
    );
  }

  const session = await getSessionById({ sessionId, userId });
  assertSessionActive(session);

  return messageService.createMessage({
    interviewSessionId: sessionId,
    role: trimmedRole,
    content: trimmedContent,
    metadata,
  });
};

const submitCode = async ({ sessionId, userId, language, code, notes }) => {
  const session = await getSessionById({ sessionId, userId });
  assertSessionActive(session);

  return codeSubmissionService.createSubmission({
    interviewSessionId: sessionId,
    language,
    code,
    notes,
  });
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

module.exports = {
  createSession,
  getUserSessions,
  getSessionById,
  assertSessionActive,
  updateSession,
  endSession,
  deleteSession,
  saveMessage,
  submitCode,
  getCodeSubmissions,
  deleteCodeSubmission,
};
