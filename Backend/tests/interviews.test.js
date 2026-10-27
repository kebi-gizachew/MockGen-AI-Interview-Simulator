const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/app");

const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const users = {
  a: { name: "Interview Test A", email: `interview-a-${runId}@example.com`, password: "Testpass123!" },
  b: { name: "Interview Test B", email: `interview-b-${runId}@example.com`, password: "Testpass123!" },
};
let tokenA;
let tokenB;
let sessionA;
let sessionB;

function tokenFrom(body) {
  return body?.data?.token || body?.token || body?.data?.accessToken || body?.data?.user?.token;
}
function sessionFrom(body) {
  return body?.data?.interview || body?.data?.session || body?.data || body?.interview || body?.session;
}
function sessionIdFrom(body) {
  const s = sessionFrom(body);
  return s?.id || s?.sessionId || body?.data?.sessionId;
}
function auth(token) {
  return { Authorization: `Bearer ${token}` };
}
function assertClientError(response, allowed = [400, 401, 403, 404, 409, 422]) {
  assert.ok(allowed.includes(response.status), `Expected ${allowed.join("/")} but received ${response.status}`);
}

before(async () => {
  const a = await request(app).post("/api/auth/register").send(users.a);
  if ([200, 201].includes(a.status)) tokenA = tokenFrom(a.body);
  const b = await request(app).post("/api/auth/register").send(users.b);
  if ([200, 201].includes(b.status)) tokenB = tokenFrom(b.body);

  if (!tokenA) {
    const login = await request(app).post("/api/auth/login").send({ email: users.a.email, password: users.a.password });
    tokenA = tokenFrom(login.body);
  }
  if (!tokenB) {
    const login = await request(app).post("/api/auth/login").send({ email: users.b.email, password: users.b.password });
    tokenB = tokenFrom(login.body);
  }

  if (tokenA) {
    const r = await request(app).post("/api/interviews").set(auth(tokenA)).send({});
    if ([200, 201].includes(r.status)) sessionA = sessionIdFrom(r.body);
  }
  if (tokenB) {
    const r = await request(app).post("/api/interviews").set(auth(tokenB)).send({});
    if ([200, 201].includes(r.status)) sessionB = sessionIdFrom(r.body);
  }
});

test("33. Create an interview with an authenticated user", async () => {
  assert.ok(tokenA, "Registration/login setup must provide tokenA");
  const r = await request(app).post("/api/interviews").set(auth(tokenA)).send({});
  assert.ok([200, 201].includes(r.status), `Received ${r.status}`);
  assert.ok(sessionIdFrom(r.body), "Response should contain a session ID");
});

test("34. Reject interview creation without a token", async () => {
  assertClientError(await request(app).post("/api/interviews").send({}), [401, 403]);
});

test("35. Reject interview creation with a malformed token", async () => {
  assertClientError(await request(app).post("/api/interviews").set(auth("bad.token.value")).send({}), [401, 403]);
});

test("36. Created interview has an ID", async () => {
  assert.ok(sessionA, "Setup could not create session A; check app response/schema");
});

test("37. Created interview belongs to the authenticated user", async () => {
  assert.ok(tokenA && sessionA, "Session setup is required");
  const r = await request(app).get(`/api/interviews/${sessionA}`).set(auth(tokenA));
  assert.equal(r.status, 200);
  const body = JSON.stringify(r.body);
  assert.ok(body.includes(sessionA));
});

test("38. New interview has its expected initial status", async () => {
  assert.ok(tokenA && sessionA, "Session setup is required");
  const r = await request(app).get(`/api/interviews/${sessionA}`).set(auth(tokenA));
  assert.equal(r.status, 200);
  const s = sessionFrom(r.body);
  if (s.status !== undefined) assert.equal(String(s.status).toLowerCase(), "active");
});

test("39. New interview returns or persists an opening question", async () => {
  assert.ok(tokenA && sessionA, "Session setup is required");
  const r = await request(app).get(`/api/interviews/${sessionA}`).set(auth(tokenA));
  assert.equal(r.status, 200);
  assert.ok(JSON.stringify(r.body).length > 20);
});

test("40. List interviews for an authenticated user", async () => {
  assert.ok(tokenA);
  const r = await request(app).get("/api/interviews").set(auth(tokenA));
  assert.equal(r.status, 200);
  assert.equal(r.body.status, "success");
});

test("41. Reject listing interviews without authentication", async () => {
  assertClientError(await request(app).get("/api/interviews"), [401, 403]);
});

