const asyncHandler = require("../utils/asyncHandler");
const interviewService = require("../services/interview.service");
const aiInterviewService = require("../services/aiInterview.service");

const createSession = asyncHandler(async (req, res) => {
  const { title, company, role, difficulty, language, durationMinutes } = req.body;
  const result = await aiInterviewService.startInterview({
    userId: req.user.id,
    title,
    company,
    role,
    difficulty,
    language,
    durationMinutes,
  });

  res.status(201).json({
    status: "success",
    data: {
      session: result.session,
      openingMessage: result.openingMessage,
      aiResponse: result.aiResponse,
    },
  });
});

const getUserSessions = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await interviewService.getUserSessions(req.user.id, {
    status,
    page,
    limit,
  });

  res.status(200).json({
    status: "success",
    data: result,
  });
});

const getSession = asyncHandler(async (req, res) => {
  const session = await interviewService.getSessionById({
    sessionId: req.params.id,
    userId: req.user.id,
    includeMessages: true,
    includeQuestion: true,
  });

  res.status(200).json({
    status: "success",
    data: { session },
  });
});

const updateSession = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const session = await interviewService.updateSession({
    sessionId: req.params.id,
    userId: req.user.id,
    title,
  });

  res.status(200).json({
    status: "success",
    data: { session },
  });
});

const deleteSession = asyncHandler(async (req, res) => {
  await interviewService.deleteSession({
    sessionId: req.params.id,
    userId: req.user.id,
  });

  res.status(200).json({
    status: "success",
    data: { message: "Interview session deleted." },
  });
});

const saveMessage = asyncHandler(async (req, res) => {
  const { role, content, metadata } = req.body;
  const message = await interviewService.saveMessage({
    sessionId: req.params.id,
    userId: req.user.id,
    role,
    content,
    metadata,
  });

  res.status(201).json({
    status: "success",
    data: { message },
  });
});

const getCodeSubmissions = asyncHandler(async (req, res) => {
  const submissions = await interviewService.getCodeSubmissions({
    sessionId: req.params.id,
    userId: req.user.id,
  });

  res.status(200).json({
    status: "success",
    data: { submissions },
  });
});

const submitCode = asyncHandler(async (req, res) => {
  const { language, code, notes } = req.body;
  const submission = await interviewService.submitCode({
    sessionId: req.params.id,
    userId: req.user.id,
    language,
    code,
    notes,
  });

  res.status(201).json({
    status: "success",
    data: { submission },
  });
});

const deleteCodeSubmission = asyncHandler(async (req, res) => {
  await interviewService.deleteCodeSubmission({
    sessionId: req.params.id,
    userId: req.user.id,
    submissionId: req.params.submissionId,
  });

  res.status(200).json({
    status: "success",
    data: { message: "Code submission deleted." },
  });
});

const runCode = asyncHandler(async (req, res) => {
  const { language, code } = req.body;
  const result = await interviewService.runCode({
    sessionId: req.params.id,
    userId: req.user.id,
    language,
    code,
  });

  res.status(200).json({
    status: "success",
    data: { result },
  });
});

const getFeedback = asyncHandler(async (req, res) => {
  const feedback = await interviewService.getFeedback({
    sessionId: req.params.id,
    userId: req.user.id,
  });

  res.status(200).json({
    status: "success",
    data: { feedback },
  });
});

module.exports = {
  createSession,
  getUserSessions,
  getSession,
  updateSession,
  deleteSession,
  saveMessage,
  getCodeSubmissions,
  submitCode,
  deleteCodeSubmission,
  runCode,
  getFeedback,
};
