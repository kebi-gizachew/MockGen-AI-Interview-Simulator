const { AI_RESPONSE_TYPES } = require("../../../constants/interview.constants");
const { recommendationFromScore } = require("../../../utils/recommendation");
const {
  analyzeAnswer,
  extractTopics,
  detectAlgorithmKeywords,
  isDontKnowResponse,
  GENERIC_TOPICS,
  FILLER_PATTERN,
} = require("../answer-analysis");

/**
 * Mock AI provider — used when AI_PROVIDER=mock or no GEMINI_API_KEY is configured.
 *
 * Unlike a real LLM, this provider computes everything from the actual
 * interview evidence (performance signals, submitted code test results,
 * transcript behavior). Scores are NEVER fixed: they move with test pass
 * rate, hints requested, approach/communication quality and improvement.
 */

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const questionOf = (ctx) => (ctx && ctx.question) || {};
const signalsOf = (ctx) => (ctx && ctx.performanceSignals) || {};
const titleOf = (ctx) => questionOf(ctx).title || "the assigned problem";
const fnOf = (ctx) => questionOf(ctx).functionName || "your function";
const topicOf = (ctx) => questionOf(ctx).topic || "";
const lastSubmission = (ctx) => {
  const subs = (ctx && ctx.codeSubmissions) || [];
  return subs[subs.length - 1] || null;
};

const historyOf = (ctx) => (ctx && ctx.history) || [];
const askedOf = (ctx) => (ctx && ctx.askedQuestions) || [];
const hasAsked = (ctx, pattern) =>
  askedOf(ctx).some((q) => pattern.test(String(q || "").toLowerCase()));

// Last substantive (non-empty) candidate message — used to ground follow-ups
// in what the candidate actually said instead of repeating canned questions.
const lastUserMessage = (ctx) => {
  const history = historyOf(ctx);
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i] && history[i].role === "user") {
      const content = String(history[i].content || "").trim();
      if (content) return content;
    }
  }
  return "";
};

// The most recent interviewer question (last assistant message containing a
// question) — the question the candidate's latest reply should be answering.
const lastAssistantMessage = (ctx) => {
  const history = historyOf(ctx);
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i] && history[i].role === "assistant") {
      const content = String(history[i].content || "").trim();
      if (content) return content;
    }
  }
  return "";
};

// Technique-specific follow-up probes: when the candidate NAMES an algorithm /
// data structure, probe THAT choice (Issue 3 — the response depends on what
// they actually said, e.g. "sliding window" gets 'what condition lets the
// window expand or shrink?', not a generic 'walk me through it').
const keywordFollowUp = (keyword, title, fn) => {
  const probes = {
    "hash map": `You mentioned a hash map. What exactly would it store for ${title}, and why does O(1) average lookup beat scanning every candidate pair with nested loops?`,
    "two pointers": `You mentioned two pointers. What must be true about the input for two pointers to work on ${title}, and how do the pointers move?`,
    "sliding window": `Why does a sliding window apply to ${title}? What condition allows the window to expand or shrink, and what invariant does it maintain?`,
    "binary search": `What condition makes binary search applicable to ${title}, and what invariant are you maintaining while narrowing the range?`,
    recursion: `What would the base case and the recursive case be for ${title}?`,
    bfs: `Why breadth-first for ${title} — what does BFS guarantee that DFS doesn't here?`,
    dfs: `Why depth-first for ${title} — where does DFS fit the structure better or save memory?`,
    sorting: `How would sorting the input help solve ${title}, and what would that cost in time?`,
    stack: `What would you push onto the stack for ${title}, and when would you pop?`,
    queue: `What order would a queue preserve for ${title}?`,
    heap: `What would you store in the heap for ${title}, and what priority orders it?`,
    greedy: `What local decision would you lock in at each step for ${title}, and why is it safe?`,
    "dynamic programming": `What is the subproblem for ${title}, and what recurrence relates the subproblems?`,
    backtracking: `What choices would you explore and undo for ${title}?`,
    "union find": `What would the connected components represent for ${title}?`,
    "linked list": `What about the linked-list structure matters most for ${title}?`,
    monotonic: `What makes a monotonic stack or queue the right choice for ${title}?`,
  };
  return (
    probes[keyword] ||
    `You mentioned ${keyword}. Walk me through how you'd apply it to ${title}: where exactly does it save work, and what would the time and space complexity be? Also think about edge cases like empty input or duplicates.`
  );
};

