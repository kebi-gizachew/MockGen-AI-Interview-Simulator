/**
 * Full LeetCode-style question bank used to seed the Question table.
 *
 * Combines the original hand-written questions (questions.seed.legacy), the
 * company-tagged question library (src/data/questions/*) and the expanded
 * multi-company bank (src/data/expansion-questions).
 *
 * Every question: { title, topic, difficulty, company?, companies?, roles?,
 *   functionName, description, examples?, constraints?, testCases,
 *   starterCode, argTypes? }
 * - companies: every company known to ask the question (falls back to the
 *   primary `company` field). Extra associations are added centrally by
 *   MULTI_COMPANY_MAP in company-frequency.js.
 * - roles: interview role relevance, e.g. ["Backend Engineer", ...]. When a
 *   question omits it, a sensible default is derived from its topic so every
 *   seeded row carries role metadata.
 * testCases: array of { input: [...args], expected: <value> } — input is spread
 * into the candidate's function call. expected must be JSON-serializable.
 */
const { questions: LEGACY_QUESTIONS } = require("./questions.seed.legacy");
const ARRAYS = require("./questions/arrays");
const STRINGS = require("./questions/strings");
const TWO_POINTERS = require("./questions/twopointers");
const SLIDING_WINDOW = require("./questions/slidingwindow");
const BINARY_SEARCH = require("./questions/binarysearch");
const LINKED_LIST = require("./questions/linkedlist");
const TREES = require("./questions/trees");
const GRAPHS = require("./questions/graphs");
const DP = require("./questions/dp");
const BACKTRACKING = require("./questions/backtracking");
const GREEDY = require("./questions/greedy");
const HEAP = require("./questions/heap");
const QUEUE = require("./questions/queue");
const STACK = require("./questions/stack");
const UNION_FIND = require("./questions/unionfind");
const EXPANSION = require("./expansion-questions");
const { applyFrequencyMetadata } = require("./company-frequency");

// Role vocabulary (must match the frontend role list / interview setup).
const ROLE_NAMES = {
  intern: "Software Engineer Intern",
  backend: "Backend Engineer",
  frontend: "Frontend Engineer",
  fullstack: "Full Stack Engineer",
  ml: "Machine Learning Engineer",
};

const ALL_ROLES = Object.values(ROLE_NAMES);

// Topic -> default role relevance. Used whenever a question does not declare
// its own `roles` so every seeded row carries interview role metadata.
const ROLE_BY_TOPIC = {
  "arrays & hashing": ALL_ROLES,
  "arrays": ALL_ROLES,
  "strings": ALL_ROLES,
  "two pointers": ALL_ROLES,
  "sliding window": ALL_ROLES,
  "binary search": [ROLE_NAMES.backend, ROLE_NAMES.fullstack, ROLE_NAMES.ml],
  "linked lists": [ROLE_NAMES.backend, ROLE_NAMES.fullstack],
  "trees": [ROLE_NAMES.backend, ROLE_NAMES.fullstack, ROLE_NAMES.frontend],
  "graphs": [ROLE_NAMES.backend, ROLE_NAMES.ml, ROLE_NAMES.fullstack],
  "bfs": [ROLE_NAMES.backend, ROLE_NAMES.ml, ROLE_NAMES.fullstack],
  "dfs": [ROLE_NAMES.backend, ROLE_NAMES.ml, ROLE_NAMES.fullstack],
  "dynamic programming": [ROLE_NAMES.backend, ROLE_NAMES.ml, ROLE_NAMES.fullstack],
  "backtracking": [ROLE_NAMES.backend, ROLE_NAMES.fullstack],
  "greedy": [ROLE_NAMES.backend, ROLE_NAMES.fullstack, ROLE_NAMES.ml],
  "heap": [ROLE_NAMES.backend, ROLE_NAMES.fullstack],
  "stack": [ROLE_NAMES.backend, ROLE_NAMES.frontend, ROLE_NAMES.fullstack],
  "queue": [ROLE_NAMES.backend, ROLE_NAMES.fullstack],
  "union find": [ROLE_NAMES.backend, ROLE_NAMES.ml, ROLE_NAMES.fullstack],
  "intervals": [ROLE_NAMES.backend, ROLE_NAMES.fullstack],
};

// Attach interview role relevance to every question: explicit `roles` wins,
// otherwise a topic-derived default so the field is never empty.
const applyRoleMetadata = (question) => {
  if (Array.isArray(question.roles) && question.roles.length > 0) {
    return question;
  }
  const key = String(question.topic || "").toLowerCase();
  const defaults = ROLE_BY_TOPIC[key] || ALL_ROLES;
  return { ...question, roles: defaults };
};

const questions = [
  ...LEGACY_QUESTIONS,
  ...ARRAYS,
  ...STRINGS,
  ...TWO_POINTERS,
  ...SLIDING_WINDOW,
  ...BINARY_SEARCH,
  ...LINKED_LIST,
  ...TREES,
  ...GRAPHS,
  ...DP,
  ...BACKTRACKING,
  ...GREEDY,
  ...HEAP,
  ...QUEUE,
  ...STACK,
  ...UNION_FIND,
  ...EXPANSION,
];

// Safety net: never seed duplicate titles (seeding is keyed by title).
const seen = new Set();
const deduped = questions.filter((q) => {
  const key = String(q.title).toLowerCase();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// Attach role relevance, then company metadata (companies + per-company
// frequency) so the selection engine can prioritise the questions companies
// actually ask.
const enriched = deduped.map(applyRoleMetadata).map(applyFrequencyMetadata);

module.exports = { questions: enriched };
