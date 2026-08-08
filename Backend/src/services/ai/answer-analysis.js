/**
 * Answer analysis — deterministic classification of the candidate's latest
 * reply, computed BEFORE the AI interviewer generates its next response.
 *
 * This is the engine behind Issue 3 ("the AI must actually analyze the
 * candidate's answer"): instead of reacting to a fixed script, both AI
 * providers (OpenAI + mock) ground their next question in this analysis plus
 * the candidate's exact words.
 *
 * Signals produced:
 *  - category: hint_request | dont_know | off_topic | filler | incorrect |
 *              correct | substantive
 *  - answeredPending: whether the reply engages the most recent interviewer
 *    question (topic overlap check).
 *  - mentionedTopics / algorithmKeywords: what the candidate actually said.
 *  - complexityClaims: any O(...) claims the candidate made.
 *  - incorrectComplexity: structured explanation of a wrong complexity claim
 *    (e.g. "hash map" + O(log n) -> corrected fact "O(1) average").
 */

// "I don't know"-style phrases count ONLY when they dominate the message: if
// the reply also names a data structure / algorithm / complexity / approach,
// the candidate is reasoning while hedging and the interviewer should engage.
const DONT_KNOW_PHRASE =
  /\bi don'?t know\b|\bi(?:'m| am) not sure\b|\bnot sure\b|\bno idea\b|\bi have no idea\b|\bdon'?t understand\b|\bdon'?t know how\b|\bcan'?t think\b|\bstuck\b|\bunsure\b/i;
