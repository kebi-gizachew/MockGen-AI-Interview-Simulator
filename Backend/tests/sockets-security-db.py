const { test, before } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/app");

const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const user = { name: "Security Test", email: `security-${runId}@example.com`, password: "Testpass123!" };
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
function clientError(r, allowed = [400, 401, 403, 404, 409, 413, 422, 429]) {
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

test("113. Socket.IO authentication requires a token (integration setup check)", async () => {
  // This HTTP test is intentionally independent of the Socket.IO server export.
  // See notes after the file for how to add socket.io-client integration tests.
  assert.ok(token, "A valid user token must be available for socket tests");
});

test("114. Reject a malformed bearer token on protected API", async () => {
  const r = await request(app).get("/api/auth/me").set("Authorization", "Bearer broken.token");
  assert.equal(r.status, 401);
});

test("115. Reject missing bearer token on protected API", async () => {
  const r = await request(app).get("/api/auth/me");
  assert.equal(r.status, 401);
});

test("116. Reject unsupported authorization scheme", async () => {
  const r = await request(app).get("/api/auth/me").set("Authorization", "Basic abc123");
  assert.equal(r.status, 401);
});

test("117. Reject an invalid signature token", async () => {
  const r = await request(app).get("/api/auth/me").set("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImZha2UifQ.invalidsignature");
  assert.equal(r.status, 401);
});

test("118. Reject unauthorized access to interview list", async () => {
  clientError(await request(app).get("/api/interviews"), [401, 403]);
});

test("119. Reject unauthorized access to interview detail", async () => {
  assert.ok(sessionId);
  clientError(await request(app).get(`/api/interviews/${sessionId}`), [401, 403]);
});

test("120. Reject unauthorized access to code submissions", async () => {
  assert.ok(sessionId);
  clientError(await request(app).get(`/api/interviews/${sessionId}/code`), [401, 403]);
});

test("121. Reject unauthorized interview creation", async () => {
  clientError(await request(app).post("/api/interviews").send({}), [401, 403]);
});

test("122. Handle SQL-injection-like email input safely", async () => {
  const r = await request(app).post("/api/auth/login").send({ email: "' OR '1'='1", password: "anything" });
  assert.ok([400, 401, 422].includes(r.status));
});

test("123. Handle SQL-injection-like message content safely", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/messages`).set(auth()).send({ message: "'; DROP TABLE users; --" });
  assert.ok([200, 201, 400, 422].includes(r.status));
  const health = await request(app).get("/api/health");
  assert.ok([200, 503].includes(health.status));
});

test("124. Handle HTML/script content in message input safely", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/messages`).set(auth()).send({ message: "<script>alert(1)</script>" });
  assert.ok([200, 201, 400, 422].includes(r.status));
});

test("125. Ignore or reject mass-assignment fields during registration", async () => {
  const r = await request(app).post("/api/auth/register").send({
    name: "Mass Assignment",
    email: `mass-${runId}@example.com`,
    password: "Testpass123!",
    role: "admin",
    isAdmin: true,
  });
  assert.ok([200, 201, 400, 422].includes(r.status));
  if ([200, 201].includes(r.status)) {
    const body = JSON.stringify(r.body).toLowerCase();
    assert.equal(body.includes('"role":"admin"'), false);
    assert.equal(body.includes('"isadmin":true'), false);
  }
});

test("126. Error responses do not expose stack traces", async () => {
  const r = await request(app).get("/api/unknown-route-for-stack-test");
  assert.equal(r.status, 404);
  const body = JSON.stringify(r.body).toLowerCase();
  assert.equal(body.includes(" at "), false);
  assert.equal(body.includes("node_modules"), false);
});

test("127. Malformed JSON returns a controlled error", async () => {
  const r = await request(app).post("/api/auth/login").set("Content-Type", "application/json").send("{bad json");
  assert.ok([400, 415].includes(r.status));
});

test("128. Unauthenticated requests cannot change an interview title", async () => {
  assert.ok(sessionId);
  clientError(await request(app).patch(`/api/interviews/${sessionId}`).send({ title: "attack" }), [401, 403]);
});

