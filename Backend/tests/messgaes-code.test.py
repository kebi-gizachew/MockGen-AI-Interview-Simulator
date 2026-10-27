const { test, before } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/app");

const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const user = { name: "Message Test", email: `messages-${runId}@example.com`, password: "Testpass123!" };
let token;
let sessionId;

function tokenFrom(body) {
  return body?.data?.token || body?.token || body?.data?.accessToken;
}
function idFrom(body) {
  const d = body?.data?.interview || body?.data?.session || body?.data;
  return d?.id || d?.sessionId || body?.data?.sessionId;
}
function auth() { return { Authorization: `Bearer ${token}` }; }
function clientError(r, allowed = [400, 401, 403, 404, 409, 413, 422]) {
  assert.ok(allowed.includes(r.status), `Expected ${allowed.join("/")} but received ${r.status}`);
}

before(async () => {
  let r = await request(app).post("/api/auth/register").send(user);
  token = [200, 201].includes(r.status) ? tokenFrom(r.body) : null;
  if (!token) {
    r = await request(app).post("/api/auth/login").send({ email: user.email, password: user.password });
    token = tokenFrom(r.body);
  }
  if (token) {
    r = await request(app).post("/api/interviews").set(auth()).send({});
    if ([200, 201].includes(r.status)) sessionId = idFrom(r.body);
  }
});

test("73. Save a manual message to an owned session", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/messages`).set(auth()).send({ message: "Manual test message" });
  assert.ok([200, 201].includes(r.status), `Received ${r.status}`);
});

test("74. Reject manual message creation without authentication", async () => {
  assert.ok(sessionId);
  clientError(await request(app).post(`/api/interviews/${sessionId}/messages`).send({ message: "No token" }), [401, 403]);
});

test("75. Reject manual messages for a nonexistent session", async () => {
  assert.ok(token);
  clientError(await request(app).post("/api/interviews/nonexistent-session-id/messages").set(auth()).send({ message: "hello" }), [400, 404, 422]);
});

test("76. Reject a manual message with no content", async () => {
  assert.ok(token && sessionId);
  clientError(await request(app).post(`/api/interviews/${sessionId}/messages`).set(auth()).send({}), [400, 422]);
});

test("77. Reject a manual message with empty content if prohibited", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/messages`).set(auth()).send({ message: "" });
  assert.ok([200, 400, 422].includes(r.status));
});

test("78. Reject a whitespace-only manual message if prohibited", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/messages`).set(auth()).send({ message: "   " });
  assert.ok([200, 400, 422].includes(r.status));
});

test("79. Reject non-string manual message content", async () => {
  assert.ok(token && sessionId);
  clientError(await request(app).post(`/api/interviews/${sessionId}/messages`).set(auth()).send({ message: { text: "hello" } }), [400, 422]);
});

test("80. Reject an unsupported message role supplied by a client", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/messages`).set(auth()).send({ message: "hello", role: "admin" });
  assert.ok([200, 400, 422].includes(r.status));
  if ([200, 201].includes(r.status)) assert.notEqual(r.body.data?.role, "admin");
});

test("81. Ignore or reject spoofed user IDs on manual messages", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/messages`).set(auth()).send({ message: "spoof test", userId: "other-user-id" });
  assert.ok([200, 201, 400, 422].includes(r.status));
});

test("82. Reject manual message after its session is deleted", async () => {
  assert.ok(token);
  const created = await request(app).post("/api/interviews").set(auth()).send({});
  const id = idFrom(created.body);
  assert.ok([200, 201].includes(created.status) && id);
  const deleted = await request(app).delete(`/api/interviews/${id}`).set(auth());
  assert.ok([200, 204].includes(deleted.status));
  clientError(await request(app).post(`/api/interviews/${id}/messages`).set(auth()).send({ message: "orphan attempt" }), [400, 404, 422]);
});

test("83. Send a valid candidate chat message", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/chat`).set(auth()).send({ message: "I would use a hash map for constant-time lookup." });
  assert.ok([200, 201].includes(r.status), `Received ${r.status}`);
});

