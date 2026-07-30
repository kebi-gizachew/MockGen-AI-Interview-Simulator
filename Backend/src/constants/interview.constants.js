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

const ALLOWED_MESSAGE_ROLES = Object.values(MESSAGE_ROLES);

module.exports = {
  SESSION_STATUS,
  MESSAGE_ROLES,
  AI_RESPONSE_TYPES,
  ALLOWED_MESSAGE_ROLES,
};
