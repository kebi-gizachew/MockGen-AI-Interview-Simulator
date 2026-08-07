/**
 * Per-language test harnesses used by the execution providers.
 * All harnesses read the test payload ({ functionName, testCases }) from stdin,
 * call the candidate's function per test case, and print results JSON after a
 * marker line so user console output can be captured separately.
 */

const RESULT_MARKER = "__MOCKGEN_RESULTS__";

// Infer the "type shape" of a test-case argument so generated harness calls
// (Java/C++ are statically typed) can convert the JSON input correctly.
const inferArgType = (value) => {
  if (Array.isArray(value)) {
    if (value.length === 0) return "int[]";
    const allNumbers = value.every((v) => typeof v === "number");
    const allStrings = value.every((v) => typeof v === "string");
    const allArrays = value.every((v) => Array.isArray(v));
    if (allArrays) {
      const inner = value[0] || [];
      if (inner.some((v) => typeof v === "number" && !Number.isInteger(v))) return "double[][]";
      if (inner.every((v) => typeof v === "string")) return "string[][]";
      return "int[][]";
    }
    if (allNumbers) {
      return value.some((v) => !Number.isInteger(v)) ? "double[]" : "int[]";
    }
    if (allStrings) return "string[]";
    return "int[]";
  }
  if (typeof value === "number") return Number.isInteger(value) ? "int" : "double";
  if (typeof value === "string") return "string";
  if (typeof value === "boolean") return "boolean";
  return "int";
};

const PYTHON_HARNESS = `
import json, sys, re

if "TreeNode" not in globals():
    class TreeNode:
        def __init__(self, val=0, left=None, right=None):
            self.val = val
            self.left = left
            self.right = right
    from collections import deque

if "ListNode" not in globals():
    class ListNode:
        def __init__(self, val=0, next=None):
            self.val = val
            self.next = next

def _mockgen_serialize(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        if isinstance(v, float) and v.is_integer():
            return str(int(v))
        return repr(v)
    if isinstance(v, str):
        return json.dumps(v)
    if isinstance(v, ListNode):
        arr = []
        cur = v
        guard = 0
        while cur is not None and guard < 100000:
            arr.append(cur.val)
            cur = cur.next
            guard += 1
        return _mockgen_serialize(arr)
    if isinstance(v, TreeNode):
        out = []
        q = deque([v]) if v is not None else deque()
        guard = 0
        while q and guard < 100000:
            n = q.popleft()
            if n is None:
                out.append(None)
                continue
            out.append(n.val)
            q.append(n.left)
            q.append(n.right)
            guard += 1
        while out and out[-1] is None:
            out.pop()
        return _mockgen_serialize(out)
    if isinstance(v, list):
        return "[" + ",".join(_mockgen_serialize(x) for x in v) + "]"
    if isinstance(v, dict):
        return "{" + ",".join(json.dumps(k) + ":" + _mockgen_serialize(x) for k, x in v.items()) + "}"
    return json.dumps(v)

def _mockgen_build_list(arr):
    if not arr:
        return None
    head = ListNode(arr[0])
    cur = head
    for v in arr[1:]:
        cur.next = ListNode(v)
        cur = cur.next
    return head

def _mockgen_build_tree(arr):
    if not arr:
        return None
    root = TreeNode(arr[0])
    q = [root]
    i = 1
    while q and i < len(arr):
        node = q.pop(0)
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            q.append(node.right)
        i += 1
    return root

def _mockgen_convert(v, typ):
    if typ == "tree":
        return _mockgen_build_tree(v)
    if typ == "listnode":
        return _mockgen_build_list(v)
    return v

def _mockgen_find_fn(fn):
    # Accept camelCase (question spec) or snake_case (pythonic) definitions.
    candidates = [fn]
    s1 = re.sub(r'(.)([A-Z][a-z]+)', r'\\1_\\2', fn)
    s2 = re.sub(r'([a-z0-9])([A-Z])', r'\\1_\\2', s1).lower()
    candidates.append(s2)
    parts = fn.split('_')
    candidates.append(parts[0] + ''.join(p.title() for p in parts[1:]))
    seen = set()
    for name in candidates:
        if name in seen:
            continue
        seen.add(name)
        if name in globals() and callable(globals()[name]):
            return globals()[name]
    return None

def _mockgen_main():
    payload = json.loads(sys.stdin.read())
    arg_types = payload.get("argTypes") or []
    fn = _mockgen_find_fn(payload["functionName"])
    if fn is None:
        results = []
        for tc in payload["testCases"]:
            results.append({"input": tc["input"], "expected": tc["expected"], "actual": None, "passed": False,
                            "error": "Function '" + payload["functionName"] + "' is not defined in your code. Define it with exactly that name (or its snake_case equivalent in Python)."})
        print("__MOCKGEN_RESULTS__" + json.dumps(results, default=str))
        return
    results = []
    for tc in payload["testCases"]:
        entry = {"input": tc["input"], "expected": tc["expected"], "actual": None, "passed": False}
        try:
            converted = [_mockgen_convert(v, arg_types[i]) if i < len(arg_types) else v for i, v in enumerate(tc["input"])]
            actual = fn(*converted)
            entry["actual"] = actual
            entry["passed"] = _mockgen_serialize(actual) == _mockgen_serialize(tc["expected"])
        except Exception as e:
            entry["error"] = str(e)
        results.append(entry)
    print("__MOCKGEN_RESULTS__" + json.dumps(results, default=str))

_mockgen_main()
`;

