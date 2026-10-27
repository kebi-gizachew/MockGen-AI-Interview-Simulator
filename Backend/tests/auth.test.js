```javascript
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");

const uniqueId = `${Date.now()}-${Math.random()
  .toString(36)
  .slice(2)}`;

const testUser = {
  name: "Auth Test User",
  email: `auth-test-${uniqueId}@example.com`,
  password: "Testpass123!",
};

let token;

before(async () => {
  // Register a user for tests that need an authenticated account.
  const response = await request(app)
    .post("/api/auth/register")
    .send(testUser);

  if (response.status === 201 || response.status === 200) {
    token =
      response.body.data?.token ||
      response.body.token ||
      response.body.data?.accessToken;
  }
});

test("1. Register with valid credentials", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name: "New User",
      email: `new-${uniqueId}@example.com`,
      password: "Testpass123!",
    });

  assert.ok(
    [200, 201].includes(response.status),
    `Expected 200 or 201, received ${response.status}`
  );

  assert.equal(response.body.status, "success");
});

test("2. Registration returns an authentication token", async () => {
  assert.ok(
    token,
    "Registration should return a JWT in the expected response field"
  );
});

test("3. Reject registration without an email", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({ password: "Testpass123!" });

  assert.ok([400, 422].includes(response.status));
});

test("4. Reject registration with an invalid email", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      email: "not-an-email",
      password: "Testpass123!",
    });

  assert.ok([400, 422].includes(response.status));
});

test("5. Reject registration without a password", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({ email: `missing-password-${uniqueId}@example.com` });

  assert.ok([400, 422].includes(response.status));
});

test("6. Reject registration with an empty password", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      email: `empty-password-${uniqueId}@example.com`,
      password: "",
    });

  assert.ok([400, 422].includes(response.status));
});

test("7. Reject a weak password if complexity rules are enforced", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      email: `weak-password-${uniqueId}@example.com`,
      password: "123",
    });

  assert.ok(
    [400, 422].includes(response.status),
    `Expected validation error, received ${response.status}`
  );
});

test("8. Reject registration with a non-string email", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      email: 12345,
      password: "Testpass123!",
    });

  assert.ok([400, 422].includes(response.status));
});

test("9. Reject registration with a non-string password", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      email: `bad-type-${uniqueId}@example.com`,
      password: 12345678,
    });

  assert.ok([400, 422].includes(response.status));
});

test("10. Reject duplicate registration", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send(testUser);

  assert.ok(
    [400, 409, 422].includes(response.status),
    `Expected duplicate-account error, received ${response.status}`
  );
});

test("11. Login with valid credentials", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: testUser.email,
      password: testUser.password,
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "success");

  const loginToken =
    response.body.data?.token ||
    response.body.token ||
    response.body.data?.accessToken;

  assert.ok(loginToken, "Login should return a JWT");
});

test("12. Reject login with an incorrect password", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: testUser.email,
      password: "Wrongpass123!",
    });

  assert.ok([400, 401, 403].includes(response.status));
});

test("13. Reject login for an unknown email", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: `unknown-${uniqueId}@example.com`,
      password: "Testpass123!",
    });

  assert.ok([400, 401, 403, 404].includes(response.status));
});

test("14. Reject login without an email", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ password: "Testpass123!" });

  assert.ok([400, 422].includes(response.status));
});

test("15. Reject login without a password", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email: testUser.email });

  assert.ok([400, 422].includes(response.status));
});

test("16. Reject login with an empty email", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: "",
      password: "Testpass123!",
    });

  assert.ok([400, 422].includes(response.status));
});

test("17. Reject login with an empty password", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: testUser.email,
      password: "",
    });

  assert.ok([400, 422].includes(response.status));
});

test("18. Reject login with an invalid email format", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: "invalid-email",
      password: "Testpass123!",
    });

  assert.ok([400, 401, 422].includes(response.status));
});

test("19. Reject requests to /api/auth/me without a token", async () => {
  const response = await request(app).get("/api/auth/me");

  assert.equal(response.status, 401);
});

test("20. Reject a malformed JWT", async () => {
  const response = await request(app)
    .get("/api/auth/me")
    .set("Authorization", "Bearer invalid.token.value");

  assert.equal(response.status, 401);
});

test("21. Reject a request with an invalid authorization scheme", async () => {
  const response = await request(app)
    .get("/api/auth/me")
    .set("Authorization", "Basic invalid-token");

  assert.equal(response.status, 401);
});

test("22. Accept a valid JWT for /api/auth/me", async () => {
  assert.ok(
    token,
    "A valid registration token is required for this test"
  );

  const response = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "success");
});

test("23. Profile response does not expose a password hash", async () => {
  assert.ok(token, "A valid JWT is required for this test");

  const response = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${token}`);

  if (response.status !== 200) {
    assert.fail(`Profile request failed with ${response.status}`);
  }

  const body = JSON.stringify(response.body).toLowerCase();

  assert.equal(
    body.includes("passwordhash"),
    false,
    "Profile must not expose a password hash"
  );
});

test("24. Reject attempts to set an admin role during registration", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Role Test",
      email: `role-test-${uniqueId}@example.com`,
      password: "Testpass123!",
      role: "admin",
    });

  if ([200, 201].includes(response.status)) {
    const role =
      response.body.data?.user?.role ||
      response.body.data?.role ||
      response.body.user?.role;

    assert.notEqual(
      role,
      "admin",
      "Public registration must not grant administrator privileges"
    );
  } else {
    assert.ok([400, 403, 409, 422].includes(response.status));
  }
});
```