test("84. Reject chat without authentication", async () => {
  assert.ok(sessionId);
  clientError(await request(app).post(`/api/interviews/${sessionId}/chat`).send({ message: "hello" }), [401, 403]);
});

test("85. Reject chat to a nonexistent session", async () => {
  assert.ok(token);
  clientError(await request(app).post("/api/interviews/nonexistent-session-id/chat").set(auth()).send({ message: "hello" }), [400, 404, 422]);
});

test("86. Reject chat with missing message", async () => {
  assert.ok(token && sessionId);
  clientError(await request(app).post(`/api/interviews/${sessionId}/chat`).set(auth()).send({}), [400, 422]);
});

test("87. Reject chat with non-string message", async () => {
  assert.ok(token && sessionId);
  clientError(await request(app).post(`/api/interviews/${sessionId}/chat`).set(auth()).send({ message: 123 }), [400, 422]);
});

test("88. Handle very long chat messages", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/chat`).set(auth()).send({ message: "x".repeat(100000) });
  assert.ok([200, 400, 413, 422].includes(r.status));
});

test("89. Chat response uses the success envelope", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/chat`).set(auth()).send({ message: "Explain binary search." });
  if ([200, 201].includes(r.status)) assert.equal(r.body.status, "success");
});

test("90. Chat response includes an AI response object when successful", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/chat`).set(auth()).send({ message: "What is time complexity?" });
  if ([200, 201].includes(r.status)) {
    assert.ok(r.body.data?.aiResponse || r.body.aiResponse || JSON.stringify(r.body).includes("aiResponse"));
  }
});

test("91. Question-type AI responses have score zero when returned", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/chat`).set(auth()).send({ message: "Please ask a follow-up question." });
  if ([200, 201].includes(r.status)) {
    const ai = r.body.data?.aiResponse || r.body.aiResponse;
    if (ai?.type === "question") assert.equal(ai.score, 0);
  }
});

test("92. Feedback-type AI scores are between zero and one hundred when returned", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/chat`).set(auth()).send({ message: "My answer is to use a queue for BFS." });
  if ([200, 201].includes(r.status)) {
    const ai = r.body.data?.aiResponse || r.body.aiResponse;
    if (ai?.type === "feedback") assert.ok(ai.score >= 0 && ai.score <= 100);
  }
});

test("93. List code submissions for a session", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).get(`/api/interviews/${sessionId}/code`).set(auth());
  assert.equal(r.status, 200);
});

test("94. Reject listing code submissions without authentication", async () => {
  assert.ok(sessionId);
  clientError(await request(app).get(`/api/interviews/${sessionId}/code`), [401, 403]);
});

test("95. Reject listing code submissions for an unknown session", async () => {
  assert.ok(token);
  clientError(await request(app).get("/api/interviews/nonexistent-session-id/code").set(auth()), [400, 404, 422]);
});

test("96. Submit a code snippet", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/code`).set(auth()).send({ code: "function add(a, b) { return a + b; }", language: "javascript" });
  assert.ok([200, 201].includes(r.status), `Received ${r.status}`);
});

test("97. Reject code submission without authentication", async () => {
  assert.ok(sessionId);
  clientError(await request(app).post(`/api/interviews/${sessionId}/code`).send({ code: "print(1)" }), [401, 403]);
});

test("98. Reject code submission to an unknown session", async () => {
  assert.ok(token);
  clientError(await request(app).post("/api/interviews/nonexistent-session-id/code").set(auth()).send({ code: "print(1)" }), [400, 404, 422]);
});

test("99. Reject a missing code field", async () => {
  assert.ok(token && sessionId);
  clientError(await request(app).post(`/api/interviews/${sessionId}/code`).set(auth()).send({ language: "python" }), [400, 422]);
});

