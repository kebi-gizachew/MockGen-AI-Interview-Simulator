/**
 * Lightweight integration test for backend review.
 * Run: node scripts/review-test.js
 */
const http = require("http");
const app = require("../src/app");
const prisma = require("../src/config/db");

const BASE = "/api";
let passed = 0;
let failed = 0;
let token = "";
let sessionId = "";

const assert = (label, condition, detail = "") => {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
  }
};

const request = (method, path, { body, auth } = {}) =>
  new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        method,
        hostname: "127.0.0.1",
        port: 0,
        path,
        headers: {
          "Content-Type": "application/json",
          ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let json;
          try {
            json = data ? JSON.parse(data) : null;
          } catch {
            json = data;
          }
          resolve({ status: res.statusCode, body: json });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });

const runWithServer = async (fn) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const api = (method, path, opts) => request(method, path, opts).then((r) => {
    // rewrite - actually we need to fix port
    return null;
  });

  const boundRequest = (method, path, opts = {}) =>
    request(method, `http://127.0.0.1:${port}${path}`.replace(/http:\/\/127\.0\.0\.1:\d+/, "") || path, opts).catch(() => null);

  // Simpler: patch request to use port
  const req = async (method, path, opts = {}) => {
    const payload = opts.body ? JSON.stringify(opts.body) : null;
    return new Promise((resolve, reject) => {
      const r = http.request(
        {
          method,
          hostname: "127.0.0.1",
          port,
          path,
          headers: {
            "Content-Type": "application/json",
            ...(opts.auth ? { Authorization: `Bearer ${opts.auth}` } : {}),
            ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () => {
            let json;
            try { json = data ? JSON.parse(data) : null; } catch { json = data; }
            resolve({ status: res.statusCode, body: json });
          });
        }
      );
      r.on("error", reject);
      if (payload) r.write(payload);
      r.end();
    });
  };

  try {
    await fn(req);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
};