// Rephrase the pending question when the candidate did not actually answer it —
// a real interviewer re-engages the same topic rather than moving on.
const rephraseForTopic = (topic, title) => {
  const rephrases = {
    "hash map": `what makes a hash map the right tool here — specifically, what does O(1) lookup buy us for ${title} compared to a linear scan?`,
    "two pointers": `where would two pointers help for ${title}, and what must be true about the input for them to work?`,
    "sliding window": `what would the sliding window represent for ${title}, and when do we grow or shrink it?`,
    "binary search": `what condition makes binary search applicable to ${title}, and what invariant are we maintaining?`,
    recursion: `what would the recursive case and the base case be for ${title}?`,
    "bfs/dfs": `for ${title}, would you traverse breadth-first or depth-first, and why does that choice matter?`,
    sorting: `how would sorting the input help solve ${title}, and what would the time cost be?`,
    stack: `what would you push onto the stack for ${title}, and when would you pop?`,
    queue: `what order would a queue preserve for ${title}?`,
    heap: `what would you store in the heap for ${title}, and what priority would order it?`,
    greedy: `what local decision would you lock in at each step for ${title}, and why is it safe?`,
    "dynamic programming": `what is the subproblem for ${title}, and what recurrence relates them?`,
    backtracking: `what choices would you explore and undo for ${title}?`,
    "union find": `what would the connected components represent for ${title}?`,
    "linked list": `what about the linked-list structure matters most for ${title}?`,
    arrays: `how do arrays fit into your plan for ${title} — and specifically, which operation is expensive with them?`,
    strings: `what string operation would you lean on for ${title}, and what does it cost?`,
    trees: `what traversal or property of trees applies to ${title}?`,
    graphs: `what graph representation would you use for ${title}, and why?`,
    complexity: `for ${title}, what is the time complexity of your approach, and why — walk me through the dominant operation.`,
    "edge cases": `what input could break your solution for ${title} — empty, duplicates, or very large input?`,
    approach: `what algorithm and data structures do you plan to use for ${title}, and why those?`,
    "brute force": `how would you solve ${title} with a brute-force approach, even if it's slow?`,
    example: `let's apply your idea to Example 1 for ${title} — walk me through each step and the answer it produces.`,
    "input/output": `for ${title}, what are the inputs and the expected output?`,
    optimization: `where is the bottleneck in your current solution for ${title}?`,
    "data structure": `which data structure fits ${title}, and what property of it helps here?`,
  };
  return rephrases[topic] || `tell me more about ${topic} as it applies to ${title}.`;
};

// detectAlgorithmKeywords (shared from answer-analysis) drives the follow-up
// probes; local alias keeps call sites readable.
const detectAlgoKeywords = detectAlgorithmKeywords;

// Derive the interview stage from context as a fallback (aiInterview.service
// normally injects ctx.stage, but the provider should never assume it).
const stageOf = (ctx) => {
  if (ctx && ctx.stage) return ctx.stage;
  if (ctx && Array.isArray(ctx.codeSubmissions) && ctx.codeSubmissions.length > 0) {
    return "post_submission";
  }
  if (ctx && Array.isArray(ctx.history) && ctx.history.some((m) => m.role === "user")) {
    return "approach";
  }
  return "opening";
};

// Topic -> first/second-level hint techniques, used only when the candidate asks.
const TOPIC_HINTS = {
  "arrays & hashing": "a hash map gives O(1) lookups — a single pass recording what you've seen is usually optimal",
  "arrays": "see whether a hash map or sorting removes the need for a nested loop",
  "stack": "a stack naturally models nested or balanced structures — push on open, pop on close",
  "two pointers": "with the structure sorted or monotonic, two pointers moving toward each other beat nested loops",
  "sliding window": "a left/right window that stays valid is the classic O(n) approach",
  "strings": "try a two-pointer scan or expanding around a center to avoid O(n^2) re-scanning",
  "trees": "recursion fits naturally — decide what each recursive call should return",
  "graphs": "BFS or DFS with a visited set is the standard tool here",
  "dynamic programming": "define the subproblem and its recurrence; bottom-up usually avoids recursion overhead",
  "intervals": "sorting by start time is almost always the first move for interval problems",
};