const NODE_HARNESS = `
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

const serialize = (value) => {
  if (value === undefined) return "__undefined__";
  if (typeof value === "number" && Number.isNaN(value)) return "__nan__";
  if (value instanceof ListNode) {
    const arr = [];
    let cur = value;
    let guard = 0;
    while (cur !== null && cur !== undefined && guard++ < 100000) {
      arr.push(cur.val);
      cur = cur.next;
    }
    return JSON.stringify(arr);
  }
  if (value instanceof TreeNode) {
    const out = [];
    const q = [value];
    let guard = 0;
    while (q.length > 0 && guard++ < 100000) {
      const n = q.shift();
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

const buildTree = (arr) => {
  if (!arr || arr.length === 0) return null;
  const root = new TreeNode(arr[0]);
  const q = [root];
  let i = 1;
  while (q.length > 0 && i < arr.length) {
    const node = q.shift();
    if (i < arr.length && arr[i] !== null) { node.left = new TreeNode(arr[i]); q.push(node.left); }
    i++;
    if (i < arr.length && arr[i] !== null) { node.right = new TreeNode(arr[i]); q.push(node.right); }
    i++;
  }
  return root;
};

const buildList = (arr) => {
  if (!arr || arr.length === 0) return null;
  const head = new ListNode(arr[0]);
  let cur = head;
  for (let i = 1; i < arr.length; i++) {
    cur.next = new ListNode(arr[i]);
    cur = cur.next;
  }
  return head;
};

const convertArg = (value, type) => {
  if (type === "tree") return buildTree(value);
  if (type === "listnode") return buildList(value);
  return value;
};

let input = "";
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  const payload = JSON.parse(input);
  const fn = payload.functionName;
  const argTypes = payload.argTypes || [];
  const results = [];
  for (const tc of payload.testCases) {
    const entry = { input: tc.input, expected: tc.expected, actual: null, passed: false };
    try {
      const args = tc.input.map((v, i) => convertArg(v, argTypes[i]));
      const actual = fn.apply(null, args);
      entry.actual = actual;
      entry.passed = serialize(actual) === serialize(tc.expected);
    } catch (err) {
      entry.error = String((err && err.message) || err);
    }
    results.push(entry);
  }
  console.log("__MOCKGEN_RESULTS__" + JSON.stringify(results));
});
`;

/* ----------------------------- Java ----------------------------- */

