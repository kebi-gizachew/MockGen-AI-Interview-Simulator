const asyncHandler = require("../utils/asyncHandler");
const aiInterviewService = require("../services/aiInterview.service");

const sendCandidateMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const result = await aiInterviewService.processCandidateMessage({
    sessionId: req.params.id,
    userId: req.user.id,
    message,
  });

  res.status(200).json({
    status: "success",
    data: {
      userMessage: result.userMessage,
      assistantMessage: result.assistantMessage,
      aiResponse: result.aiResponse,
    },
  });
});

const endInterview = asyncHandler(async (req, res) => {
  const result = await aiInterviewService.endInterview({
    sessionId: req.params.id,
    userId: req.user.id,
  });

  res.status(200).json({
    status: "success",
    data: {
      session: result.session,
      summaryMessage: result.summaryMessage,
      aiResponse: result.aiResponse,
    },
  });
});

module.exports = {
  sendCandidateMessage,
  endInterview,
};
