/**
 * Full LeetCode-style question bank used to seed the Question table.
 *
 * Combines the original hand-written questions (questions.seed.legacy) with
 * the expanded company-tagged question library (src/data/questions/*).
 *
 * Every question: { title, topic, difficulty, company?, functionName,
 *   description, examples?, constraints?, testCases, starterCode, argTypes? }
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
const { applyFrequencyMetadata } = require("./company-frequency");

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
];

// Safety net: never seed duplicate titles (seeding is keyed by title).
const seen = new Set();
const deduped = questions.filter((q) => {
  const key = String(q.title).toLowerCase();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// Attach company interview-frequency metadata (frequencyRank + interviewFrequency)
// so the selection engine can prioritise the questions companies actually ask.
const ranked = deduped.map(applyFrequencyMetadata);

module.exports = { questions: ranked };
