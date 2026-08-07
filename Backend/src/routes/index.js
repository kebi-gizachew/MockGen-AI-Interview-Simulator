const express = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const interviewRoutes = require("./interview.routes");
const questionRoutes = require("./question.routes");

const router = express.Router();

router.use(healthRoutes);
router.use("/auth", authRoutes);
router.use("/interviews", interviewRoutes);
router.use("/questions", questionRoutes);

module.exports = router;
