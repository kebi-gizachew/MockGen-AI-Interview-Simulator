const express = require("express");
const authController = require("../controllers/auth.controller");
const authenticate = require("../middlewares/auth.middleware");
const env = require("../config/env");
const { createRateLimiter } = require("../middlewares/rateLimit.middleware");
const { passport, isGoogleConfigured } = require("../services/oauth/google.strategy");

const router = express.Router();

// Brute-force protection for credential endpoints.
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many authentication attempts. Please try again later.",
});

// Email verification endpoints (separate, tighter rate limits).
const verifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many verification requests. Please try again later.",
});

router.get("/config", authController.getAuthConfig);
router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.get("/verify-email", verifyLimiter, authController.verifyEmail);
router.post("/resend-verification", verifyLimiter, authController.resendVerification);
router.get("/me", authenticate, authController.getMe);

// Google OAuth (only mounted when credentials are configured).
if (isGoogleConfigured) {
  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  router.get(
    "/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${env.frontendUrl}/login?google=error`,
    }),
    authController.googleCallback
  );
}

module.exports = router;
