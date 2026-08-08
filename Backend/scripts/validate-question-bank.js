/**
 * Validate the expanded multi-company question bank.
 *
 * Checks (no database required — pure data assertions):
 *   - 100+ unique questions
 *   - coverage of all 10 companies and all 18 topics
 *   - every question has companies, roles, functionName, per-company frequency
 *   - no duplicate titles
 *
 * Run: node scripts/validate-question-bank.js
 */
const { questions } = require("../src/data/questions.seed");

const REQUIRED_COMPANIES = [
  "Google", "Amazon", "Meta", "Microsoft", "Apple",
  "Netflix", "Uber", "Airbnb", "Stripe", "OpenAI",
];

const REQUIRED_TOPICS = [
  "Arrays", "Strings", "Hash Maps", "Two Pointers", "Sliding Window",
  "Binary Search", "Linked Lists", "Trees", "Graphs", "BFS", "DFS",
  "Dynamic Programming", "Backtracking", "Greedy", "Heap", "Stack",
  "Queue", "Union Find",
];

let passed = 0;
let failed = 0;

const assert = (label, condition, detail = "") => {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
  }
};

const main = () => {
  console.log("\n=== Question Bank Validation ===\n");

  assert("100+ questions", questions.length >= 100, `got ${questions.length}`);
  console.log(`  (total questions: ${questions.length})`);

  // Company coverage (multi-company associations).
  const byCompany = {};
  for (const q of questions) {
    for (const company of q.companies || []) {
      byCompany[company] = (byCompany[company] || 0) + 1;
    }
  }
  for (const company of REQUIRED_COMPANIES) {
    assert(
      `Company "${company}" covered`,
      (byCompany[company] || 0) >= 5,
      `${byCompany[company] || 0} questions`
    );
  }

  // Topic coverage (normalized: the bank uses "Arrays & Hashing", which
  // covers both the "Arrays" and "Hash Maps" requirements; BFS/DFS have their
  // own topic labels in the expansion bank).
  const TOPIC_ALIASES = {
    "hash maps": "hash",
  };
  const lowerTopic = questions.map((q) => String(q.topic || "").toLowerCase());
  for (const topic of REQUIRED_TOPICS) {
    const needle = TOPIC_ALIASES[topic.toLowerCase()] || topic.toLowerCase();
    const covered = lowerTopic.some((t) => t.includes(needle));
    assert(`Topic "${topic}" covered`, covered);
  }

  // Per-question metadata completeness.
  const missingCompanies = questions.filter((q) => !(q.companies || []).length);
  const missingRoles = questions.filter((q) => !Array.isArray(q.roles) || !q.roles.length);
  const missingFn = questions.filter((q) => !q.functionName);
  const missingFrequency = questions.filter(
    (q) => !q.companyFrequencies || Object.keys(q.companyFrequencies).length === 0
  );
  assert("Every question has company associations", missingCompanies.length === 0,
    missingCompanies.map((q) => q.title).join(", "));
  assert("Every question has role relevance", missingRoles.length === 0,
    missingRoles.map((q) => q.title).join(", "));
  assert("Every question has a function name", missingFn.length === 0,
    missingFn.map((q) => q.title).join(", "));
  assert("Every question has per-company frequency metadata", missingFrequency.length === 0,
    missingFrequency.map((q) => q.title).join(", "));

  // Duplicates.
  const seenTitles = new Set();
  const dupTitles = questions.filter((q) => {
    const key = String(q.title).toLowerCase();
    if (seenTitles.has(key)) return true;
    seenTitles.add(key);
    return false;
  });
  assert("No duplicate question titles", dupTitles.length === 0,
    dupTitles.map((q) => q.title).join(", "));

  const fnCounts = {};
  for (const q of questions) fnCounts[q.functionName] = (fnCounts[q.functionName] || 0) + 1;
  const dupFns = Object.entries(fnCounts).filter(([, n]) => n > 1).map(([k, n]) => `${k} (${n})`);
  // Same function name across different problems is harmless (they never share
  // a session), but it is reported for awareness.
  if (dupFns.length) {
    console.log(`  ℹ️ duplicate function names (different problems, harmless): ${dupFns.join(", ")}`);
  }

  // Drift check: every title referenced by the curated company-frequency maps
  // should exist in the bank. Phantom titles are runtime-safe (title-keyed
  // lookups are no-ops) but mean the curated per-company rankings silently do
  // not apply — flag them so the maps stay in sync with the bank.
  const {
    MULTI_COMPANY_MAP,
    FREQUENCY_BY_COMPANY,
  } = require("../src/data/company-frequency");
  const bankTitles = new Set(questions.map((q) => String(q.title).toLowerCase()));
  const phantomTitles = new Set();
  for (const title of Object.keys(MULTI_COMPANY_MAP)) {
    if (!bankTitles.has(title.toLowerCase())) phantomTitles.add(title);
  }
  for (const companyMap of Object.values(FREQUENCY_BY_COMPANY)) {
    for (const title of Object.keys(companyMap)) {
      if (!bankTitles.has(title.toLowerCase())) phantomTitles.add(title);
    }
  }
  if (phantomTitles.size) {
    console.log(
      `  ℹ️ titles referenced by frequency maps but missing from the bank (harmless, ${phantomTitles.size}): ${[...phantomTitles].slice(0, 12).join(", ")}${phantomTitles.size > 12 ? "…" : ""}`
    );
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
};

main();