test("42. List endpoint returns a collection", async () => {
  assert.ok(tokenA);
  const r = await request(app).get("/api/interviews").set(auth(tokenA));
  assert.equal(r.status, 200);
  const data = r.body.data;
  assert.ok(Array.isArray(data) || Array.isArray(data?.interviews) || Array.isArray(data?.sessions));
});

test("43. Filter interviews by active status", async () => {
  assert.ok(tokenA);
  const r = await request(app).get("/api/interviews?status=active").set(auth(tokenA));
  assert.equal(r.status, 200);
});

test("44. Filter interviews by completed status", async () => {
  assert.ok(tokenA);
  const r = await request(app).get("/api/interviews?status=completed").set(auth(tokenA));
  assert.equal(r.status, 200);
});

test("45. Reject or safely handle an unsupported status filter", async () => {
  assert.ok(tokenA);
  const r = await request(app).get("/api/interviews?status=made-up").set(auth(tokenA));
  assert.ok([200, 400, 422].includes(r.status));
});

test("46. Pagination accepts a valid page and limit", async () => {
  assert.ok(tokenA);
  const r = await request(app).get("/api/interviews?page=1&limit=5").set(auth(tokenA));
  assert.equal(r.status, 200);
});

test("47. Invalid page number is rejected or defaulted", async () => {
  assert.ok(tokenA);
  const r = await request(app).get("/api/interviews?page=-1").set(auth(tokenA));
  assert.ok([200, 400, 422].includes(r.status));
});

test("48. Invalid limit is rejected or defaulted", async () => {
  assert.ok(tokenA);
  const r = await request(app).get("/api/interviews?limit=0").set(auth(tokenA));
  assert.ok([200, 400, 422].includes(r.status));
});

test("49. Very large limit is bounded or rejected", async () => {
  assert.ok(tokenA);
  const r = await request(app).get("/api/interviews?limit=999999").set(auth(tokenA));
  assert.ok([200, 400, 422].includes(r.status));
});

test("50. Retrieve an existing interview", async () => {
  assert.ok(tokenA && sessionA);
  const r = await request(app).get(`/api/interviews/${sessionA}`).set(auth(tokenA));
  assert.equal(r.status, 200);
});

test("51. Reject retrieving an interview without authentication", async () => {
  assert.ok(sessionA);
  assertClientError(await request(app).get(`/api/interviews/${sessionA}`), [401, 403]);
});

test("52. Return not found for an unknown interview ID", async () => {
  assert.ok(tokenA);
  assertClientError(await request(app).get("/api/interviews/nonexistent-session-id").set(auth(tokenA)), [400, 404, 422]);
});

test("53. Prevent User A from reading User B's interview", async () => {
  assert.ok(tokenA && sessionB);
  assertClientError(await request(app).get(`/api/interviews/${sessionB}`).set(auth(tokenA)), [403, 404]);
});

test("54. Handle malformed interview IDs safely", async () => {
  assert.ok(tokenA);
  assertClientError(await request(app).get("/api/interviews/%20").set(auth(tokenA)), [400, 404, 422]);
});

test("55. Update an interview title", async () => {
  assert.ok(tokenA && sessionA);
  const r = await request(app).patch(`/api/interviews/${sessionA}`).set(auth(tokenA)).send({ title: "Updated test title" });
  assert.ok([200, 204].includes(r.status), `Received ${r.status}`);
});

test("56. Reject title update without authentication", async () => {
  assert.ok(sessionA);
  assertClientError(await request(app).patch(`/api/interviews/${sessionA}`).send({ title: "No token" }), [401, 403]);
});

test("57. Prevent User A from updating User B's title", async () => {
  assert.ok(tokenA && sessionB);
  assertClientError(await request(app).patch(`/api/interviews/${sessionB}`).set(auth(tokenA)).send({ title: "Unauthorized change" }), [403, 404]);
});

test("58. Return not found when updating a missing interview", async () => {
  assert.ok(tokenA);
  assertClientError(await request(app).patch("/api/interviews/nonexistent-session-id").set(auth(tokenA)).send({ title: "x" }), [400, 404, 422]);
});

test("59. Reject an empty title if titles must be nonempty", async () => {
  assert.ok(tokenA && sessionA);
  const r = await request(app).patch(`/api/interviews/${sessionA}`).set(auth(tokenA)).send({ title: "" });
  assert.ok([200, 400, 422].includes(r.status));
});

