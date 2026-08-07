const {
  generateMockFinalSummary,
  generateMockInterviewResponse,
} = require("../src/services/ai/providers/mock.provider");

const baseCtx = {
  title: "Test Interview",
  question: {
    title: "Two Sum",
    topic: "Arrays & Hashing",
    functionName: "twoSum",
  },
  codeSubmissions: [],
  history: [],
};

const ctx = (signals, subs = [], history = []) => ({
  ...baseCtx,
  performanceSignals: { submissionsCount: subs.length, ...signals },
  codeSubmissions: subs,
  history,
});

(async () => {
  let failures = 0;
  const check = (label, cond) => {
    console.log((cond ? "PASS" : "FAIL") + "  " + label);
    if (!cond) failures += 1;
  };

  const excellent = ctx(
    {
      bestTestPassRate: 100, firstPassRate: 60, lastPassRate: 100,
      improvedAcrossSubmissions: true, hintsRequested: 0, dontKnowResponses: 0,
      approachDiscussed: true, complexityStated: true, edgeCasesDiscussed: true,
      userMessageCount: 8, avgUserMessageLength: 120,
    },
    [{ passedTests: 5, totalTests: 5, language: "python" }]
  );
  const failing = ctx(
    {
      bestTestPassRate: 20, firstPassRate: 20, lastPassRate: 20,
      improvedAcrossSubmissions: false, hintsRequested: 2, dontKnowResponses: 0,
      approachDiscussed: false, complexityStated: false, edgeCasesDiscussed: false,
      userMessageCount: 3, avgUserMessageLength: 20,
    },
    [{ passedTests: 1, totalTests: 5, language: "javascript" }]
  );
  const noSubmission = ctx(
    {
      bestTestPassRate: null, firstPassRate: null, lastPassRate: null,
      improvedAcrossSubmissions: false, hintsRequested: 3, dontKnowResponses: 0,
      approachDiscussed: false, complexityStated: false, edgeCasesDiscussed: false,
      userMessageCount: 4, avgUserMessageLength: 30,
    }
  );
  // ZERO-BASED cases: nothing done, and repeated "I don't know".
  const didNothing = ctx({
    bestTestPassRate: null, firstPassRate: null, lastPassRate: null,
    improvedAcrossSubmissions: false, hintsRequested: 0, dontKnowResponses: 0,
    approachDiscussed: false, complexityStated: false, edgeCasesDiscussed: false,
    userMessageCount: 0, avgUserMessageLength: 0,
  });
  const dontKnow = ctx({
    bestTestPassRate: null, firstPassRate: null, lastPassRate: null,
    improvedAcrossSubmissions: false, hintsRequested: 0, dontKnowResponses: 3,
    approachDiscussed: false, complexityStated: false, edgeCasesDiscussed: false,
    userMessageCount: 3, avgUserMessageLength: 12,
  });

  const a = await generateMockFinalSummary({ interviewContext: excellent });
  const b = await generateMockFinalSummary({ interviewContext: failing });
  const c = await generateMockFinalSummary({ interviewContext: noSubmission });
  const d = await generateMockFinalSummary({ interviewContext: didNothing });
  const e = await generateMockFinalSummary({ interviewContext: dontKnow });

  console.log(`EXCELLENT  -> score=${a.score}  (ps=${a.problemSolving} cq=${a.codeQuality} comm=${a.communication} opt=${a.optimization})`);
  console.log(`FAILING    -> score=${b.score}  (ps=${b.problemSolving} cq=${b.codeQuality} comm=${b.communication} opt=${b.optimization})`);
  console.log(`NO SUBMIT  -> score=${c.score}  (ps=${c.problemSolving} cq=${c.codeQuality} comm=${c.communication} opt=${c.optimization})`);
  console.log(`DID NOTHING-> score=${d.score}  (ps=${d.problemSolving} cq=${d.codeQuality} comm=${d.communication} opt=${d.optimization})`);
  console.log(`DONT KNOW  -> score=${e.score}  (ps=${e.problemSolving} cq=${e.codeQuality} comm=${e.communication} opt=${e.optimization})`);

  check("did-nothing scores exactly 0", d.score === 0);
  check("did-nothing invents NO strengths", d.strengths.length === 0);
  check("repeated 'I don't know' scores 0-5", e.score >= 0 && e.score <= 5);
  check("'I don't know' called out in weaknesses", e.weaknesses.some((w) => w.toLowerCase().includes("don't know")));
  // Zero-based: 3 different zero-progress scenarios can legitimately share 0.
  check("scores distinct", new Set([a.score, b.score, c.score, d.score, e.score]).size >= 3);
  check("excellent > failing", a.score > b.score);
  check("failing > no-submit", b.score > c.score);
  check("excellent earns real strengths", a.strengths.length >= 2);
  console.log("strengths sample:", JSON.stringify(a.strengths.slice(0, 2)));
  console.log("weaknesses sample:", JSON.stringify(c.weaknesses.slice(0, 2)));

  // Stage-aware conversation checks
  const approach = await generateMockInterviewResponse({
    userMessage: "I'd use a hash map to track seen values",
    interviewContext: ctx({ ...{}, userMessageCount: 1 }, [], [{ role: "user", content: "hi" }]),
  });
  const postFailing = await generateMockInterviewResponse({
    userMessage: "let me check the tests",
    interviewContext: ctx(
      { bestTestPassRate: 60, submissionsCount: 1, userMessageCount: 2 },
      [{ passedTests: 3, totalTests: 5, language: "python" }]
    ),
  });
  const postPassing = await generateMockInterviewResponse({
    userMessage: "what do you think?",
    interviewContext: ctx(
      { bestTestPassRate: 100, submissionsCount: 1, userMessageCount: 2 },
      [{ passedTests: 5, totalTests: 5, language: "python" }]
    ),
  });
  const hint = await generateMockInterviewResponse({
    userMessage: "can I get a hint?",
    interviewContext: ctx({ hintsRequested: 0, submissionsCount: 0 }),
  });
  console.log("\nSTAGE approach   :", approach.message.slice(0, 110));
  console.log("STAGE failing    :", postFailing.message.slice(0, 110));
  console.log("STAGE passing    :", postPassing.message.slice(0, 110));
  console.log("STAGE hint       :", hint.message.slice(0, 110));

  // "I don't know" must be met with guidance, never praise.
  const dontKnowReply = await generateMockInterviewResponse({
    userMessage: "I don't know",
    interviewContext: ctx(
      { dontKnowResponses: 1, submissionsCount: 0, userMessageCount: 1 },
      [],
      [{ role: "user", content: "I don't know" }]
    ),
  });
  console.log("\nSTAGE dont-know :", dontKnowReply.message.slice(0, 130));
  check("'I don't know' reply is guidance, not praise",
    /appreciate your honesty|work through|brute-force|step by step|what part/i.test(dontKnowReply.message));

  // Response-driven: an off-topic reply to a focused question must be
  // re-challenged on the SAME topic, never treated as an answer.
  const offTopic = await generateMockInterviewResponse({
    userMessage: "I like arrays",
    interviewContext: {
      ...baseCtx,
      performanceSignals: { submissionsCount: 0, userMessageCount: 2 },
      codeSubmissions: [],
      askedQuestions: ["Why did you choose a hash map for Two Sum?"],
      history: [
        { role: "assistant", content: "Why did you choose a hash map for Two Sum?" },
        { role: "user", content: "I like arrays" },
      ],
    },
  });
  console.log("\nSTAGE off-topic :", offTopic.message.slice(0, 150));
  check("off-topic reply is re-challenged on the same topic",
    /before we go there|asked about hash map|mentioned arrays/i.test(offTopic.message));

  const onTopic = await generateMockInterviewResponse({
    userMessage: "because hash map gives O(1) lookups",
    interviewContext: {
      ...baseCtx,
      performanceSignals: { submissionsCount: 0, userMessageCount: 3 },
      codeSubmissions: [],
      askedQuestions: ["Why did you choose a hash map for Two Sum?"],
      history: [
        { role: "assistant", content: "Why did you choose a hash map for Two Sum?" },
        { role: "user", content: "because hash map gives O(1) lookups" },
      ],
    },
  });
  console.log("STAGE on-topic  :", onTopic.message.slice(0, 150));
  check("on-topic reply is NOT challenged",
    !/before we go there|didn'?t answer/i.test(onTopic.message));

  // Regression: a correct answer that doesn't reuse the question's exact
  // vocabulary (meta-topic: complexity) must NOT be challenged either.
  const metaAnswer = await generateMockInterviewResponse({
    userMessage: "because of constant-time lookups",
    interviewContext: {
      ...baseCtx,
      performanceSignals: { submissionsCount: 0, userMessageCount: 3 },
      codeSubmissions: [],
      askedQuestions: ["Why did you choose a hash map for Two Sum?"],
      history: [
        { role: "assistant", content: "Why did you choose a hash map for Two Sum?" },
        { role: "user", content: "because of constant-time lookups" },
      ],
    },
  });
  console.log("STAGE meta-answer:", metaAnswer.message.slice(0, 150));
  check("correct answer in different words is NOT challenged",
    !/before we go there|didn'?t answer/i.test(metaAnswer.message));

  console.log(failures === 0 ? "\nALL SCORING CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})();
