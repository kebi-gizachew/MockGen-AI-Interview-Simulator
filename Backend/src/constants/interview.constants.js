const SESSION_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
};

const MESSAGE_ROLES = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
};

const AI_RESPONSE_TYPES = {
  QUESTION: "question",
  FEEDBACK: "feedback",
  SUMMARY: "summary",
};

// Shown (and surfaced as HTTP 410) when the configured interview duration has
// elapsed — the session is auto-completed before the client sees this.
const TIME_EXPIRED_MESSAGE =
  "Your interview time has ended. Thank you for completing this session — your performance report has been generated.";

const ALLOWED_MESSAGE_ROLES = Object.values(MESSAGE_ROLES);

// Interview setup configuration (MVP spec)
const COMPANIES = [
  "Google",
  "Amazon",
  "Meta",
  "Microsoft",
  "Apple",
  "Netflix",
  "Uber",
  "Airbnb",
  "Stripe",
  "OpenAI",
  "Custom Company",
];

const ROLES = [
  "Software Engineer Intern",
  "Backend Engineer",
  "Frontend Engineer",
  "Full Stack Engineer",
  "Machine Learning Engineer",
];

const DIFFICULTIES = ["easy", "medium", "hard"];

const LANGUAGES = ["python", "java", "cpp", "javascript", "typescript"];

const DURATIONS = [30, 45, 60];

// All five languages execute for real: js/ts in-process (node:vm), python via
// local subprocess or the remote sandbox, java/cpp via the remote sandbox.
const EXECUTABLE_LANGUAGES = ["javascript", "typescript", "python", "java", "cpp"];

module.exports = {
  SESSION_STATUS,
  MESSAGE_ROLES,
  AI_RESPONSE_TYPES,
  ALLOWED_MESSAGE_ROLES,
  TIME_EXPIRED_MESSAGE,
  COMPANIES,
  ROLES,
  DIFFICULTIES,
  LANGUAGES,
  DURATIONS,
  EXECUTABLE_LANGUAGES,
};