const JAVA_JSON_UTIL = `
class Json {
  static Object parse(String s) {
    return new P(s).value();
  }

  static class P {
    String s;
    int i = 0;
    P(String s) { this.s = s; }
    void ws() { while (i < s.length() && Character.isWhitespace(s.charAt(i))) i++; }
    Object value() {
      ws();
      char c = s.charAt(i);
      if (c == '{') return obj();
      if (c == '[') return arr();
      if (c == '"') return str();
      if (c == 't' || c == 'f') return bool();
      if (c == 'n') { i += 4; return null; }
      return num();
    }
    Map<String,Object> obj() {
      Map<String,Object> m = new LinkedHashMap<>();
      i++; ws();
      if (i < s.length() && s.charAt(i) == '}') { i++; return m; }
      while (true) {
        ws(); String k = str(); ws(); i++;
        m.put(k, value()); ws();
        if (s.charAt(i) == ',') { i++; continue; }
        i++; return m;
      }
    }
    List<Object> arr() {
      List<Object> l = new ArrayList<>();
      i++; ws();
      if (i < s.length() && s.charAt(i) == ']') { i++; return l; }
      while (true) {
        l.add(value()); ws();
        if (s.charAt(i) == ',') { i++; continue; }
        i++; return l;
      }
    }
    String str() {
      i++; StringBuilder b = new StringBuilder();
      while (i < s.length() && s.charAt(i) != '"') {
        char c = s.charAt(i);
        if (c == '\\'' && i + 1 < s.length()) {
          char n = s.charAt(i + 1);
          if (n == 'n') b.append('\\n');
          else if (n == 't') b.append('\\t');
          else if (n == 'u') { b.append((char) Integer.parseInt(s.substring(i + 2, i + 6), 16)); i += 4; }
          else b.append(n);
          i += 2;
        } else { b.append(c); i++; }
      }
      i++;
      return b.toString();
    }
    Boolean bool() {
      if (s.charAt(i) == 't') { i += 4; return Boolean.TRUE; }
      i += 5; return Boolean.FALSE;
    }
    Number num() {
      int start = i;
      while (i < s.length() && "0123456789+-.eE".indexOf(s.charAt(i)) >= 0) i++;
      String t = s.substring(start, i);
      if (t.indexOf('.') >= 0 || t.indexOf('e') >= 0 || t.indexOf('E') >= 0) return Double.parseDouble(t);
      return Long.parseLong(t);
    }
  }

  static String ser(Object v) {
    if (v == null) return "null";
    if (v instanceof Boolean) return v.toString();
    if (v instanceof Double) {
      double d = (Double) v;
      if (d == Math.floor(d) && !Double.isInfinite(d)) return String.valueOf((long) d);
      return String.valueOf(d);
    }
    if (v instanceof Long || v instanceof Integer) return v.toString();
    if (v instanceof String) return quote((String) v);
    if (v instanceof int[]) {
      int[] a = (int[]) v; StringBuilder b = new StringBuilder("[");
      for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(a[i]); }
      return b.append(']').toString();
    }
    if (v instanceof int[][]) {
      int[][] a = (int[][]) v; StringBuilder b = new StringBuilder("[");
      for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(ser(a[i])); }
      return b.append(']').toString();
    }
    if (v instanceof long[]) {
      long[] a = (long[]) v; StringBuilder b = new StringBuilder("[");
      for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(a[i]); }
      return b.append(']').toString();
    }
    if (v instanceof double[]) {
      double[] a = (double[]) v; StringBuilder b = new StringBuilder("[");
      for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(ser(a[i])); }
      return b.append(']').toString();
    }
    if (v instanceof String[]) {
      String[] a = (String[]) v; StringBuilder b = new StringBuilder("[");
      for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(quote(a[i])); }
      return b.append(']').toString();
    }
    if (v instanceof List) {
      List<?> l = (List<?>) v; StringBuilder b = new StringBuilder("[");
      for (int i = 0; i < l.size(); i++) { if (i > 0) b.append(','); b.append(ser(l.get(i))); }
      return b.append(']').toString();
    }
    if (v instanceof Map) {
      Map<?,?> m = (Map<?,?>) v; StringBuilder b = new StringBuilder("{");
      boolean first = true;
      for (Map.Entry<?,?> e : m.entrySet()) { if (!first) b.append(','); first = false; b.append(quote(String.valueOf(e.getKey()))).append(':').append(ser(e.getValue())); }
      return b.append('}').toString();
    }
    if (v instanceof ListNode) {
      ListNode n = (ListNode) v;
      StringBuilder b = new StringBuilder("[");
      boolean first = true;
      ListNode cur = n;
      int guard = 0;
      while (cur != null && guard++ < 100000) {
        if (!first) b.append(',');
        first = false;
        b.append(cur.val);
        cur = cur.next;
      }
      return b.append(']').toString();
    }
    if (v instanceof TreeNode) {
      List<Object> out = new ArrayList<>();
      Queue<TreeNode> q = new LinkedList<>();
      q.add((TreeNode) v);
      int guard = 0;
      while (!q.isEmpty() && guard++ < 100000) {
        TreeNode n = q.poll();
        if (n == null) { out.add(null); continue; }
        out.add(n.val);
        q.add(n.left);
        q.add(n.right);
      }
      while (!out.isEmpty() && out.get(out.size() - 1) == null) out.remove(out.size() - 1);
      return ser(out);
    }
    return quote(String.valueOf(v));
  }

  static String quote(String s) {
    StringBuilder b = new StringBuilder("\\"");
    for (char c : s.toCharArray()) {
      if (c == '"' || c == '\\'') { b.append('\\''); b.append(c); }
      else if (c == '\\n') b.append("\\n");
      else b.append(c);
    }
    return b.append('"').toString();
  }

  // Conversions from parsed JSON values to typed Java values
  static int toInt(Object v) { return ((Number) v).intValue(); }
  static double toDouble(Object v) { return ((Number) v).doubleValue(); }
  static String toStr(Object v) { return (String) v; }
  static boolean toBool(Object v) { return (Boolean) v; }
  static int[] toIntArray(Object v) {
    List<?> l = (List<?>) v; int[] r = new int[l.size()];
    for (int i = 0; i < l.size(); i++) r[i] = ((Number) l.get(i)).intValue();
    return r;
  }
  static int[][] toIntMatrix(Object v) {
    List<?> l = (List<?>) v; int[][] r = new int[l.size()][];
    for (int i = 0; i < l.size(); i++) r[i] = toIntArray(l.get(i));
    return r;
  }
  static double[] toDoubleArray(Object v) {
    List<?> l = (List<?>) v; double[] r = new double[l.size()];
    for (int i = 0; i < l.size(); i++) r[i] = ((Number) l.get(i)).doubleValue();
    return r;
  }
  static String[] toStringArray(Object v) {
    List<?> l = (List<?>) v; String[] r = new String[l.size()];
    for (int i = 0; i < l.size(); i++) r[i] = String.valueOf(l.get(i));
    return r;
  }
  static String[][] toStringMatrix(Object v) {
    List<?> l = (List<?>) v; String[][] r = new String[l.size()][];
    for (int i = 0; i < l.size(); i++) r[i] = toStringArray(l.get(i));
    return r;
  }
  static TreeNode buildTree(Object v) {
    if (v == null) return null;
    List<Object> arr = (List<Object>) v;
    if (arr.isEmpty()) return null;
    TreeNode root = new TreeNode(((Number) arr.get(0)).intValue());
    Queue<TreeNode> q = new LinkedList<>();
    q.add(root);
    int i = 1;
    while (!q.isEmpty() && i < arr.size()) {
      TreeNode cur = q.poll();
      if (i < arr.size() && arr.get(i) != null) { cur.left = new TreeNode(((Number) arr.get(i)).intValue()); q.add(cur.left); }
      i++;
      if (i < arr.size() && arr.get(i) != null) { cur.right = new TreeNode(((Number) arr.get(i)).intValue()); q.add(cur.right); }
      i++;
    }
    return root;
  }
  static ListNode buildList(Object v) {
    if (v == null) return null;
    List<Object> arr = (List<Object>) v;
    if (arr.isEmpty()) return null;
    ListNode head = new ListNode(((Number) arr.get(0)).intValue());
    ListNode cur = head;
    for (int i = 1; i < arr.size(); i++) {
      cur.next = new ListNode(((Number) arr.get(i)).intValue());
      cur = cur.next;
    }
    return head;
  }
}
`;

