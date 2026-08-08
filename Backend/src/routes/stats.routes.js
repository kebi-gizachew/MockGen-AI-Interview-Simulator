const express = require("express");
const statsController = require("../controllers/stats.controller");

const router = express.Router();

// GET /api/stats — public, read-only aggregate counts. No authentication
// required (only totals are exposed, never user data).
router.get("/stats", statsController.getStats);

module.exports = router;
