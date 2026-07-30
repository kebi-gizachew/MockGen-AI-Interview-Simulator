const express = require("express");
const interviewController = require("../controllers/interview.controller");
const aiInterviewRoutes = require("./aiInterview.routes");
const authenticate = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

// Session lifecycle
router.post("/", interviewController.createSession);
router.get("/", interviewController.getUserSessions);
router.get("/:id", interviewController.getSession);
router.patch("/:id", interviewController.updateSession);
router.delete("/:id", interviewController.deleteSession);

// Messages
router.post("/:id/messages", interviewController.saveMessage);

// Code submissions
router.get("/:id/code", interviewController.getCodeSubmissions);
router.post("/:id/code", interviewController.submitCode);
router.delete("/:id/code/:submissionId", interviewController.deleteCodeSubmission);

// AI interview (chat + end) — mounted last to avoid shadowing specific routes
router.use("/:id", aiInterviewRoutes);

module.exports = router;