const JAVA_TREE_UTIL = `
class TreeNode {
  int val;
  TreeNode left;
  TreeNode right;
  TreeNode(int x) { val = x; }
}
`;

const JAVA_LISTNODE_UTIL = `
class ListNode {
  int val;
  ListNode next;
  ListNode(int x) { val = x; }
  ListNode(int x, ListNode n) { val = x; next = n; }
}
`;

/* ----------------------------- Java program assembly ----------------------------- */

const JAVA_TYPE_MAP = {
  "int[]": "int[]",
  "int[][]": "int[][]",
  "int": "int",
  "double": "double",
  "string": "String",
  "boolean": "boolean",
  "double[]": "double[]",
  "string[]": "String[]",
  "string[][]": "String[][]",
};

const JAVA_CONVERTER_MAP = {
  "int[]": "toIntArray",
  "int[][]": "toIntMatrix",
  "int": "toInt",
  "double": "toDouble",
  "string": "toStr",
  "boolean": "toBool",
  "double[]": "toDoubleArray",
  "string[]": "toStringArray",
  "string[][]": "toStringMatrix",
};

const buildJavaMain = (functionName, testCases, argTypes) => {
  const firstInput = testCases[0]?.input || [];
  const declLines = firstInput
    .map((arg, idx) => {
      const rawType = argTypes && argTypes[idx] ? argTypes[idx] : inferArgType(arg);
      const type = rawType === "tree" || rawType === "listnode" ? rawType : inferArgType(arg);
      if (type === "tree") {
        return `      TreeNode a${idx} = Json.buildTree(input.get(${idx}));`;
      }
      if (type === "listnode") {
        return `      ListNode a${idx} = Json.buildList(input.get(${idx}));`;
      }
      return `      ${JAVA_TYPE_MAP[type]} a${idx} = Json.${JAVA_CONVERTER_MAP[type]}(input.get(${idx}));`;
    })
    .join("\n");
  const args = firstInput.map((_, idx) => `a${idx}`).join(", ");

  return `
public class Main {
  public static void main(String[] args) throws Exception {
    StringBuilder sb = new StringBuilder();
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    String line;
    while ((line = br.readLine()) != null) sb.append(line).append('\\n');
    Map<String,Object> payload = (Map<String,Object>) Json.parse(sb.toString());
    List<Object> tcs = (List<Object>) payload.get("testCases");
    Solution sol = new Solution();
    List<Object> results = new ArrayList<>();
    for (Object t : tcs) {
      Map<String,Object> tc = (Map<String,Object>) t;
      List<Object> input = (List<Object>) tc.get("input");
      Object expected = tc.get("expected");
      Object actual = null;
      String err = null;
      boolean passed = false;
      try {
${declLines}
        actual = sol.${functionName}(${args});
        passed = Json.ser(actual).equals(Json.ser(expected));
      } catch (Throwable ex) {
        Throwable c = ex.getCause();
        err = String.valueOf(c != null ? c : ex);
      }
      Map<String,Object> e = new LinkedHashMap<>();
      e.put("input", input);
      e.put("expected", expected);
      e.put("actual", actual);
      e.put("passed", passed);
      if (err != null) e.put("error", err);
      results.add(e);
    }
    System.out.println("__MOCKGEN_RESULTS__" + Json.ser(results));
  }
}
`;
};

