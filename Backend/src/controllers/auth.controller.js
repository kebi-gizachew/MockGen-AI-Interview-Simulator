const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");

const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  const data = await authService.registerUser({ email, password, name });

  res.status(201).json({
    status: "success",
    data,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.loginUser({ email, password });

  res.status(200).json({
    status: "success",
    data,
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: "success",
    data: { user: req.user },
  });
});

module.exports = {
  register,
  login,
  getMe,
};
