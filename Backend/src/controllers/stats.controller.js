const asyncHandler = require("../utils/asyncHandler");
const statsService = require("../services/stats.service");

const getStats = asyncHandler(async (req, res) => {
  const data = await statsService.getPublicStats();
  res.status(200).json({
    status: "success",
    data,
  });
});

module.exports = {
  getStats,
};