const buildJavaProgram = ({ code, functionName, testCases, argTypes }) => {
  const userCode = String(code).replace(/public\s+class\s+Solution\b/, "class Solution");
  // The harness uses java.io/java.util types; duplicate imports are harmless
  // if the candidate already declared them. The Json serializer references
  // ListNode/TreeNode for linked-list/tree return values, so the classes are
  // injected whenever the candidate has not defined their own.
  const treeUtil = !/class\s+TreeNode\b/.test(userCode) ? JAVA_TREE_UTIL : "";
  const listUtil = !/class\s+ListNode\b/.test(userCode) ? JAVA_LISTNODE_UTIL : "";
  return `import java.io.*;\nimport java.util.*;\n\n${userCode}\n\n${JAVA_JSON_UTIL}\n${treeUtil}${listUtil}${buildJavaMain(functionName, testCases, argTypes)}`;
};

/* ----------------------------- C++ ----------------------------- */

const CPP_JSON_UTIL = `
#include <bits/stdc++.h>
using namespace std;

struct Json {
  enum Type { NUL, BOOL, NUM, STR, ARR, OBJ } type = NUL;
  bool b = false;
  double num = 0;
  string str;
  vector<Json> arr;
  map<string, Json> obj;

  static Json make_null() { Json j; j.type = NUL; return j; }
  static Json make_bool(bool v) { Json j; j.type = BOOL; j.b = v; return j; }
  static Json make_num(double v) { Json j; j.type = NUM; j.num = v; return j; }
  static Json make_str(const string& v) { Json j; j.type = STR; j.str = v; return j; }
  static Json make_arr(const vector<Json>& v) { Json j; j.type = ARR; j.arr = v; return j; }
  static Json make_obj(const map<string, Json>& v) { Json j; j.type = OBJ; j.obj = v; return j; }
};

static void _skipws(const string& s, size_t& i) { while (i < s.size() && isspace((unsigned char) s[i])) i++; }
static string _parse_str(const string& s, size_t& i) {
  i++; string out;
  while (i < s.size() && s[i] != '"') {
    char c = s[i];
    if (c == '\\'' && i + 1 < s.size()) {
      char n = s[i + 1];
      if (n == 'n') out += '\\n';
      else if (n == 't') out += '\\t';
      else if (n == 'u') { out += (char) stoi(s.substr(i + 2, 4), nullptr, 16); i += 4; }
      else out += n;
      i += 2;
    } else { out += c; i++; }
  }
  i++;
  return out;
}
static Json _parse(const string& s, size_t& i);
static Json _parse(const string& s, size_t& i) {
  _skipws(s, i);
  char c = s[i];
  if (c == '{') {
    i++; map<string, Json> m; _skipws(s, i);
    if (i < s.size() && s[i] == '}') { i++; return Json::make_obj(m); }
    while (true) {
      _skipws(s, i);
      string k = _parse_str(s, i);
      _skipws(s, i); i++;
      m[k] = _parse(s, i);
      _skipws(s, i);
      if (s[i] == ',') { i++; continue; }
      i++; break;
    }
    return Json::make_obj(m);
  }
  if (c == '[') {
    i++; vector<Json> a; _skipws(s, i);
    if (i < s.size() && s[i] == ']') { i++; return Json::make_arr(a); }
    while (true) {
      a.push_back(_parse(s, i));
      _skipws(s, i);
      if (s[i] == ',') { i++; continue; }
      i++; break;
    }
    return Json::make_arr(a);
  }
  if (c == '"') return Json::make_str(_parse_str(s, i));
  if (c == 't') { i += 4; return Json::make_bool(true); }
  if (c == 'f') { i += 5; return Json::make_bool(false); }
  if (c == 'n') { i += 4; return Json::make_null(); }
  {
    size_t start = i;
    while (i < s.size() && string("0123456789+-.eE").find(s[i]) != string::npos) i++;
    return Json::make_num(stod(s.substr(start, i - start)));
  }
}
static Json parse_json(const string& s) { size_t i = 0; return _parse(s, i); }

static string _quote(const string& s) {
  string out = "\\"";
  for (char c : s) {
    if (c == '"' || c == '\\'') { out += '\\''; out += c; }
    else if (c == '\\n') out += "\\n";
    else out += c;
  }
  return out + '"';
}
static string ser(const Json& v) {
  switch (v.type) {
    case Json::NUL: return "null";
    case Json::BOOL: return v.b ? "true" : "false";
    case Json::NUM: {
      double d = v.num;
      if (d == floor(d) && !isinf(d)) return to_string((long long) d);
      string s = to_string(d);
      while (s.size() > 1 && s.back() == '0') s.pop_back();
      if (!s.empty() && s.back() == '.') s.pop_back();
      return s;
    }
    case Json::STR: return _quote(v.str);
    case Json::ARR: {
      string out = "[";
      for (size_t i = 0; i < v.arr.size(); i++) { if (i) out += ','; out += ser(v.arr[i]); }
      return out + ']';
    }
    case Json::OBJ: {
      string out = "{"; bool first = true;
      for (auto& kv : v.obj) { if (!first) out += ','; first = false; out += _quote(kv.first) + ':' + ser(kv.second); }
      return out + '}';
    }
  }
  return "null";
}

static int to_int(const Json& v) { return (int) v.num; }
static double to_double(const Json& v) { return v.num; }
static string to_string_v(const Json& v) { return v.str; }
static bool to_bool(const Json& v) { return v.b; }
static vector<int> to_int_vec(const Json& v) {
  vector<int> r;
  for (auto& x : v.arr) r.push_back((int) x.num);
  return r;
}
static vector<vector<int>> to_int_mat(const Json& v) {
  vector<vector<int>> r;
  for (auto& row : v.arr) r.push_back(to_int_vec(row));
  return r;
}
static vector<double> to_double_vec(const Json& v) {
  vector<double> r;
  for (auto& x : v.arr) r.push_back(x.num);
  return r;
}
static vector<string> to_str_vec(const Json& v) {
  vector<string> r;
  for (auto& x : v.arr) r.push_back(x.str);
  return r;
}
static vector<vector<string>> to_str_mat(const Json& v) {
  vector<vector<string>> r;
  for (auto& row : v.arr) r.push_back(to_str_vec(row));
  return r;
}

static Json from_int(int v) { return Json::make_num(v); }
static Json from_double(double v) { return Json::make_num(v); }
static Json from_bool(bool v) { return Json::make_bool(v); }
static Json from_str(const string& v) { return Json::make_str(v); }
static Json from_int_vec(const vector<int>& v) {
  vector<Json> a;
  for (int x : v) a.push_back(Json::make_num(x));
  return Json::make_arr(a);
}
static Json from_int_mat(const vector<vector<int>>& v) {
  vector<Json> a;
  for (auto& row : v) a.push_back(from_int_vec(row));
  return Json::make_arr(a);
}
static Json from_double_vec(const vector<double>& v) {
  vector<Json> a;
  for (double x : v) a.push_back(Json::make_num(x));
  return Json::make_arr(a);
}
static Json from_str_vec(const vector<string>& v) {
  vector<Json> a;
  for (auto& x : v) a.push_back(Json::make_str(x));
  return Json::make_arr(a);
}
`;