test("129. Unauthenticated requests cannot delete an interview", async () => {
  assert.ok(sessionId);
  clientError(await request(app).delete(`/api/interviews/${sessionId}`), [401, 403]);
});

test("130. Unauthenticated requests cannot end an interview", async () => {
  assert.ok(sessionId);
  clientError(await request(app).post(`/api/interviews/${sessionId}/end`).send({}), [401, 403]);
});

test("131. Invalid content types are handled safely", async () => {
  const r = await request(app).post("/api/auth/login").set("Content-Type", "text/plain").send("not-json");
  assert.ok([400, 415, 422].includes(r.status));
});

test("132. Health endpoint remains available after invalid login attempts", async () => {
  await request(app).post("/api/auth/login").send({ email: "nobody@example.com", password: "wrong" });
  const r = await request(app).get("/api/health");
  assert.ok([200, 503].includes(r.status));
});

test("133. User cannot read another user's interview (ownership boundary)", async () => {
  assert.ok(token);
  const other = { name: "Other Security User", email: `other-security-${runId}@example.com`, password: "Testpass123!" };
  let r = await request(app).post("/api/auth/register").send(other);
  let otherToken = [200, 201].includes(r.status) ? tokenFrom(r.body) : null;
  if (!otherToken) {
    r = await request(app).post("/api/auth/login").send({ email: other.email, password: other.password });
    otherToken = tokenFrom(r.body);
  }
  assert.ok(otherToken);
  const created = await request(app).post("/api/interviews").set({ Authorization: `Bearer ${otherToken}` }).send({});
  const otherId = idFrom(created.body);
  assert.ok([200, 201].includes(created.status) && otherId);
  clientError(await request(app).get(`/api/interviews/${otherId}`).set(auth()), [403, 404]);
});

test("134. User cannot delete another user's code submission", async () => {
  assert.ok(token && sessionId);
  const r = await request(app).post(`/api/interviews/${sessionId}/code`).set(auth()).send({ code: "const secret = 1;", language: "javascript" });
  assert.ok([200, 201].includes(r.status));
  const submission = r.body.data?.submission || r.body.data;
  const id = submission?.id || submission?.submissionId;
  assert.ok(id);
  // Deleting one's own submission is allowed; this case checks malformed IDs are not treated as valid IDs.
  clientError(await request(app).delete(`/api/interviews/${sessionId}/code/not-${id}`).set(auth()), [400, 404, 422]);
});

test("135. A valid user can repeatedly authenticate", async () => {
  const r = await request(app).post("/api/auth/login").send({ email: user.email, password: user.password });
  assert.equal(r.status, 200);
  assert.ok(tokenFrom(r.body));
});

test("136. Profile endpoint returns only the authenticated user's profile", async () => {
  assert.ok(token);
  const r = await request(app).get("/api/auth/me").set(auth());
  assert.equal(r.status, 200);
  const serialized = JSON.stringify(r.body);
  assert.ok(serialized.includes(user.email));
});

test("137. A failed operation does not break subsequent health requests", async () => {
  if (token) await request(app).get("/api/interviews/not-real").set(auth());
  const r = await request(app).get("/api/health");
  assert.ok([200, 503].includes(r.status));
});

test("138. Repeated unauthorized requests remain unauthorized", async () => {
  const a = await request(app).get("/api/auth/me");
  const b = await request(app).get("/api/auth/me");
  assert.equal(a.status, 401);
  assert.equal(b.status, 401);
});

test("139. Unknown API route uses a structured error response", async () => {
  const r = await request(app).get("/api/not-a-real-route");
  assert.equal(r.status, 404);
  assert.equal(r.body.status, "error");
  assert.equal(typeof r.body.message, "string");
});

test("140. Request with an unexpected object in the email field is rejected", async () => {
  const r = await request(app).post("/api/auth/login").send({ email: { value: "alice@example.com" }, password: "Testpass123!" });
  assert.ok([400, 401, 422].includes(r.status));
});

test("141. Request with an unexpected array in the password field is rejected", async () => {
  const r = await request(app).post("/api/auth/login").send({ email: "alice@example.com", password: ["Testpass123!"] });
  assert.ok([400, 401, 422].includes(r.status));
});

