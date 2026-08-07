const prisma = require("../config/db");
const HttpError = require("../utils/httpError");

const createSubmission = async ({
  interviewSessionId,
  language,
  code,
  notes,
  result,
  passedTests,
  totalTests,
}) => {
  const trimmedLanguage = String(language || "").trim();
  const trimmedCode = String(code || "").trim();

  if (!trimmedLanguage || !trimmedCode) {
    throw new HttpError(400, "Language and code are required.");
  }

  return prisma.codeSubmission.create({
    data: {
      interviewSessionId,
      language: trimmedLanguage,
      code: trimmedCode,
      notes: notes?.trim() || null,
      result: result ?? undefined,
      passedTests: passedTests ?? null,
      totalTests: totalTests ?? null,
    },
  });
};

const getSubmissionsBySessionId = async (interviewSessionId) => {
  return prisma.codeSubmission.findMany({
    where: { interviewSessionId },
    orderBy: { createdAt: "desc" },
  });
};

const getSubmissionById = async ({ submissionId, interviewSessionId }) => {
  const submission = await prisma.codeSubmission.findFirst({
    where: {
      id: submissionId,
      interviewSessionId,
    },
  });

  if (!submission) {
    throw new HttpError(404, "Code submission not found.");
  }

  return submission;
};

const deleteSubmission = async ({ submissionId, interviewSessionId }) => {
  await getSubmissionById({ submissionId, interviewSessionId });

  return prisma.codeSubmission.delete({
    where: { id: submissionId },
  });
};

module.exports = {
  createSubmission,
  getSubmissionsBySessionId,
  getSubmissionById,
  deleteSubmission,
};
