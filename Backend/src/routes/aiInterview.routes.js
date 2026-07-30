const express = require("express");
const aiInterviewController = require("../controllers/aiInterview.controller");

const router = express.Router({ mergeParams: true });

router.post("/chat", aiInterviewController.sendCandidateMessage);
router.post("/end", aiInterviewController.endInterview);

module.exports = router;
