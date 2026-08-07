const express = require("express");
const questionController = require("../controllers/question.controller");
const authenticate = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

// GET /api/questions/random?difficulty=easy&topic=arrays
router.get("/random", questionController.getRandomQuestion);

module.exports = router;
