/**
 * Code execution orchestrator.
 *
 * Languages are executed through a provider chain so every language the user
 * can select actually runs:
 *   - javascript / typescript : in-process sandbox (node:vm) — fast, offline
 *   - python                  : local subprocess when a Python runtime exists
 *                               on this machine, otherwise the remote sandbox
 *   - java / cpp              : remote Judge0 sandbox (real compilers)
 *
 * Every result comes from real execution. Compile errors, runtime errors,
 * timeouts, per-test pass/fail and execution time are reported truthfully —
 * nothing is simulated.
 */

const vm = require("node:vm");
const ts = require("typescript");
const { spawn, execSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { buildProgram } = require("./execution/harness");
const { runOnJudge0 } = require("./execution/judge0.client");

const EXECUTION_TIMEOUT_MS = 5000;
const RESULT_MARKER = "__MOCKGEN_RESULTS__";
const MAX_CODE_LENGTH = 64 * 1024; // 64 KB source cap (bounds judge payloads + vm compile cost)

/* ----------------------------- JavaScript (in-process sandbox) ----------------------------- */

const safeStringify = (value) => {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, (k, v) => (typeof v === "bigint" ? String(v) : v));
  } catch {
    return String(value);
  }
};

const buildJsHarness = (functionName, testCases, argTypes) => `
if (typeof TreeNode === "undefined") {
  TreeNode = class TreeNode {
    constructor(val, left, right) {
      this.val = val;
      this.left = left;
      this.right = right;
    }
  };
}
if (typeof ListNode === "undefined") {
  ListNode = class ListNode {
    constructor(val, next) {
      this.val = val;
      this.next = next;
    }
  };
}
var __mockgenArgTypes = ${JSON.stringify(argTypes || [])};
var __mockgenSerialize = function (value) {
  if (value === undefined) return "__undefined__";
  if (typeof value === "number" && isNaN(value)) return "__nan__";
  if (value && value.constructor && value.constructor.name === "ListNode") {
    var arr = [];
    var cur = value;
    var guard = 0;
    while (cur !== null && cur !== undefined && guard++ < 100000) {
      arr.push(cur.val);
      cur = cur.next;
    }
    return JSON.stringify(arr);
  }
  if (value && value.constructor && value.constructor.name === "TreeNode") {
    var out = [];
    var q = [value];
    var guard = 0;
    while (q.length > 0 && guard++ < 100000) {
      var n = q.shift();
      if (n === null || n === undefined) { out.push(null); continue; }
      out.push(n.val);
      q.push(n.left || null);
      q.push(n.right || null);
    }
    while (out.length > 0 && out[out.length - 1] === null) out.pop();
    return JSON.stringify(out);
  }
  try { return JSON.stringify(value); } catch (e) { return String(value); }
};
var __mockgenBuildTree = function (arr) {
  if (!arr || arr.length === 0) return null;
  var root = new TreeNode(arr[0]);
  var q = [root];
  var i = 1;
  while (q.length > 0 && i < arr.length) {
    var node = q.shift();
    if (i < arr.length && arr[i] !== null) { node.left = new TreeNode(arr[i]); q.push(node.left); }
    i++;
    if (i < arr.length && arr[i] !== null) { node.right = new TreeNode(arr[i]); q.push(node.right); }
    i++;
  }
  return root;
};
var __mockgenBuildList = function (arr) {
  if (!arr || arr.length === 0) return null;
  var head = new ListNode(arr[0]);
  var cur = head;
  for (var i = 1; i < arr.length; i++) {
    cur.next = new ListNode(arr[i]);
    cur = cur.next;
  }
  return head;
};
var __mockgenConvert = function (v, t) {
  if (t === "tree") return __mockgenBuildTree(v);
  if (t === "listnode") return __mockgenBuildList(v);
  return v;
};
(function () {
  var testCases = ${JSON.stringify(testCases)};
  var results = [];
  var fn;
  try {
    fn = ${functionName};
  } catch (e) {
    fn = null;
  }
  if (typeof fn !== "function") {
    return JSON.stringify([{
      passed: false,
      input: null,
      expected: null,
      actual: null,
      error: "Function '${functionName}' is not defined in your code. Define it with exactly that name."
    }]);
  }
  for (var i = 0; i < testCases.length; i++) {
    var tc = testCases[i];
    var entry = { input: tc.input, expected: tc.expected, actual: null, passed: false };
    try {
      var args = tc.input.map(function (v, j) { return __mockgenConvert(v, __mockgenArgTypes[j]); });
      var actual = fn.apply(null, args);
      entry.actual = actual;
      entry.passed = __mockgenSerialize(actual) === __mockgenSerialize(tc.expected);
    } catch (err) {
      entry.error = String((err && err.message) || err);
    }
    results.push(entry);
  }
  return JSON.stringify(results);
})();
`;