// C++ requires declarations before use, so `struct TreeNode` (plus includes)
// must be prepended AHEAD of the candidate's Solution class. `to_tree` stays
// after the JSON util because it references Json.
const CPP_TREE_DECL = `
#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
  int val;
  TreeNode* left;
  TreeNode* right;
  TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};
`;

const CPP_TREE_UTIL = `
static TreeNode* to_tree(const Json& v) {
  if (v.type == Json::NUL || v.arr.empty()) return nullptr;
  TreeNode* root = new TreeNode((int) v.arr[0].num);
  queue<TreeNode*> q;
  q.push(root);
  size_t i = 1;
  while (!q.empty() && i < v.arr.size()) {
    TreeNode* cur = q.front();
    q.pop();
    if (i < v.arr.size() && v.arr[i].type != Json::NUL) { cur->left = new TreeNode((int) v.arr[i].num); q.push(cur->left); }
    i++;
    if (i < v.arr.size() && v.arr[i].type != Json::NUL) { cur->right = new TreeNode((int) v.arr[i].num); q.push(cur->right); }
    i++;
  }
  return root;
}
static Json from_tree(const TreeNode* root) {
  vector<Json> out;
  queue<const TreeNode*> q;
  if (root != nullptr) q.push(root);
  int guard = 0;
  while (!q.empty() && guard++ < 100000) {
    const TreeNode* n = q.front(); q.pop();
    if (n == nullptr) { out.push_back(Json::make_null()); continue; }
    out.push_back(Json::make_num(n->val));
    q.push(n->left);
    q.push(n->right);
  }
  while (!out.empty() && out.back().type == Json::NUL) out.pop_back();
  return Json::make_arr(out);
}
`;