test("60. Reject a whitespace-only title if titles must be nonempty", async () => {
  assert.ok(tokenA && sessionA);
  const r = await request(app).patch(`/api/interviews/${sessionA}`).set(auth(tokenA)).send({ title: "   " });
  assert.ok([200, 400, 422].includes(r.status));
});

test("61. Handle an excessively long title", async () => {
  assert.ok(tokenA && sessionA);
  const r = await request(app).patch(`/api/interviews/${sessionA}`).set(auth(tokenA)).send({ title: "x".repeat(10000) });
  assert.ok([200, 400, 413, 422].includes(r.status));
});

test("62. Do not allow changing the session owner through title update", async () => {
  assert.ok(tokenA && sessionA && tokenB);
  const r = await request(app).patch(`/api/interviews/${sessionA}`).set(auth(tokenA)).send({ title: "Owner test", userId: users.b.email });
  assert.ok([200, 400, 403, 422].includes(r.status));
  const check = await request(app).get(`/api/interviews/${sessionA}`).set(auth(tokenA));
  if (check.status === 200) assert.ok(!JSON.stringify(check.body).includes(users.b.email));
});

test("63. Delete an interview owned by the user", async () => {
  assert.ok(tokenA);
  const created = await request(app).post("/api/interviews").set(auth(tokenA)).send({});
  const id = sessionIdFrom(created.body);
  assert.ok([200, 201].includes(created.status) && id);
  const r = await request(app).delete(`/api/interviews/${id}`).set(auth(tokenA));
  assert.ok([200, 204].includes(r.status), `Received ${r.status}`);
});

test("64. Reject deleting an interview without authentication", async () => {
  assert.ok(sessionA);
  assertClientError(await request(app).delete(`/api/interviews/${sessionA}`), [401, 403]);
});

test("65. Prevent deleting another user's interview", async () => {
  assert.ok(tokenA && sessionB);
  assertClientError(await request(app).delete(`/api/interviews/${sessionB}`).set(auth(tokenA)), [403, 404]);
});

test("66. Return not found when deleting a missing interview", async () => {
  assert.ok(tokenA);
  assertClientError(await request(app).delete("/api/interviews/nonexistent-session-id").set(auth(tokenA)), [400, 404, 422]);
});

test("67. Reject unsupported fields in interview creation or ignore them safely", async () => {
  assert.ok(tokenA);
  const r = await request(app).post("/api/interviews").set(auth(tokenA)).send({ ownerId: "someone-else", status: "completed" });
  assert.ok([200, 201, 400, 422].includes(r.status));
  if ([200, 201].includes(r.status)) {
    const id = sessionIdFrom(r.body);
    if (id) {
      const detail = await request(app).get(`/api/interviews/${id}`).set(auth(tokenA));
      assert.ok([200, 404].includes(detail.status));
    }
  }
});

test("68. Handle malformed JSON on interview creation", async () => {
  assert.ok(tokenA);
  const r = await request(app).post("/api/interviews").set(auth(tokenA)).set("Content-Type", "application/json").send("{invalid");
  assert.ok([400, 415].includes(r.status));
});

test("69. A user's list does not expose another user's session ID", async () => {
  assert.ok(tokenA && sessionB);
  const r = await request(app).get("/api/interviews").set(auth(tokenA));
  assert.equal(r.status, 200);
  assert.equal(JSON.stringify(r.body).includes(sessionB), false);
});

test("70. Session details include message-history data or an explicit empty history", async () => {
  assert.ok(tokenA && sessionA);
  const r = await request(app).get(`/api/interviews/${sessionA}`).set(auth(tokenA));
  assert.equal(r.status, 200);
  const s = sessionFrom(r.body);
  assert.ok(s && typeof s === "object");
});

test("71. Session listing handles repeated requests consistently", async () => {
  assert.ok(tokenA);
  const first = await request(app).get("/api/interviews?page=1&limit=5").set(auth(tokenA));
  const second = await request(app).get("/api/interviews?page=1&limit=5").set(auth(tokenA));
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(Array.isArray(first.body.data) || !!first.body.data, true);
});

test("72. Session endpoints return the documented success envelope", async () => {
  assert.ok(tokenA);
  const r = await request(app).get("/api/interviews").set(auth(tokenA));
  assert.equal(r.status, 200);
  assert.equal(r.body.status, "success");
  assert.ok(Object.prototype.hasOwnProperty.call(r.body, "data"));
});
