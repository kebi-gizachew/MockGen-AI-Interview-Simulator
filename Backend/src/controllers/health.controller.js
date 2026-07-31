const asyncHandler = require("../utils/asyncHandler");
const healthService = require("../services/health.service");

const healthCheck = asyncHandler(async (req, res) => {
  const data = await healthService.getHealthStatus();
  res.status(200).json({
    status: "success",
    data,
  });
});

module.exports = {
  healthCheck,
};