const main = async () => {
  console.log("\n=== Backend Review Tests ===\n");

  // DB connectivity
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database: connected\n");
  } catch (err) {
    console.error("Database unreachable — skipping E2E tests:", err.message);
    console.log("\nStatic checks only.\n");
    await runStaticChecks();
    process.exit(failed > 0 ? 1 : 0);
  }

  await runWithServer(async (req) => {
    const email = `test-${Date.now()}@example.com`;
    const password = "testpass123";

    // 404
    const notFound = await req("GET", `${BASE}/nonexistent`);
    assert("404 for unknown route", notFound.status === 404);
    assert("404 response shape", notFound.body?.status === "error");

    // Auth - register
    const reg = await req("POST", `${BASE}/auth/register`, {
      body: { email, password, name: "Test User" },
    });
    assert("Register returns 201", reg.status === 201);
    assert("Register response shape", reg.body?.status === "success");
    assert("Register returns token", !!reg.body?.data?.token);
    assert("Register returns user", !!reg.body?.data?.user?.id);
    token = reg.body?.data?.token || "";

    // Auth - duplicate
    const dup = await req("POST", `${BASE}/auth/register`, {
      body: { email, password },
    });
    assert("Duplicate register returns 409", dup.status === 409);

    // Auth - login
    const login = await req("POST", `${BASE}/auth/login`, {
      body: { email, password },
    });
    assert("Login returns 200", login.status === 200);
    assert("Login returns token", !!login.body?.data?.token);
    token = login.body?.data?.token || token;

    // Auth - bad login
    const badLogin = await req("POST", `${BASE}/auth/login`, {
      body: { email, password: "wrong" },
    });
    assert("Bad login returns 401", badLogin.status === 401);

    // Auth - me
    const me = await req("GET", `${BASE}/auth/me`, { auth: token });
    assert("GET /me returns 200", me.status === 200);
    assert("GET /me returns user email", me.body?.data?.user?.email === email);

    // Auth - no token
    const noAuth = await req("GET", `${BASE}/auth/me`);
    assert("Protected route without token returns 401", noAuth.status === 401);

    // Auth - bad token
    const badToken = await req("GET", `${BASE}/auth/me`, { auth: "invalid.token.here" });
    assert("Bad token returns 401", badToken.status === 401);

    // Health
    const health = await req("GET", `${BASE}/health`);
    assert("Health returns 200", health.status === 200);

    // Create interview
    const create = await req("POST", `${BASE}/interviews`, {
      auth: token,
      body: { title: "System Design Review" },
    });
    assert("Create interview returns 201", create.status === 201);
    assert("Create returns session", !!create.body?.data?.session?.id);
    assert("Create returns opening message", !!create.body?.data?.openingMessage);
    assert("Create returns aiResponse", create.body?.data?.aiResponse?.type === "question");
    sessionId = create.body?.data?.session?.id || "";

    // List sessions
    const list = await req("GET", `${BASE}/interviews`, { auth: token });
    assert("List sessions returns 200", list.status === 200);
    assert("List has sessions array", Array.isArray(list.body?.data?.sessions));
    assert("List has pagination", !!list.body?.data?.pagination);

    // Invalid status filter
    const badStatus = await req("GET", `${BASE}/interviews?status=invalid`, { auth: token });
    assert("Invalid status filter returns 400", badStatus.status === 400);

    // Get session
    const get = await req("GET", `${BASE}/interviews/${sessionId}`, { auth: token });
    assert("Get session returns 200", get.status === 200);
    assert("Get session includes messages", Array.isArray(get.body?.data?.session?.messages));

    // Chat
    const chat = await req("POST", `${BASE}/interviews/${sessionId}/chat`, {
      auth: token,
      body: { message: "I would use a token bucket algorithm for rate limiting." },
    });
    assert("Chat returns 200", chat.status === 200);
    assert("Chat returns userMessage", !!chat.body?.data?.userMessage);
    assert("Chat returns assistantMessage", !!chat.body?.data?.assistantMessage);
    assert("Chat returns aiResponse", !!chat.body?.data?.aiResponse?.type);

    // Submit code
    const code = await req("POST", `${BASE}/interviews/${sessionId}/code`, {
      auth: token,
      body: { language: "javascript", code: "function rateLimit() { return true; }" },
    });
    assert("Submit code returns 201", code.status === 201);
    assert("Submit code returns submission", !!code.body?.data?.submission?.id);

    // Get code submissions
    const codes = await req("GET", `${BASE}/interviews/${sessionId}/code`, { auth: token });
    assert("Get code submissions returns 200", codes.status === 200);
    assert("Get code submissions has array", Array.isArray(codes.body?.data?.submissions));

    // Update session
    const update = await req("PATCH", `${BASE}/interviews/${sessionId}`, {
      auth: token,
      body: { title: "Updated Title" },
    });
    assert("Update session returns 200", update.status === 200);
    assert("Update session changes title", update.body?.data?.session?.title === "Updated Title");

    // End interview
    const end = await req("POST", `${BASE}/interviews/${sessionId}/end`, { auth: token });
    assert("End interview returns 200", end.status === 200);
    assert("End returns completed session", end.body?.data?.session?.status === "completed");
    assert("End returns summary", end.body?.data?.aiResponse?.type === "summary");

    // Chat on completed session
    const chatClosed = await req("POST", `${BASE}/interviews/${sessionId}/chat`, {
      auth: token,
      body: { message: "Another message" },
    });
    assert("Chat on completed session returns 400", chatClosed.status === 400);

    // Delete session
    const del = await req("DELETE", `${BASE}/interviews/${sessionId}`, { auth: token });
    assert("Delete session returns 200", del.status === 200);

    // Cleanup test user
    await prisma.user.delete({ where: { email } }).catch(() => {});
  });

  await prisma.$disconnect();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
};

async function runStaticChecks() {
  assert("App module loads", !!require("../src/app"));
  assert("Auth routes load", !!require("../src/routes/auth.routes"));
  assert("Interview routes load", !!require("../src/routes/interview.routes"));
  assert("AI interview routes load", !!require("../src/routes/aiInterview.routes"));
  assert("Auth middleware loads", !!require("../src/middlewares/auth.middleware"));
  assert("Socket auth loads", !!require("../src/middlewares/socketAuth.middleware"));
}

main().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