const SUBSTANTIVE_MARKER =
  /\b(hash ?map|hash table|dictionary|two pointers?|sliding window|binary search|recursi\w+|bfs|dfs|sort\w*|stacks?|queues?|heap|priority queue|greedy|dynamic programming|\bdp\b|memoiz\w+|backtrack\w*|union find|linked list|monotonic)\b|o\(|time complexity|space complexity|big o|approach|algorithm|brute|optimize|data structure|complexity|edge case/i;

// Conversation-vocabulary used to decide whether a reply addresses the pending
// interviewer question and what the candidate is talking about.
const TOPIC_WORDS = [
  ["hash map", /\bhash\s*map|hashmap|hash table|dictionary\b/i],
  ["two pointers", /\btwo pointers?|two-pointer\b/i],
  ["sliding window", /\bsliding window\b/i],
  ["binary search", /\bbinary search\b/i],
  ["recursion", /\brecursi\w+/i],
  ["bfs/dfs", /\b(bfs|dfs|breadth|depth)\b/i],
  ["sorting", /\bsort\w*\b/i],
  ["stack", /\bstacks?\b/i],
  ["queue", /\bqueues?\b/i],
  ["heap", /\bheap\b|priority queue/i],
  ["greedy", /\bgreedy\b/i],
  ["dynamic programming", /\bdynamic programming|\bdp\b|memoiz\w+/i],
  ["backtracking", /\bbacktrack\w+/i],
  ["union find", /\bunion find\b/i],
  ["linked list", /\blinked list\b/i],
  ["arrays", /\barrays?\b/i],
  ["strings", /\bstrings?\b/i],
  ["trees", /\btrees?\b/i],
  ["graphs", /\bgraphs?\b/i],
  ["complexity", /\bcomplexity|big o|o\(|time\b|space\b/i],
  ["edge cases", /\bedge cases?\b/i],
  ["approach", /\bapproach|algorithm\b/i],
  ["brute force", /\bbrute\b/i],
  ["example", /\bexample|walk through|sample\b/i],
  ["input/output", /\binput|output\b/i],
  ["optimization", /\boptimiz\w+\b/i],
  ["data structure", /\bdata structure\b/i],
];

const extractTopics = (text) =>
  TOPIC_WORDS.filter(([, re]) => re.test(String(text || ""))).map(([name]) => name);

// Generic meta-topics are how candidates ANSWER data-structure questions
// ("because of O(1) lookups", "my approach is..."). Naming only these never
// counts as changing the topic.
const GENERIC_TOPICS = new Set([
  "complexity",
  "approach",
  "data structure",
  "optimization",
  "edge cases",
  "brute force",
  "example",
  "input/output",
]);

const FILLER_PATTERN =
  /\b(i like|i prefer|that'?s (nice|great|interesting|good)|okay?|sure|hmm|interesting|not really|maybe|i guess)\b/i;

// A reply counts as "I don't know" only when the don't-know phrase dominates:
// if it also names a data structure / algorithm / complexity / approach, the
// candidate is reasoning while hedging — treat it as substantive.
const isDontKnowResponse = (text) =>
  DONT_KNOW_PHRASE.test(String(text || "")) && !SUBSTANTIVE_MARKER.test(String(text || ""));

const ALGO_KEYWORDS = [
  ["hash map", "hash map", "hashmap", "hash table", "dictionary"],
  ["two pointers", "two pointers", "two-pointer"],
  ["sliding window", "sliding window"],
  ["binary search", "binary search"],
  ["recursion", "recursion", "recursive"],
  ["bfs", "\\bbfs\\b", "breadth"],
  ["dfs", "\\bdfs\\b", "depth"],
  ["sorting", "\\bsort\\b", "sorting"],
  ["stack", "\\bstacks?\\b"],
  ["queue", "\\bqueues?\\b"],
  ["heap", "\\bheap\\b", "priority queue"],
  ["greedy", "greedy"],
  ["dynamic programming", "dynamic programming", "\\bdp\\b", "memoiz"],
  ["backtracking", "backtrack"],
  ["union find", "union find"],
  ["linked list", "linked list"],
  ["monotonic", "monotonic"],
];

const detectAlgorithmKeywords = (text) => {
  const lower = String(text || "").toLowerCase();
  return ALGO_KEYWORDS.filter((group) =>
    group.slice(1).some((k) => new RegExp(k).test(lower))
  ).map((group) => group[0]);
};

// Known WRONG complexity claims for named techniques, with the fact to
// correct them with. Mirrors what a real interviewer would push back on.
const INCORRECT_COMPLEXITY_RULES = [
  {
    structure: /\bhash\s*map|hashmap|hash table|dictionary\b/i,
    wrong: /o\(\s*log\s*n\s*\)|o\(\s*n\s*\^?\s*2\s*\)|quadratic|o\(\s*n\s*!\s*\)/i,
    correction: "hash map lookups average O(1), not O(log n) or O(n²)",
  },
  {
    structure: /\bbinary search\b/i,
    wrong: /o\(\s*n\s*\)|o\(\s*n\s*\^?\s*2\s*\)|linear|quadratic/i,
    correction: "binary search runs in O(log n)",
  },
  {
    structure: /\bsliding window\b/i,
    wrong: /o\(\s*n\s*\^?\s*2\s*\)|quadratic|o\(\s*n\s*!\s*\)/i,
    correction: "a sliding window typically achieves O(n)",
  },
  {
    structure: /\btwo pointers?\b|two-pointer/i,
    wrong: /o\(\s*n\s*\^?\s*2\s*\)|quadratic/i,
    correction: "the two-pointer scan runs in O(n)",
  },
  {
    structure: /\bsort\w*\b/i,
    wrong: /o\(\s*n\s*\)|linear/i,
    correction: "comparison sorts run in O(n log n)",
  },
  {
    structure: /\bdynamic programming|\bdp\b|memoiz\w+/i,
    wrong: /o\(\s*n\s*!\s*\)|exponential/i,
    correction: "memoization removes the exponential recomputation",
  },
];

const detectIncorrectComplexity = (text) => {
  for (const rule of INCORRECT_COMPLEXITY_RULES) {
    if (rule.structure.test(text) && rule.wrong.test(text)) {
      return { structure: rule.structure.source, correction: rule.correction };
    }
  }
  return null;
};

// Known CORRECT complexity claims — affirmative evidence the candidate
// understands the technique they named.
const CORRECT_COMPLEXITY_RULES = [
  {
    structure: /\bhash\s*map|hashmap|hash table|dictionary\b/i,
    right: /o\(\s*1\s*\)|constant[- ]?time|o\(\s*c\s*\)/i,
  },
  {
    structure: /\bbinary search\b/i,
    right: /o\(\s*log\s*n\s*\)|logarithmic/i,
  },
  {
    structure: /\bsliding window\b/i,
    right: /o\(\s*n\s*\)|linear/i,
  },
  {
    structure: /\btwo pointers?\b|two-pointer/i,
    right: /o\(\s*n\s*\)|linear/i,
  },
  {
    structure: /\bsort\w*\b/i,
    right: /o\(\s*n\s*log\s*n\s*\)|linearithmic|o\(\s*n\s*\*\s*log\s*n\s*\)/i,
  },
];

const detectCorrectComplexity = (text) =>
  CORRECT_COMPLEXITY_RULES.some((rule) => rule.structure.test(text) && rule.right.test(text));

// Most recent assistant message that actually poses a question.
const extractPendingQuestion = (history) => {
  if (!Array.isArray(history)) return null;
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    if (m && m.role === "assistant" && /[?？]/.test(String(m.content || ""))) {
      return String(m.content).slice(-2000);
    }
  }
  return null;
};

const lastUserMessage = (history) => {
  if (!Array.isArray(history)) return "";
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    if (m && m.role === "user") {
      const content = String(m.content || "").trim();
      if (content) return content;
    }
  }
  return "";
};

/**
 * Analyze the candidate's latest answer.
 *
 * @param {object} args
 * @param {string} [args.userMessage] The candidate's reply (defaults to the
 *   last user message in history).
 * @param {string} [args.pendingQuestion] The most recent interviewer question.
 * @param {object} [args.question] The session question.
 * @param {Array}  [args.history] Message history.
 */
const analyzeAnswer = ({ userMessage, pendingQuestion, question, history } = {}) => {
  const text = String(userMessage ?? lastUserMessage(history) ?? "").trim();
  const lower = text.toLowerCase();
  const pending = String(pendingQuestion || extractPendingQuestion(history) || "");

  const mentionsHint =
    /\bhint\b/.test(lower) &&
    !/\b(?:no|don'?t|not)\s+(?:need\s+)?a?\s*hint\b/.test(lower);
  const isDontKnow = DONT_KNOW_PHRASE.test(text) && !SUBSTANTIVE_MARKER.test(text);

  const questionTopics = extractTopics(pending);
  const replyTopics = extractTopics(lower);
  const specificReplyTopics = replyTopics.filter((t) => !GENERIC_TOPICS.has(t));
  const evaluated = pending.length > 0 && questionTopics.length > 0 && questionTopics.length <= 3;
  // A specific technique (e.g. "sliding window") answers a generic pending
  // question ("what algorithm would you use?") — only a reply naming a
  // DIFFERENT specific topic is a real topic change.
  const answeredPending =
    evaluated &&
    (questionTopics.some((t) => replyTopics.includes(t)) ||
      (questionTopics.every((t) => GENERIC_TOPICS.has(t)) && specificReplyTopics.length > 0));
  const changedTopic = evaluated && !answeredPending && specificReplyTopics.length > 0;
  const gaveNonAnswer =
    evaluated &&
    !answeredPending &&
    replyTopics.length === 0 &&
    !SUBSTANTIVE_MARKER.test(lower) &&
    (FILLER_PATTERN.test(lower) || lower.length < 25);

  const complexityClaims = [...text.matchAll(/o\s*\(\s*[^)]*\)/gi)].map((m) =>
    m[0].replace(/\s+/g, " ").toUpperCase()
  );
  const incorrectComplexity = detectIncorrectComplexity(text);
  const hasCorrectComplexity = detectCorrectComplexity(text);

  let category = "substantive";
  if (mentionsHint) category = "hint_request";
  else if (isDontKnow) category = "dont_know";
  else if (changedTopic) category = "off_topic";
  else if (gaveNonAnswer) category = "filler";
  else if (incorrectComplexity) category = "incorrect";
  else if (hasCorrectComplexity) category = "correct";
  else if (complexityClaims.length > 0 && !hasCorrectComplexity) category = "substantive";

  return {
    category,
    messageLength: text.length,
    mentionsHint,
    isDontKnow,
    answeredPending: evaluated ? answeredPending : null,
    changedTopic,
    gaveNonAnswer,
    questionTopics,
    mentionedTopics: replyTopics,
    algorithmKeywords: detectAlgorithmKeywords(text),
    complexityClaims,
    incorrectComplexity,
    hasCorrectComplexity,
    approachMentioned: /\b(approach|algorithm|idea|plan|strategy)\b/i.test(text),
    complexityMentioned:
      /o\(|time complexity|space complexity|big o|complexity/i.test(text),
    edgeCasesMentioned: /\b(edge cases?|empty input|duplicates|boundary|null input)\b/i.test(text),
    codeMentioned: /\bcode|implement|function|submit|run\b/i.test(text),
    substantive: SUBSTANTIVE_MARKER.test(text) || text.length >= 25,
  };
};

module.exports = {
  analyzeAnswer,
  extractPendingQuestion,
  lastUserMessage,
  extractTopics,
  detectAlgorithmKeywords,
  isDontKnowResponse,
  GENERIC_TOPICS,
  FILLER_PATTERN,
  INCORRECT_COMPLEXITY_RULES,
  CORRECT_COMPLEXITY_RULES,
};