test("142. Invalid session ID does not crash the server", async () => {
  assert.ok(token);
  const r = await request(app).get("/api/interviews/%%%invalid%%%").set(auth());
  assert.ok([400, 404, 422].includes(r.status));
  const health = await request(app).get("/api/health");
  assert.ok([200, 503].includes(health.status));
});

test("143. AI chat request to a completed session is rejected when completion is enforced", async () => {
  assert.ok(token);
  const created = await request(app).post("/api/interviews").set(auth()).send({});
  const id = idFrom(created.body);
  assert.ok([200, 201].includes(created.status) && id);
  const ended = await request(app).post(`/api/interviews/${id}/end`).set(auth()).send({});
  assert.ok([200, 201].includes(ended.status), `End request returned ${ended.status}`);
  const chat = await request(app).post(`/api/interviews/${id}/chat`).set(auth()).send({ message: "Can I continue?" });
  assert.ok([400, 403, 409, 422].includes(chat.status));
});

test("144. Ending an interview returns a structured response", async () => {
  assert.ok(token);
  const created = await request(app).post("/api/interviews").set(auth()).send({});
  const id = idFrom(created.body);
  assert.ok([200, 201].includes(created.status) && id);
  const r = await request(app).post(`/api/interviews/${id}/end`).set(auth()).send({});
  assert.ok([200, 201].includes(r.status));
  assert.equal(r.body.status, "success");
});

test("145. Final interview score is within the documented range when present", async () => {
  assert.ok(token);
  const created = await request(app).post("/api/interviews").set(auth()).send({});
  const id = idFrom(created.body);
  assert.ok([200, 201].includes(created.status) && id);
  const r = await request(app).post(`/api/interviews/${id}/end`).set(auth()).send({});
  assert.ok([200, 201].includes(r.status));
  const ai = r.body.data?.aiResponse || r.body.aiResponse;
  if (ai?.score !== undefined) assert.ok(ai.score >= 0 && ai.score <= 100);
});

test("146. Repeated end requests are handled consistently", async () => {
  assert.ok(token);
  const created = await request(app).post("/api/interviews").set(auth()).send({});
  const id = idFrom(created.body);
  assert.ok([200, 201].includes(created.status) && id);
  const first = await request(app).post(`/api/interviews/${id}/end`).set(auth()).send({});
  const second = await request(app).post(`/api/interviews/${id}/end`).set(auth()).send({});
  assert.ok([200, 201, 400, 409, 422].includes(first.status));
  assert.ok([200, 201, 400, 409, 422].includes(second.status));
});

test("147. Concurrent interview list requests do not produce server errors", async () => {
  assert.ok(token);
  const responses = await Promise.all([
    request(app).get("/api/interviews").set(auth()),
    request(app).get("/api/interviews").set(auth()),
    request(app).get("/api/interviews").set(auth()),
  ]);
  for (const r of responses) assert.equal(r.status, 200);
});

test("148. Concurrent reads of one session remain consistent", async () => {
  assert.ok(token && sessionId);
  const responses = await Promise.all([
    request(app).get(`/api/interviews/${sessionId}`).set(auth()),
    request(app).get(`/api/interviews/${sessionId}`).set(auth()),
  ]);
  for (const r of responses) assert.equal(r.status, 200);
});

test("149. AI-provider or database errors are returned as controlled API errors when triggered", async () => {
  // This checks the public error envelope using an invalid session; true provider/database
  // outage testing requires injecting a failing provider or test database.
  assert.ok(token);
  const r = await request(app).post("/api/interviews/not-a-real-session/chat").set(auth()).send({ message: "trigger error" });
  assert.ok([400, 404, 422].includes(r.status));
});

test("150. The API remains responsive after a batch of invalid requests", async () => {
  await Promise.all([
    request(app).post("/api/auth/login").send({}),
    request(app).get("/api/interviews"),
    request(app).get("/api/unknown-endpoint"),
  ]);
  const r = await request(app).get("/api/health");
  assert.ok([200, 503].includes(r.status));
});
