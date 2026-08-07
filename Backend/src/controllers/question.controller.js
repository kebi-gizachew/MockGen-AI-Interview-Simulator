const asyncHandler = require("../utils/asyncHandler");
const questionService = require("../services/question.service");

const getRandomQuestion = asyncHandler(async (req, res) => {
  const { difficulty, topic, company } = req.query;
  const question = await questionService.getRandomQuestionForUser({
    userId: req.user?.id,
    difficulty,
    topic,
    company,
  });

  res.status(200).json({
    status: "success",
    data: { question },
  });
});

module.exports = {
  getRandomQuestion,
};