// C++ requires declarations before use, so `struct ListNode` (plus includes)
// must be prepended AHEAD of the candidate's Solution class when linked-list
// questions are run. `to_list`/`from_list_node` stay after the JSON util.
const CPP_LISTNODE_DECL = `
#include <bits/stdc++.h>
using namespace std;

struct ListNode {
  int val;
  ListNode* next;
  ListNode(int x) : val(x), next(nullptr) {}
  ListNode(int x, ListNode* n) : val(x), next(n) {}
};
`;

const CPP_LISTNODE_UTIL = `
static ListNode* to_list(const Json& v) {
  if (v.type == Json::NUL || v.arr.empty()) return nullptr;
  ListNode* head = new ListNode((int) v.arr[0].num);
  ListNode* cur = head;
  for (size_t i = 1; i < v.arr.size(); i++) {
    cur->next = new ListNode((int) v.arr[i].num);
    cur = cur->next;
  }
  return head;
}
static Json from_list_node(const ListNode* head) {
  vector<Json> a;
  const ListNode* cur = head;
  int guard = 0;
  while (cur != nullptr && guard++ < 100000) {
    a.push_back(Json::make_num(cur->val));
    cur = cur->next;
  }
  return Json::make_arr(a);
}
`;

/* ----------------------------- C++ program assembly ----------------------------- */

const CPP_TYPE_MAP = {
  "int[]": "vector<int>",
  "int[][]": "vector<vector<int>>",
  "int": "int",
  "double": "double",
  "string": "string",
  "boolean": "bool",
  "double[]": "vector<double>",
  "string[]": "vector<string>",
  "string[][]": "vector<vector<string>>",
};

const CPP_CONVERTER_MAP = {
  "int[]": "to_int_vec",
  "int[][]": "to_int_mat",
  "int": "to_int",
  "double": "to_double",
  "string": "to_string_v",
  "boolean": "to_bool",
  "double[]": "to_double_vec",
  "string[]": "to_str_vec",
  "string[][]": "to_str_mat",
};

const CPP_FROM_MAP = {
  "int[]": "from_int_vec",
  "int[][]": "from_int_mat",
  "int": "from_int",
  "double": "from_double",
  "string": "from_str",
  "boolean": "from_bool",
  "double[]": "from_double_vec",
  "string[]": "from_str_vec",
  "string[][]": "from_str_mat",
};

