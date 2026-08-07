/**
 * Judge0 remote execution client.
 *
 * Provides real sandboxed execution for languages that need external
 * compilers/runtimes (Python, Java, C++) via the Judge0 CE API. Results come
 * from actual execution — nothing here is simulated.
 *
 * The default endpoint is the free community instance (ce.judge0.com), which is
 * rate-limited and not for production use. Self-host Judge0 and set JUDGE0_URL
 * (and optionally JUDGE0_API_KEY) in the backend .env for a production setup.
 */

const https = require("node:https");
const http = require("node:http");

const BASE_URL = (process.env.JUDGE0_URL || "https://ce.judge0.com").replace(/\/+$/, "");
const API_KEY = process.env.JUDGE0_API_KEY || "";

// Judge0 CE language ids (https://ce.judge0.com/languages)
const LANGUAGE_IDS = {
  python: 71, // Python 3.8.10
  java: 62, // OpenJDK 11.0.10
  cpp: 54, // g++ 9.3.0
  javascript: 63, // Node.js 12.14.0
  typescript: 74, // TypeScript 3.9.10 (compiled via tsc)
};

const POLL_INTERVAL_MS = 2500;
const POLL_DEADLINE_MS = 65000; // hard wall-clock ceiling for compile + run

const STATUS = {
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR_START: 7,
  RUNTIME_ERROR_END: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestJson = (url, { method = "GET", body, headers = {} } = {}) =>
  new Promise((resolve, reject) => {
    const lib = url.startsWith("https:") ? https : http;
    const req = lib.request(
      url,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ statusCode: res.statusCode, body: parsed });
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(20000, () => req.destroy(new Error("Judge0 request timed out")));
    if (body !== undefined) req.write(body);
    req.end();
  });

// Judge0 CE can refuse non-UTF-8 attribute conversion, so all I/O is base64.
const b64 = (value) => Buffer.from(String(value ?? ""), "utf8").toString("base64");
const unb64 = (value) =>
  value ? Buffer.from(String(value), "base64").toString("utf8") : "";

const parseMarkedResults = (stdout, info) => {
  const marker = "__MOCKGEN_RESULTS__";
  const markerIndex = stdout.lastIndexOf(marker);
  if (markerIndex === -1) {
    return {
      error:
        "Execution produced unexpected output (the test harness did not complete).",
      consoleOutput: stdout.trim().split("\n").filter(Boolean),
    };
  }
  try {
    const results = JSON.parse(stdout.slice(markerIndex + marker.length).trim());
    const consoleOutput = stdout
      .slice(0, markerIndex)
      .trim()
      .split("\n")
      .filter(Boolean);
    const passed = results.filter((r) => r.passed).length;
    return {
      passed,
      failed: results.length - passed,
      total: results.length,
      results,
      consoleOutput,
      runtimeMs: Math.round((info.time || 0) * 1000),
      memoryKb: info.memory ?? null,
    };
  } catch (err) {
    return { error: "Could not parse execution results: " + err.message };
  }
};

/**
 * Submit source code to Judge0 and poll until a terminal status is reached.
 * Returns a normalized results object (same shape as the local providers) or
 * { error } with a realistic, non-fabricated message.
 */
const runOnJudge0 = async ({ language, sourceCode, stdin }) => {
  const languageId = LANGUAGE_IDS[String(language).toLowerCase()];
  if (!languageId) {
    return { error: `No remote runtime is configured for "${language}".` };
  }

  const headers = API_KEY ? { "X-Auth-Token": API_KEY } : {};

  const submitRes = await requestJson(
    `${BASE_URL}/submissions?base64_encoded=true&wait=false`,
    {
      method: "POST",
      body: JSON.stringify({
        source_code: b64(sourceCode),
        language_id: languageId,
        stdin: b64(stdin),
        cpu_time_limit: 5,
        memory_limit: 262144, // 256 MB
        enable_network: false,
      }),
      headers,
    }
  );

  if (submitRes.statusCode >= 400) {
    const rateLimited = submitRes.statusCode === 429;
    const message =
      submitRes.body && submitRes.body.message ? ` (${submitRes.body.message})` : "";
    return {
      error: rateLimited
        ? "The judging service is rate-limited right now — wait a moment and run again."
        : `The judging service rejected the submission (HTTP ${submitRes.statusCode})${message}`,
    };
  }

  const token = submitRes.body && submitRes.body.token;
  if (!token) {
    return { error: "The judging service returned no submission token." };
  }

  const pollStart = Date.now();
  let submission = null;
  let transientFailures = 0;
  while (Date.now() - pollStart < POLL_DEADLINE_MS) {
    await sleep(POLL_INTERVAL_MS);
    const res = await requestJson(
      `${BASE_URL}/submissions/${token}?base64_encoded=true&fields=status,stdout,stderr,compile_output,time,memory`
    );
    if (res.statusCode >= 400) {
      // The community instance is occasionally flaky — retry a few times
      // before giving up on transient failures (429 / 5xx).
      transientFailures += 1;
      if (transientFailures >= 4) {
        return {
          error: `The judging service failed while checking the submission (HTTP ${res.statusCode}).`,
        };
      }
      continue;
    }
    submission = res.body;
    const statusId = submission.status && submission.status.id;
    if (statusId && statusId >= STATUS.ACCEPTED) break;
  }

  if (!submission || !submission.status) {
    return {
      error: "The judging service did not finish evaluating the submission in time.",
    };
  }

  const statusId = submission.status.id;

  switch (statusId) {
    case STATUS.ACCEPTED:
      return parseMarkedResults(unb64(submission.stdout), submission);
    case STATUS.COMPILATION_ERROR:
      return {
        error:
          "Compilation error:\n" + unb64(submission.compile_output).trim().slice(0, 2000),
      };
    case STATUS.TIME_LIMIT_EXCEEDED:
      return {
        error:
          "Execution timed out (time limit exceeded). Your solution may contain an infinite loop or be too slow for large inputs.",
      };
    default:
      if (statusId >= STATUS.RUNTIME_ERROR_START && statusId <= STATUS.RUNTIME_ERROR_END) {
        const detail = String(unb64(submission.stderr) || submission.status.description || "")
          .trim()
          .slice(0, 2000);
        return {
          error: `Runtime error: ${detail || "the program crashed at runtime."}`,
        };
      }
      if (statusId === STATUS.INTERNAL_ERROR || statusId === STATUS.EXEC_FORMAT_ERROR) {
        return {
          error: "The judging service hit an internal error — try running again in a moment.",
        };
      }
      return { error: `Unexpected judge status: ${submission.status.description || statusId}.` };
  }
};

module.exports = {
  runOnJudge0,
  LANGUAGE_IDS,
};
