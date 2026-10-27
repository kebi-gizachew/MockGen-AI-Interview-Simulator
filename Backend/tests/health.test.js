const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");

// Test 1: Health endpoint responds successfully
test("GET /api/health returns HTTP 200", async () => {
  const response = await request(app).get("/api/health");

  assert.equal(response.status, 200);
});

// Test 2: Health endpoint does not require authentication
test("GET /api/health works without an authorization token", async () => {
  const response = await request(app).get("/api/health");

  assert.notEqual(response.status, 401);
  assert.notEqual(response.status, 403);
});

// Test 3: Health endpoint returns JSON
test("GET /api/health returns a JSON response", async () => {
  const response = await request(app).get("/api/health");

  assert.match(
    response.headers["content-type"] || "",
    /application\/json/
  );

  assert.equal(typeof response.body, "object");
  assert.notEqual(response.body, null);
});

// Test 4: Health endpoint follows the documented response format
test("GET /api/health returns a success response", async () => {
  const response = await request(app).get("/api/health");

  assert.equal(response.body.status, "success");
  assert.ok(
    Object.prototype.hasOwnProperty.call(response.body, "data"),
    "Response should contain a data property"
  );
});

// Test 5: Unknown routes return HTTP 404
test("GET /api/route-that-does-not-exist returns HTTP 404", async () => {
  const response = await request(app).get(
    "/api/route-that-does-not-exist"
  );

  assert.equal(response.status, 404);
});

// Test 6: Unknown routes use the documented error format
test("Unknown routes return a structured error response", async () => {
  const response = await request(app).get(
    "/api/route-that-does-not-exist"
  );

  assert.equal(response.status, 404);
  assert.equal(response.body.status, "error");
  assert.equal(typeof response.body.message, "string");
  assert.ok(response.body.message.length > 0);
});

// Test 7: Unsupported methods do not succeed on the health endpoint
test("POST /api/health does not return HTTP 200", async () => {
  const response = await request(app)
    .post("/api/health")
    .send({ unexpected: true });

  assert.notEqual(response.status, 200);
});

// Test 8: Health endpoint remains available across repeated requests
test("GET /api/health handles repeated requests", async () => {
  for (let i = 0; i < 3; i++) {
    const response = await request(app).get("/api/health");

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "success");
  }
});
