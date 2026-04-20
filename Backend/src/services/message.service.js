const prisma = require("../config/db");

const findSessionById = async (sessionId) => {
  return prisma.interviewSession.findUnique({
    where: { id: sessionId },
    select: { id: true },
  });
};

const createMessage = async ({ interviewSessionId, role, content }) => {
  return prisma.message.create({
    data: {
      interviewSessionId,
      role,
      content,
    },
  });
};

module.exports = {
  findSessionById,
  createMessage,
};