const runJavaScript = ({ code, functionName, testCases, argTypes }) => {
  const capturedLogs = [];
  const sandbox = {
    console: {
      log: (...args) => capturedLogs.push(args.map((a) => safeStringify(a)).join(" ")),
      error: (...args) => capturedLogs.push(args.map((a) => safeStringify(a)).join(" ")),
      warn: (...args) => capturedLogs.push(args.map((a) => safeStringify(a)).join(" ")),
    },
    JSON,
    Math,
    Date,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Map,
    Set,
    RegExp,
    parseInt,
    parseFloat,
    isNaN,
    Promise,
    Symbol,
    Error,
  };

  // node:vm is a safety net, NOT a hardened security sandbox. For a public
  // deployment run untrusted code in an isolated worker/container instead.
  const context = vm.createContext(sandbox, {
    codeGeneration: { strings: false, wasm: false },
    resourceLimits: {
      maxOldGenerationSizeMb: 64,
      maxStringLength: 5_000_000,
      stackSizeMb: 4,
    },
  });
  const scriptText = `${code}\n${buildJsHarness(functionName, testCases, argTypes)}`;
  const start = Date.now();

  let script;
  try {
    script = new vm.Script(scriptText);
  } catch (err) {
    return { error: "Compile error: " + ((err && err.message) || err), consoleOutput: capturedLogs };
  }

  let rawResult;
  try {
    rawResult = script.runInContext(context, { timeout: EXECUTION_TIMEOUT_MS });
  } catch (err) {
    const message = String((err && err.message) || err);
    const isTimeout = /timed out|timeout/i.test(message);
    return {
      error: isTimeout
        ? `Execution timed out after ${EXECUTION_TIMEOUT_MS}ms (possible infinite loop).`
        : "Execution error: " + message.slice(0, 500),
      consoleOutput: capturedLogs,
    };
  }
  const runtimeMs = Date.now() - start;

  let results;
  try {
    results = JSON.parse(rawResult);
  } catch (err) {
    return { error: "Could not parse execution output: " + err.message, consoleOutput: capturedLogs };
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    passed,
    failed: results.length - passed,
    total: results.length,
    results,
    consoleOutput: capturedLogs,
    runtimeMs,
  };
};

const runTypeScript = ({ code, functionName, testCases, argTypes }) => {
  const transpiled = ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
    reportDiagnostics: true,
  });
  const diagnostics = (transpiled.diagnostics || [])
    .filter((d) => d.category === ts.DiagnosticCategory.Error)
    .map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
  if (diagnostics.length > 0) {
    return { error: "TypeScript compile error: " + diagnostics.join(" | ") };
  }
  return runJavaScript({ code: transpiled.outputText, functionName, testCases, argTypes });
};

/* ----------------------------- Local Python (subprocess) ----------------------------- */

let cachedPythonBinary = null;

const findPythonBinary = () => {
  if (cachedPythonBinary !== null) return cachedPythonBinary;
  const candidates = process.platform === "win32" ? ["python", "python3"] : ["python3", "python"];
  for (const candidate of candidates) {
    try {
      execSync(`${candidate} --version`, { stdio: "ignore", timeout: 2000 });
      cachedPythonBinary = candidate;
      return candidate;
    } catch {
      // try next candidate
    }
  }
  cachedPythonBinary = null;
  return null;
};