const findHint = (topic) => {
  const lower = String(topic || "").toLowerCase();
  for (const [key, hint] of Object.entries(TOPIC_HINTS)) {
    if (lower.includes(key)) return hint;
  }
  return null;
};

/**
 * ZERO-BASED evidence scoring. Every sub-score starts at 0 and points are
 * earned ONLY from demonstrated progress:
 *   - test pass rate (correctness dominates)
 *   - approach / complexity / edge-case discussion
 *   - improvement across submissions
 * Penalties: hints requested and "I don't know" responses.
 * A candidate who does nothing scores 0; repeated "I don't know" scores 0-5.
 * There is NO baseline — completing the interview itself earns nothing.
 */
const computeSummaryScore = (ctx) => {
  const s = signalsOf(ctx);
  const hasSubmission = s.submissionsCount > 0 && s.bestTestPassRate !== null;
  const passRate = hasSubmission ? clamp(s.bestTestPassRate, 0, 100) : 0;
  const dontKnow = s.dontKnowResponses || 0;

  // Problem solving: correctness dominates; approach/edge-case/improvement
  // discussion earns modest credit even without a passing submission.
  let problemSolving = 0;
  if (hasSubmission) problemSolving += (passRate / 100) * 65;
  if (s.approachDiscussed) problemSolving += 12;
  if (s.edgeCasesDiscussed) problemSolving += 12;
  if (s.improvedAcrossSubmissions) problemSolving += 11;
  if (!hasSubmission) problemSolving = Math.min(problemSolving, 35); // approach-only cap
  problemSolving -= clamp(dontKnow * 5, 0, 20);
  problemSolving = clamp(Math.round(problemSolving), 0, 100);

  // Communication: only what the candidate actually explained.
  let communication = 0;
  if (s.approachDiscussed) communication += 24;
  if (s.complexityStated) communication += 20;
  if (s.edgeCasesDiscussed) communication += 12;
  // Volume credit only counts when messages actually contain content
  // (avg length >= 10) — one-word replies earn nothing.
  if (s.avgUserMessageLength >= 10) communication += clamp(s.userMessageCount * 4, 0, 20);
  communication +=
    s.avgUserMessageLength >= 60 ? 8 : s.avgUserMessageLength >= 25 ? 5 : s.avgUserMessageLength >= 10 ? 2 : 0;
  communication -= clamp(dontKnow * 4, 0, 16);
  communication = clamp(Math.round(communication), 0, 100);

  // Code quality: anchored to working code. No submission -> 0.
  let codeQuality = 0;
  if (hasSubmission) codeQuality += 15 + (passRate / 100) * 80;
  if (s.improvedAcrossSubmissions) codeQuality += 5;
  // Never award top-tier code quality when trade-offs/complexity were never
  // discussed — keeps the score honest.
  if (!s.complexityStated) codeQuality = Math.min(codeQuality, 85);
  codeQuality = clamp(Math.round(codeQuality), 0, 100);

  // Optimization: complexity + efficiency evidence only.
  let optimization = 0;
  if (s.complexityStated) optimization += 34;
  if (hasSubmission && passRate >= 100) optimization += 38;
  else if (hasSubmission && passRate >= 50) optimization += 18;
  optimization -= clamp(s.hintsRequested * 6, 0, 20);
  optimization = clamp(Math.round(optimization), 0, 100);

  // Overall: correctness dominates, then problem solving / communication.
  let overall =
    0.45 * passRate +
    0.18 * problemSolving +
    0.12 * codeQuality +
    0.15 * communication +
    0.1 * optimization;
  overall -= clamp(s.hintsRequested * 2, 0, 10);
  overall -= clamp(dontKnow * 6, 0, 24);
  if (s.improvedAcrossSubmissions) overall += 4;
  overall = clamp(Math.round(overall), 0, 100);

  return { overall, problemSolving, codeQuality, communication, optimization };
};