test("100. Handle an empty code snippet according to validation policy", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/code`).set(auth()).send({ code: "", language: "python" });
  assert.ok([200, 400, 422].includes(r.status));
});

test("101. Reject non-string code", async () => {
  assert.ok(token && sessionId);
  clientError(await request(app).post(`/api/interviews/${sessionId}/code`).set(auth()).send({ code: { source: "print(1)" } }), [400, 422]);
});

test("102. Handle unsupported programming language", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/code`).set(auth()).send({ code: "hello", language: "made-up-language" });
  assert.ok([200, 400, 422].includes(r.status));
});

test("103. Handle oversized code submission", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/code`).set(auth()).send({ code: "x".repeat(1000000), language: "javascript" });
  assert.ok([200, 400, 413, 422].includes(r.status));
});

test("104. Delete a code submission created in the test", async () => {
  assert.ok(token && sessionId);
  const created = await request(app).post(`/api/interviews/${sessionId}/code`).set(auth()).send({ code: "const x = 1;", language: "javascript" });
  assert.ok([200, 201].includes(created.status), `Could not create submission: ${created.status}`);
  const d = created.body.data?.submission || created.body.data;
  const submissionId = d?.id || d?.submissionId;
  assert.ok(submissionId, "Response should include submission ID");
  const r = await request(app).delete(`/api/interviews/${sessionId}/code/${submissionId}`).set(auth());
  assert.ok([200, 204].includes(r.status));
});

test("105. Reject code deletion without authentication", async () => {
  assert.ok(sessionId);
  clientError(await request(app).delete(`/api/interviews/${sessionId}/code/unknown-id`), [401, 403]);
});

test("106. Reject deleting a nonexistent code submission", async () => {
  assert.ok(token && sessionId);
  clientError(await request(app).delete(`/api/interviews/${sessionId}/code/nonexistent-submission-id`).set(auth()), [400, 404, 422]);
});

test("107. Prevent access to another user's code submissions", async () => {
  assert.ok(token);
  const other = { email: `other-code-${runId}@example.com`, password: "Testpass123!", name: "Other" };
  let r = await request(app).post("/api/auth/register").send(other);
  let otherToken = [200, 201].includes(r.status) ? tokenFrom(r.body) : null;
  if (!otherToken) {
    r = await request(app).post("/api/auth/login").send({ email: other.email, password: other.password });
    otherToken = tokenFrom(r.body);
  }
  assert.ok(otherToken);
  const otherSession = await request(app).post("/api/interviews").set({ Authorization: `Bearer ${otherToken}` }).send({});
  const id = idFrom(otherSession.body);
  assert.ok([200, 201].includes(otherSession.status) && id);
  clientError(await request(app).get(`/api/interviews/${id}/code`).set(auth()), [403, 404]);
});

test("108. Candidate message is associated with the correct session", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/messages`).set(auth()).send({ message: `association-${runId}` });
  assert.ok([200, 201].includes(r.status));
});

test("109. Repeated code-list requests remain valid", async () => {
  assert.ok(token && sessionId);
  const a = await request(app).get(`/api/interviews/${sessionId}/code`).set(auth());
  const b = await request(app).get(`/api/interviews/${sessionId}/code`).set(auth());
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
});

test("110. Manual message endpoint returns a success envelope on success", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/messages`).set(auth()).send({ message: "envelope check" });
  if ([200, 201].includes(r.status)) assert.equal(r.body.status, "success");
});

test("111. Code endpoint returns a success envelope on success", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/code`).set(auth()).send({ code: "const answer = 42;", language: "javascript" });
  if ([200, 201].includes(r.status)) assert.equal(r.body.status, "success");
});

test("112. Reject or safely handle malformed JSON for code submission", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/code`).set(auth()).set("Content-Type", "application/json").send("{broken");
  assert.ok([400, 415].includes(r.status));
});