const runPythonLocal = async ({ code, functionName, testCases, argTypes, pythonBinary }) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mockgen-"));
  const scriptPath = path.join(dir, "solution.py");

  let program;
  try {
    program = buildProgram("python", { code, functionName, testCases });
  } catch (err) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    return { error: "Could not prepare Python program: " + err.message };
  }
  fs.writeFileSync(scriptPath, program);
  const payload = JSON.stringify({ functionName, testCases, argTypes });

  return new Promise((resolve) => {
    const child = spawn(pythonBinary, [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
    const start = Date.now();
    let stdout = "";
    let stderr = "";
    let settled = false;

    const cleanup = () => {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      cleanup();
      resolve({ error: `Execution timed out after ${EXECUTION_TIMEOUT_MS}ms (possible infinite loop).` });
    }, EXECUTION_TIMEOUT_MS);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      resolve({ error: "Failed to start Python runtime: " + err.message });
    });

    child.on("close", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      const runtimeMs = Date.now() - start;

      const markerIndex = stdout.lastIndexOf(RESULT_MARKER);
      if (markerIndex === -1) {
        const message = stderr.trim() || stdout.trim() || "No output produced.";
        return resolve({ error: "Execution failed: " + message.slice(0, 2000), runtimeMs });
      }

      try {
        const results = JSON.parse(stdout.slice(markerIndex + RESULT_MARKER.length).trim());
        const consoleOutput = stdout.slice(0, markerIndex).trim().split("\n").filter(Boolean);
        const passed = results.filter((r) => r.passed).length;
        resolve({
          passed,
          failed: results.length - passed,
          total: results.length,
          results,
          consoleOutput,
       
          consoleOutput,
          runtimeMs,
        });
      } catch (err) {
        resolve({ error: "Could not parse Python results: " + err.message, runtimeMs });
      }
    });

    child.stdin.write(payload);
    child.stdin.end();
  });
};

/* ----------------------------- Remote Judge0 provider ----------------------------- */

const runJudge0Language = async (language, { code, functionName, testCases, argTypes }) => {
  let sourceCode;
  try {
    sourceCode = buildProgram(language, { code, functionName, testCases, argTypes });
  } catch (err) {
    return { error: "Could not prepare code for execution: " + err.message };
  }
  const stdin = JSON.stringify({ functionName, testCases, argTypes });
  try {
    return await runOnJudge0({ language, sourceCode, stdin });
  } catch (err) {
    return {
      error:
        "The remote judging service is unreachable: " + err.message +
        " Check the server's internet connection and try again.",
    };
  }
};

/* ----------------------------- Public API ----------------------------- */

/**
 * Execute candidate code against a question's test cases.
 * Result shape (real execution only):
 *   success: { passed, failed, total, results, consoleOutput, runtimeMs, memoryKb? }
 *   failure: { error, consoleOutput?, runtimeMs? }
 */
const executeCode = async ({ language, code, functionName, testCases, argTypes }) => {
  const normalizedLanguage = String(language || "").toLowerCase();

  if (!code || !code.trim()) {
    return { error: "Code is required." };
  }
  if (code.length > MAX_CODE_LENGTH) {
    return { error: `Code is too large (max ${MAX_CODE_LENGTH} characters).` };
  }
  if (!functionName || !Array.isArray(testCases) || testCases.length === 0) {
    return { error: "This question has no runnable test cases yet." };
  }

  const payload = { code, functionName, testCases, argTypes };

  switch (normalizedLanguage) {
    case "javascript":
      return runJavaScript(payload);
    case "typescript":
      return runTypeScript(payload);
    case "python": {
      const pythonBinary = findPythonBinary();
      if (pythonBinary) {
        return runPythonLocal({ ...payload, pythonBinary });
      }
      return runJudge0Language("python", payload);
    }
    case "java":
      return runJudge0Language("java", payload);
    case "cpp":
      return runJudge0Language("cpp", payload);
    default:
      return { error: "Unsupported language: " + language };
  }
};

module.exports = {
  executeCode,
  EXECUTION_TIMEOUT_MS,
};
