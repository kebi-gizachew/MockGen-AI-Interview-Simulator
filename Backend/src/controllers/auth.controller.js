const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");
const env = require("../config/env");
const { isGoogleConfigured } = require("../services/oauth/google.strategy");

// Public auth configuration so the frontend can hide providers that are not
// enabled on this deployment.
const getAuthConfig = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      googleEnabled: Boolean(isGoogleConfigured),
      verificationRequired: false, // login stays available; verification is encouraged
      frontendUrl: env.frontendUrl,
    },
  });
});

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

const verifyEmail = asyncHandler(async (req, res) => {
  const data = await authService.verifyEmail({ token: req.query.token });
  res.status(200).json({
    status: "success",
    data,
  });
});

const resendVerification = asyncHandler(async (req, res) => {
  const data = await authService.resendVerificationEmail({ email: req.body.email });
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

// Redirect the browser to the frontend with the JWT in the query string after
// Google auth succeeds. The frontend callback page stores it and logs in.
const googleCallback = (req, res) => {
  const { user, token } = req.user || {};
  if (!token || !user) {
    return res.redirect(`${env.frontendUrl}/login?google=error`);
  }
  return res.redirect(
    `${env.frontendUrl}/auth/google/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(
      JSON.stringify(user)
    )}`
  );
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  googleCallback,
  getAuthConfig,
  getMe,
};