// HONEST strengths: only genuine, evidence-backed positives. Empty array when
// there is nothing real to praise (the UI already shows a neutral fallback
// message) — we never invent a strength for a candidate who showed none.
const buildStrengthList = (ctx) => {
  const s = signalsOf(ctx);
  const title = titleOf(ctx);
  const strengths = [];
  if (s.bestTestPassRate === 100) strengths.push(`Passed every test case on ${title}.`);
  else if (s.bestTestPassRate >= 50) strengths.push(`Produced working code that passed ${s.bestTestPassRate}% of test cases.`);
  if (s.approachDiscussed) strengths.push("Explained the approach before writing code.");
  if (s.complexityStated) strengths.push("Stated time/space complexity explicitly.");
  if (s.edgeCasesDiscussed) strengths.push("Reasoned about edge cases and boundary conditions.");
  if (s.improvedAcrossSubmissions) strengths.push("Acted on feedback and improved the solution across submissions.");
  return strengths.slice(0, 4);
};

const buildWeaknessList = (ctx) => {
  const s = signalsOf(ctx);
  const title = titleOf(ctx);
  const weaknesses = [];
  if (s.submissionsCount === 0) weaknesses.push(`Never submitted runnable code for ${title} — coding output is the core of the evaluation.`);
  else if (s.bestTestPassRate < 100) weaknesses.push(`Final solution did not pass all test cases (best: ${s.bestTestPassRate ?? 0}%).`);
  if (!s.approachDiscussed) weaknesses.push("Started coding without clearly explaining the approach first.");
  if (!s.complexityStated) weaknesses.push("Did not explicitly state time and space complexity.");
  // The "I don't know" weakness goes first so the 4-item cap never hides it.
  if ((s.dontKnowResponses || 0) > 0) {
    weaknesses.push(
      `Answered "I don't know" ${s.dontKnowResponses} time(s) — practice verbalizing partial understanding even when unsure.`
    );
  }
  if (!s.edgeCasesDiscussed) weaknesses.push("Edge cases (empty input, duplicates, large inputs) were not discussed.");
  if (s.hintsRequested > 0) weaknesses.push(`Asked for ${s.hintsRequested} hint(s) — try to reason further before asking.`);
  if (weaknesses.length === 0) weaknesses.push("Could push further on trade-offs and alternative approaches.");
  return weaknesses.slice(0, 4);
};

const buildRecommendationList = (ctx) => {
  const s = signalsOf(ctx);
  const recommendations = [];
  if (s.submissionsCount === 0) recommendations.push("Always implement and run a solution — even an imperfect one — to get executable feedback.");
  else if (s.bestTestPassRate < 100) recommendations.push("Debug failing tests systematically: compare expected vs actual and trace the logic by hand.");
  if (!s.approachDiscussed) recommendations.push("Before coding, state your algorithm, data structures, and complexity out loud.");
  if (!s.complexityStated) recommendations.push("Always state time and space complexity, and verify them against the constraints.");
  // The "I don't know" recommendation goes first so the 4-item cap never hides it.
  if ((s.dontKnowResponses || 0) > 0) {
    recommendations.push(
      "When unsure, verbalize what you DO understand (inputs, a brute-force approach, one data structure) instead of stopping at \"I don't know\"."
    );
  }
  if (!s.edgeCasesDiscussed) recommendations.push("Enumerate edge cases (empty, duplicate, large) before finalizing a solution.");
  if (s.hintsRequested > 0) recommendations.push("Push yourself to derive the key insight before requesting a hint.");
  if (s.bestTestPassRate === 100) recommendations.push("Practice follow-up rounds: optimize further and analyze behavior on large inputs.");
  if (recommendations.length === 0) recommendations.push("Practice verbalizing your reasoning while coding to strengthen communication.");
  return recommendations.slice(0, 4);
};

// Mid-interview exchange score — also ZERO-based: only real evidence earns
// points, and "I don't know" replies are penalized heavily.
const feedbackScore = (ctx) => {
  const s = signalsOf(ctx);
  return clamp(
    Math.round(
      0 +
        (s.approachDiscussed ? 16 : 0) +
        (s.complexityStated ? 16 : 0) +
        (s.edgeCasesDiscussed ? 10 : 0) +
        (s.improvedAcrossSubmissions ? 8 : 0) -
        s.hintsRequested * 6 -
        (s.dontKnowResponses || 0) * 8
    ),
    0,
    100
  );
};