const buildCppMain = (functionName, testCases, argTypes) => {
  const firstInput = testCases[0]?.input || [];
  const declLines = firstInput
    .map((arg, idx) => {
      const rawType = argTypes && argTypes[idx] ? argTypes[idx] : inferArgType(arg);
      const type = rawType === "tree" || rawType === "listnode" ? rawType : inferArgType(arg);
      if (type === "tree") {
        return `      TreeNode* a${idx} = to_tree(in[${idx}]);`;
      }
      if (type === "listnode") {
        return `      ListNode* a${idx} = to_list(in[${idx}]);`;
      }
      return `      ${CPP_TYPE_MAP[type]} a${idx} = ${CPP_CONVERTER_MAP[type]}(in[${idx}]);`;
    })
    .join("\n");
  const args = firstInput.map((_, idx) => `a${idx}`).join(", ");
  const returnIsListNode =
    (argTypes || []).includes("listnode") && Array.isArray(testCases[0]?.expected);
  const returnIsTree =
    (argTypes || []).includes("tree") && Array.isArray(testCases[0]?.expected);
  const callLine = returnIsListNode
    ? `      actual = from_list_node(sol.${functionName}(${args}));`
    : returnIsTree
      ? `      actual = from_tree(sol.${functionName}(${args}));`
      : `      actual = ${CPP_FROM_MAP[inferArgType(firstInput.length ? testCases[0].expected : null)]}(sol.${functionName}(${args}));`;

  return `
int main() {
  string input((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());
  Json payload = parse_json(input);
  Json tcs = payload.obj.at("testCases");
  Solution sol;
  vector<Json> results;
  for (Json& t : tcs.arr) {
    map<string, Json>& tc = t.obj;
    vector<Json>& in = tc.at("input").arr;
    Json expected = tc.at("expected");
    Json actual = Json::make_null();
    bool passed = false;
    string err;
    try {
${declLines}
${callLine}
      passed = ser(actual) == ser(expected);
    } catch (const exception& ex) {
      err = ex.what();
    }
    Json e = Json::make_obj(map<string, Json>());
    e.obj["input"] = tc.at("input");
    e.obj["expected"] = expected;
    e.obj["actual"] = actual;
    e.obj["passed"] = Json::make_bool(passed);
    if (!err.empty()) e.obj["error"] = Json::make_str(err);
    results.push_back(e);
  }
  cout << "__MOCKGEN_RESULTS__" << ser(Json::make_arr(results)) << endl;
  return 0;
}
`;
};

const buildCppProgram = ({ code, functionName, testCases, argTypes }) => {
  const needsTree = (argTypes || []).includes("tree");
  const needsList = (argTypes || []).includes("listnode");
  const userDefinesTreeNode = /(?:struct|class)\s+TreeNode\b/.test(String(code));
  const userDefinesListNode = /(?:struct|class)\s+ListNode\b/.test(String(code));
  const decl =
    (needsTree && !userDefinesTreeNode ? CPP_TREE_DECL : "") +
    (needsList && !userDefinesListNode ? CPP_LISTNODE_DECL : "");
  const util =
    (needsTree ? CPP_TREE_UTIL : "") + (needsList ? CPP_LISTNODE_UTIL : "");
  return `${decl}${code}\n\n${CPP_JSON_UTIL}${util}\n${buildCppMain(functionName, testCases, argTypes)}`;
};

/**
 * Assemble the full runnable program for a language from candidate code.
 * The candidate's function definitions are preserved; harness code is appended.
 */
const buildProgram = (language, { code, functionName, testCases, argTypes }) => {
  switch (language) {
    case "python":
      // `from __future__ import annotations` keeps type-hint style starters
      // (list[int], Optional[...]) valid on older Python runtimes (3.8).
      return `from __future__ import annotations\n\n${code}\n\n${PYTHON_HARNESS}`;
    case "javascript":
      return `${code}\n\n${NODE_HARNESS}`;
    case "java":
      return buildJavaProgram({ code, functionName, testCases, argTypes });
    case "cpp":
      return buildCppProgram({ code, functionName, testCases, argTypes });
    default:
      throw new Error("Unsupported language: " + language);
  }
};

module.exports = {
  RESULT_MARKER,
  inferArgType,
  buildProgram,
};
