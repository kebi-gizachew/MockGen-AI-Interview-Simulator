const prisma = require("../config/db");

const findSessionById = async (sessionId) => {
  return prisma.interviewSession.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true, status: true },
  });
};

const getMessagesBySessionId = async (interviewSessionId) => {
  return prisma.message.findMany({
    where: { interviewSessionId },
    orderBy: { createdAt: "asc" },
  });
};

const createMessage = async ({ interviewSessionId, role, content, metadata }) => {
  return prisma.message.create({
    data: {
      interviewSessionId,
      role,
      content,
      metadata: metadata ?? undefined,
    },
  });
};

const messageSelect = {
  id: true,
  role: true,
  content: true,
  metadata: true,
  createdAt: true,
};

module.exports = {
  findSessionById,
  getMessagesBySessionId,
  createMessage,
  messageSelect,
};