const generateMockInterviewResponse = async ({ userMessage, interviewContext }) => {
  const lower = String(userMessage || "").toLowerCase();
  const stage = stageOf(interviewContext);
  const title = titleOf(interviewContext);
  const fn = fnOf(interviewContext);
  const topic = topicOf(interviewContext);

  // --- Candidate asks for a hint ---
  if (/\bhint\b/.test(lower)) {
    const hint = findHint(topic);
    const askedBefore = (signalsOf(interviewContext).hintsRequested || 0) > 1;
    return {
      type: AI_RESPONSE_TYPES.QUESTION,
      message: askedBefore
        ? `Here's a sharper nudge for ${title}: the key insight is to ${hint ? hint.split(" — ")[0] + " — " + (hint.split(" — ")[1] || "reduce redundant work") : "reduce redundant work by remembering what you've already computed"}. How does that change the algorithm you had in mind?`
        : `Okay — a nudge, not the answer: for ${title}, consider whether ${hint || "a data structure with O(1) lookups"} eliminates the redundant work. What would that suggest for the time complexity?`,
      score: 0,
    };
  }

  // --- Incorrect technical claim (e.g. "a hashmap makes this O(log n)"):
  //     push back with the correct fact instead of moving on (Issue 3). The
  //     shared answer-analysis detects the wrong structure+complexity pairing.
  {
    const analysis = analyzeAnswer({
      userMessage,
      pendingQuestion: lastAssistantMessage(interviewContext),
      question: interviewContext?.question,
      history: historyOf(interviewContext),
    });
    if (
      analysis.incorrectComplexity &&
      !hasAsked(interviewContext, /revisit|not .* but|actually is|correction/)
    ) {
      return {
        type: AI_RESPONSE_TYPES.QUESTION,
        message: `Let's revisit that — ${analysis.incorrectComplexity.correction}. Can you walk me through how that affects the overall complexity of your approach for ${title}?`,
        score: 0,
      };
    }
  }

  // --- Candidate says "I don't know" / is stuck: guide learning, never praise ---
  if (isDontKnowResponse(lower)) {
    const dontKnowCount = signalsOf(interviewContext).dontKnowResponses || 0;
    const alreadyGuiding = hasAsked(interviewContext, /what part of the problem|brute-force|average lookup|walk through example/);
    if (dontKnowCount >= 2 || alreadyGuiding) {
      return {
        type: AI_RESPONSE_TYPES.QUESTION,
        message: `That's okay — let's go step by step. Start with Example 1 for ${title}: identify the input and the expected output, then tell me what the simplest possible (even brute-force) answer would be.`,
        score: 0,
      };
    }
    return {
      type: AI_RESPONSE_TYPES.QUESTION,
      message:
        `I appreciate your honesty — let's work through it together. What part of the problem is confusing you: the input/output, or how to start solving it? ` +
        `Even describing a brute-force approach — checking every possible answer — is a good place to begin.`,
      score: 0,
    };
  }

  // --- Response-driven gate: did the candidate actually answer the pending
  //     interviewer question? Never assume a question was answered; if the
  //     reply is off-topic or avoids the topic, re-engage the SAME topic.
  //     Only single/moderately-focused questions are evaluated (the opening
  //     message touches many topics and is handled by the stage branches), and
  //     the gate is skipped in the post-submission stage where follow-ups are
  //     already grounded in code and test results.
  {
    const lastAssistant = lastAssistantMessage(interviewContext);
    const pendingTopics =
      lastAssistant && /[?？]/.test(lastAssistant) ? extractTopics(lastAssistant) : [];
    const replyTopics = extractTopics(lower);
    const evaluated =
      stage !== "post_submission" &&
      pendingTopics.length > 0 &&
      pendingTopics.length <= 3;
    // Only a reply naming a DIFFERENT specific structure/algorithm is a topic
    // change — generic meta-topics (complexity, approach, edge cases...) mean
    // the candidate is answering and the reply falls through to normal logic.
    const specificReplyTopics = replyTopics.filter((t) => !GENERIC_TOPICS.has(t));
    // A specific technique (e.g. "sliding window") answers a generic pending
    // question ("what algorithm would you use?") — only a reply naming a
    // DIFFERENT specific topic is a real topic change.
    const answeredTopic =
      evaluated &&
      (pendingTopics.some((t) => replyTopics.includes(t)) ||
        (pendingTopics.every((t) => GENERIC_TOPICS.has(t)) &&
          specificReplyTopics.length > 0));
    const changedTopic =
      evaluated && !answeredTopic && specificReplyTopics.length > 0;
    const gaveNonAnswer =
      evaluated &&
      !answeredTopic &&
      replyTopics.length === 0 &&
      !SUBSTANTIVE_MARKER.test(lower) &&
      (FILLER_PATTERN.test(lower) || lower.length < 25);

    if (
      (changedTopic || gaveNonAnswer) &&
      !hasAsked(interviewContext, /back to my question|didn'?t answer|rephrase/)
    ) {
      const topic = pendingTopics[0];
      if (changedTopic) {
        return {
          type: AI_RESPONSE_TYPES.QUESTION,
          message:
            `Before we go there — I asked about ${topic}, and you mentioned ${specificReplyTopics[0]}. ` +
            `Can you answer my question about ${topic} first? ${rephraseForTopic(topic, title)}`,
          score: 0,
        };
      }
      return {
        type: AI_RESPONSE_TYPES.QUESTION,
        message: `I don't think that answered my question about ${topic}. Let me rephrase: ${rephraseForTopic(topic, title)}`,
        score: 0,
      };
    }
  }

  // --- Post-submission stage: follow-ups grounded in the actual code ---
  if (stage === "post_submission") {
    const last = lastSubmission(interviewContext);
    const hasResults =
      last && last.passedTests !== null && last.passedTests !== undefined && last.totalTests;

    if (hasResults && last.totalTests > last.passedTests) {
      const failed = last.totalTests - last.passedTests;
      if (/\b(debug|fail|error|wrong|fix)\b/.test(lower)) {
        return {
          type: AI_RESPONSE_TYPES.QUESTION,
          message: `You're failing ${failed} test case(s). Walk me through the expected vs actual output on a failing case and where you think the logic diverges.`,
          score: 0,
        };
      }
      return {
        type: AI_RESPONSE_TYPES.QUESTION,
        message: `You're passing ${last.passedTests}/${last.totalTests} test cases. Look at the failing one — trace your ${fn} by hand and tell me what you think is going wrong.`,
        score: 0,
      };
    }

    if (hasResults) {
      // All tests pass — realistic follow-up depending on what the candidate says.
      if (/\b(optimize|faster|better|efficient|improve)\b/.test(lower)) {
        return {
          type: AI_RESPONSE_TYPES.QUESTION,
          message: `What is the current time complexity of ${fn}, where is the bottleneck, and what change would get you to the optimal bound for ${title}?`,
          score: 0,
        };
      }
      if (/\b(complexity|big o|o\(|time|space)\b/.test(lower)) {
        // Don't repeat the same complexity feedback if it was already given.
        if (hasAsked(interviewContext, /dominant term|precise about the bound/)) {
          return {
            type: AI_RESPONSE_TYPES.QUESTION,
            message: `Noted. Now tie it to the constraints of ${title}: would the current bound hold for the largest allowed input, and is there any hidden cost in the data structures you used?`,
            score: 0,
          };
        }
        return {
          type: AI_RESPONSE_TYPES.FEEDBACK,
          message: `That analysis is on the right track for ${fn}. Just be precise about the bound and justify it against the constraints of ${title} — walk me through the dominant term.`,
          score: feedbackScore(interviewContext),
        };
      }
      if (/\b(explain|why|reason|this part)\b/.test(lower)) {
        return {
          type: AI_RESPONSE_TYPES.FEEDBACK,
          message: `Understood. Let's go deeper: what invariants does your solution rely on, and how do you know it's correct for edge cases like empty input or duplicates?`,
          score: feedbackScore(interviewContext),
        };
      }
      // Anti-repetition: once optimization has been discussed, move to a fresh angle.
      if (hasAsked(interviewContext, /optimize|large input|10\^?6|very large/)) {
        return {
          type: AI_RESPONSE_TYPES.QUESTION,
          message: `All ${last.totalTests} tests pass for ${title}. Next: can you make the code more robust? Think about edge cases like empty input or duplicates, and whether there's a different data structure that would change the trade-offs.`,
          score: 0,
        };
      }
      return {
        type: AI_RESPONSE_TYPES.QUESTION,
        message: `Your solution passes all the test cases for ${title}. Follow-up: can you optimize ${fn}? What is the current time and space complexity, and what happens with a very large input like 10^6 elements?`,
        score: 0,
      };
    }

    return {
      type: AI_RESPONSE_TYPES.QUESTION,
      message: `Your last submission didn't run to completion — check the error in the test runner, fix it, and resubmit. While you do, what do you think is causing it?`,
      score: 0,
    };
  }

  // --- Approach stage (no code submitted yet) ---
  if (stage === "approach" || /\b(approach|think|idea|plan|algorithm|data structure|brute|naive|how about)\b/.test(lower)) {
    const lastReply = lastUserMessage(interviewContext);
    const algoKeywords = detectAlgoKeywords(lastReply);

    if (/\b(complexity|big o|o\(|time|space)\b/.test(lower)) {
      // Real-interview realism: if the candidate claims a low bound but the
      // description contains nested loops, the complexity can't be right.
      const claimsLowComplexity = /o\(\s*n\s*\)|linear/.test(lower);
      // Loop-specific language only — a plain double "for" (e.g. "good for
      // lookups, for example") must NOT trigger the pushback.
      const describesNestedLoops =
        /nested loop|loop inside|loop within|double loop|two loops|\bfor\s+(each|every)\b.*\b(for|loop)\b|o\(\s*n\s*\^\s*2\s*\)/.test(lower);
      if (claimsLowComplexity && describesNestedLoops && !hasAsked(interviewContext, /nested loop|quadratic/)) {
        return {
          type: AI_RESPONSE_TYPES.QUESTION,
          message: `Hold on — you mentioned O(n), but the nested loop you described suggests O(n²) since each outer step revisits the inner work. Can you walk me through where the quadratic term disappears for ${title}?`,
          score: 0,
        };
      }
      // Correct answer chain: confirm the specific fact, then build on it
      // (Issue 3 example: hash map + O(1) -> compare against the nested-loop
      // brute force instead of a generic "good").
      if (/o\(\s*1\s*\)|constant[- ]?time|o\(\s*c\s*\)/.test(lower)) {
        return {
          type: AI_RESPONSE_TYPES.QUESTION,
          message: `Correct — that operation is constant time. Given that, how does it change the overall complexity of ${fn} for ${title} compared to the brute-force approach?`,
          score: 0,
        };
      }
      // Complexity already discussed in this session — don't repeat the same push.
      if (hasAsked(interviewContext, /stress-test|different data structure/)) {
        const keywords = detectAlgoKeywords(lastReply);
        if (keywords.length > 0) {
          return {
            type: AI_RESPONSE_TYPES.QUESTION,
            message: `Understood. Given you're leaning on ${keywords[0]}, where exactly does it save work for ${title} compared to the naive approach, and what's the worst-case bound?`,
            score: 0,
          };
        }
      }
      return {
        type: AI_RESPONSE_TYPES.FEEDBACK,
        message: `You stated a complexity for ${fn}. Now stress-test it: is there redundant work a different data structure would eliminate, and what happens with edge cases like empty input or duplicates for ${title}?`,
        score: feedbackScore(interviewContext),
      };
    }

    // Ground the follow-up in the candidate's actual plan when they named one
    // (topic-specific probe so the reply visibly depends on what they said).
    const escapedKeyword = (kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (algoKeywords.length > 0 && !hasAsked(interviewContext, new RegExp(escapedKeyword(algoKeywords[0])))) {
      const keyword = algoKeywords[0];
      return {
        type: AI_RESPONSE_TYPES.QUESTION,
        message: keywordFollowUp(keyword, title, fn),
        score: 0,
      };
    }

    // Anti-repetition: escalate through distinct questions instead of looping.
    if (hasAsked(interviewContext, /walk me through|high-level approach|data structure|algorithm/)) {
      // Edge cases already covered too — move to a fresh, concrete angle.
      if (hasAsked(interviewContext, /edge case|empty input|duplicates/)) {
        return {
          type: AI_RESPONSE_TYPES.QUESTION,
          message: `Let's make it concrete: walk through one of the ${title} examples end-to-end with your approach — what does each step compute, and where does the answer come from?`,
          score: 0,
        };
      }
      return {
        type: AI_RESPONSE_TYPES.QUESTION,
        message: `Thanks for the plan. Before you code: what are the trickiest edge cases for ${title}, and what time/space complexity are you targeting so I can sanity-check your approach?`,
        score: 0,
      };
    }

    return {
      type: AI_RESPONSE_TYPES.QUESTION,
      message: `Walk me through your approach for ${title} in more detail. What is the naive solution, which data structures would you use, and what time/space complexity are you targeting before writing code?`,
      score: 0,
    };
  }

  // --- Opening ---
  const lastReply = lastUserMessage(interviewContext);
  const algoKeywords = detectAlgoKeywords(lastReply);
  if (algoKeywords.length > 0) {
    const keyword = algoKeywords[0];
    return {
      type: AI_RESPONSE_TYPES.QUESTION,
      message: `You mentioned ${keyword} — interesting. How would you use that to solve ${title}? Sketch the approach and what complexity you'd expect.`,
      score: 0,
    };
  }
  return {
    type: AI_RESPONSE_TYPES.QUESTION,
    message: `Before writing any code for ${title}, explain your high-level approach: what algorithm and data structures do you plan to use, and what complexity do you expect?`,
    score: 0,
  };
};

const generateMockOpeningQuestion = async ({ interviewContext }) => {
  const title = interviewContext?.title || "Mock Interview";
  return {
    type: AI_RESPONSE_TYPES.QUESTION,
    message: `Welcome to your ${title}. Let's begin: explain the difference between concurrency and parallelism, and when you would choose each approach.`,
    score: 0,
  };
};

const generateMockFinalSummary = async ({ interviewContext }) => {
  const s = signalsOf(interviewContext);
  const title = titleOf(interviewContext);
  const scores = computeSummaryScore(interviewContext);

  const passText =
    s.bestTestPassRate === null || s.submissionsCount === 0
      ? "you never submitted runnable code"
      : `your best submission passed ${s.bestTestPassRate}% of the test cases`;
  const hintText = s.hintsRequested > 0 ? ` You asked for ${s.hintsRequested} hint(s).` : "";
  const dontKnowText =
    (s.dontKnowResponses || 0) > 0
      ? ` You answered "I don't know" ${s.dontKnowResponses} time(s), so no progress was demonstrated on those points.`
      : "";
  const improvementText = s.improvedAcrossSubmissions
    ? " You improved across submissions after feedback — that's the right instinct."
    : "";

  const verdict =
    scores.overall >= 85
      ? "a strong performance"
      : scores.overall >= 70
        ? "a solid performance with room to tighten"
        : scores.overall >= 50
          ? "a developing performance with clear areas to work on"
          : "an interview that needs significant work before you're interview-ready";

  const message = [
    `Interview complete. On ${title}, ${passText}, and you engaged across ${s.userMessageCount || 0} exchange(s).`,
    hintText,
    dontKnowText,
    improvementText,
    ` Overall: ${scores.overall}/100 — ${verdict}.`,
    " Specific feedback below is drawn from what actually happened in this interview.",
  ].join("");

  return {
    type: AI_RESPONSE_TYPES.SUMMARY,
    message,
    score: scores.overall,
    problemSolving: scores.problemSolving,
    codeQuality: scores.codeQuality,
    communication: scores.communication,
    optimization: scores.optimization,
    recommendation: recommendationFromScore(scores.overall),
    strengths: buildStrengthList(interviewContext),
    weaknesses: buildWeaknessList(interviewContext),
    recommendations: buildRecommendationList(interviewContext),
  };
};

module.exports = {
  generateMockInterviewResponse,
  generateMockOpeningQuestion,
  generateMockFinalSummary,
};
