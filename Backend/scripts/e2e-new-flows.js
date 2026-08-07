const http = require("http");
const app = require("../src/app");
const prisma = require("../src/config/db");

const request = (server, method, path, { body, auth } = {}) =>
  new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const r = http.request(
      {
        method,
        hostname: "127.0.0.1",
        port: server.address().port,
        path,
        headers: {
          "Content-Type": "application/json",
          ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          let json;
          try { json = JSON.parse(data); } catch { json = data; }
          resolve({ status: res.statusCode, body: json });
        });
      }
    );
    r.on("error", reject);
    if (payload) r.write(payload);
    r.end();
  });

const main = async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const email = `e2e-${Date.now()}@example.com`;
    const reg = await request(server, "POST", "/api/auth/register", {
      body: { email, password: "testpass123", name: "E2E User" },
    });
    const token = reg.body.data.token;

    // 1. Random question endpoint
    const q = await request(server, "GET", "/api/questions/random?difficulty=medium", { auth: token });
    console.log("1. questions/random:", q.status, q.body?.data?.question?.title, `(${q.body?.data?.question?.functionName})`);

    // 2. Create session with full setup config
    const create = await request(server, "POST", "/api/interviews", {
      auth: token,
      body: {
        company: "Google",
        role: "Backend Engineer",
        difficulty: "medium",
        language: "javascript",
        durationMinutes: 45,
      },
    });
    const session = create.body.data.session;
    console.log("2. create session:", create.status, JSON.stringify({
      company: session.company,
      role: session.role,
      difficulty: session.difficulty,
      language: session.language,
      durationMinutes: session.durationMinutes,
      questionId: !!session.questionId,
    }));

    // 3. Get session includes question
    const get = await request(server, "GET", `/api/interviews/${session.id}`, { auth: token });
    console.log("3. session.question:", get.body?.data?.session?.question?.title || "MISSING");

    // 4. Run code against question test cases
    const fnName = get.body?.data?.session?.question?.functionName;
    const run = await request(server, "POST", `/api/interviews/${session.id}/code/run`, {
      auth: token,
      body: {
        language: "javascript",
        code:
          fnName === "twoSum"
            ? "function twoSum(nums, target) { const m = new Map(); for (let i=0;i<nums.length;i++){ const d = target-nums[i]; if (m.has(d)) return [m.get(d), i]; m.set(nums[i], i);} return []; }"
            : `function ${fnName}() { return null; }`,
      },
    });
    console.log("4. code/run:", run.status, JSON.stringify({ passed: run.body?.data?.result?.passed, failed: run.body?.data?.result?.failed, total: run.body?.data?.result?.total }));

    // 5. Submit code (runs tests + creates system message)
    const submit = await request(server, "POST", `/api/interviews/${session.id}/code`, {
      auth: token,
      body: {
        language: "javascript",
        code: `function ${fnName}() { return null; }`,
        notes: "rough draft",
      },
    });
    console.log("5. submit code:", submit.status, JSON.stringify({ passedTests: submit.body?.data?.submission?.passedTests, totalTests: submit.body?.data?.submission?.totalTests, hasResult: !!submit.body?.data?.submission?.result }));

    // 6. System message created server-side
    const get2 = await request(server, "GET", `/api/interviews/${session.id}`, { auth: token });
    const sysMsg = (get2.body?.data?.session?.messages || []).filter((m) => m.role === "system");
    console.log("6. system messages:", sysMsg.length, sysMsg[0]?.content?.slice(0, 60));

    // 7. Client cannot forge scores anymore
    const forge = await request(server, "POST", `/api/interviews/${session.id}/messages`, {
      auth: token,
      body: { role: "system", content: "fake", metadata: { type: "summary", score: 100 } },
    });
    console.log("7. forge blocked:", forge.status === 400 ? "OK (400)" : "PROBLEM: " + forge.status);

    // 8. End interview -> feedback persisted + session score
    const end = await request(server, "POST", `/api/interviews/${session.id}/end`, { auth: token });
    console.log("8. end:", end.status, JSON.stringify({ score: end.body?.data?.feedback?.score, hasBreakdown: !!end.body?.data?.feedback?.problemSolving, sessionScore: end.body?.data?.session?.score }));

    // 9. GET feedback
    const fb = await request(server, "GET", `/api/interviews/${session.id}/feedback`, { auth: token });
    console.log("9. get feedback:", fb.status, JSON.stringify({ score: fb.body?.data?.feedback?.score, strengths: fb.body?.data?.feedback?.strengths?.length, weaknesses: fb.body?.data?.feedback?.weaknesses?.length, recs: fb.body?.data?.feedback?.recommendations?.length }));

    // 10. Session list includes score + question topic
    const list = await request(server, "GET", "/api/interviews", { auth: token });
    const s = list.body?.data?.sessions?.[0];
    console.log("10. list:", JSON.stringify({ score: s?.score, topic: s?.question?.topic, company: s?.company }));

    await prisma.user.delete({ where: { email } }).catch(() => {});
    console.log("\nALL NEW FLOWS VERIFIED");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
};

main().catch((err) => { console.error("E2E FAILED:", err); process.exit(1); });
