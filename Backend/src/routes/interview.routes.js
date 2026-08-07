const express = require("express");
const interviewController = require("../controllers/interview.controller");
const aiInterviewRoutes = require("./aiInterview.routes");
const authenticate = require("../middlewares/auth.middleware");
const { createRateLimiter } = require("../middlewares/rateLimit.middleware");

const router = express.Router();

router.use(authenticate);

// Code execution hits external judge resources — bound abuse so an authenticated
// client cannot drain the shared sandbox quota.
const codeRunLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many code executions. Please wait a moment and try again.",
});

// Session lifecycle
router.post("/", interviewController.createSession);
router.get("/", interviewController.getUserSessions);
router.get("/:id", interviewController.getSession);
router.patch("/:id", interviewController.updateSession);
router.delete("/:id", interviewController.deleteSession);

// Messages
router.post("/:id/messages", interviewController.saveMessage);

// Code execution & submissions
router.get("/:id/code", interviewController.getCodeSubmissions);
router.post("/:id/code", codeRunLimiter, interviewController.submitCode);
router.post("/:id/code/run", codeRunLimiter, interviewController.runCode);
router.delete("/:id/code/:submissionId", interviewController.deleteCodeSubmission);

// Structured AI feedback
router.get("/:id/feedback", interviewController.getFeedback);

// AI interview (chat + end) — mounted last to avoid shadowing specific routes
router.use("/:id", aiInterviewRoutes);

module.exports = router;
