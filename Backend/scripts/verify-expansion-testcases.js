/**
 * Verification script: runs a correct reference solution for every expansion
 * question against its declared test cases. Flags any expected value that a
 * correct implementation would NOT produce, so new test cases can be added
 * with confidence that they are solvable.
 *
 * Run: node scripts/verify-expansion-testcases.js
 */
const expansion = require("../src/data/expansion-questions");

// ---------- Reference solutions (canonical, simple) ----------
const ref = {};

ref.wordLadder = (beginWord, endWord, wordList) => {
  const wordSet = new Set(wordList);
  if (!wordSet.has(endWord)) return 0;
  let queue = [[beginWord, 1]];
  const visited = new Set([beginWord]);
  while (queue.length) {
    const [word, dist] = queue.shift();
    if (word === endWord) return dist;
    for (let i = 0; i < word.length; i++) {
      for (let c = 97; c < 123; c++) {
        const next = word.slice(0, i) + String.fromCharCode(c) + word.slice(i + 1);
        if (wordSet.has(next) && !visited.has(next)) {
          visited.add(next);
          queue.push([next, dist + 1]);
        }
      }
    }
  }
  return 0;
};

ref.shortestPathBinaryMatrix = (grid) => {
  const n = grid.length;
  if (grid[0][0] === 1 || grid[n - 1][n - 1] === 1) return -1;
  const dirs = [
    [0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1],
  ];
  const q = [[0, 0, 1]];
  const seen = new Set(["0,0"]);
  while (q.length) {
    const [r, c, d] = q.shift();
    if (r === n - 1 && c === n - 1) return d;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === 0 && !seen.has(`${nr},${nc}`)) {
        seen.add(`${nr},${nc}`);
        q.push([nr, nc, d + 1]);
      }
    }
  }
  return -1;
};

ref.pacificAtlantic = (heights) => {
  const m = heights.length, n = heights[0].length;
  const pac = Array.from({ length: m }, () => Array(n).fill(false));
  const atl = Array.from({ length: m }, () => Array(n).fill(false));
  const dfs = (r, c, visited, prev) => {
    if (r < 0 || r >= m || c < 0 || c >= n || visited[r][c] || heights[r][c] < prev) return;
    visited[r][c] = true;
    dfs(r + 1, c, visited, heights[r][c]);
    dfs(r - 1, c, visited, heights[r][c]);
    dfs(r, c + 1, visited, heights[r][c]);
    dfs(r, c - 1, visited, heights[r][c]);
  };
  for (let c = 0; c < n; c++) { dfs(0, c, pac, -Infinity); dfs(m - 1, c, atl, -Infinity); }
  for (let r = 0; r < m; r++) { dfs(r, 0, pac, -Infinity); dfs(r, n - 1, atl, -Infinity); }
  const out = [];
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (pac[r][c] && atl[r][c]) out.push([r, c]);
  return out;
};

ref.topKFrequentWords = (words, k) => {
  const counts = new Map();
  for (const w of words) counts.set(w, (counts.get(w) || 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, k)
    .map(([w]) => w);
};

ref.kthSmallest = (matrix, k) => {
  const flat = matrix.flat().sort((a, b) => a - b);
  return flat[k - 1];
};

ref.frequencySort = (s) => {
  const counts = new Map();
  const firstIdx = new Map();
  for (let i = 0; i < s.length; i++) {
    counts.set(s[i], (counts.get(s[i]) || 0) + 1);
    if (!firstIdx.has(s[i])) firstIdx.set(s[i], i);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || firstIdx.get(a[0]) - firstIdx.get(b[0]))
    .map(([ch, c]) => ch.repeat(c))
    .join("");
};

ref.predictPartyVictory = (senate) => {
  const n = senate.length;
  const rad = [], dir = [];
  senate.split("").forEach((p, i) => (p === "R" ? rad : dir).push(i));
  while (rad.length && dir.length) {
    const ri = rad.shift(), di = dir.shift();
    if (ri < di) rad.push(ri + n); else dir.push(di + n);
  }
  return rad.length ? "Radiant" : "Dire";
};

ref.mergeAccounts = (accounts) => {
  const parent = new Map();
  const find = (x) => {
    if (!parent.has(x)) parent.set(x, x);
    if (parent.get(x) !== x) parent.set(x, find(parent.get(x)));
    return parent.get(x);
  };
  const union = (a, b) => parent.set(find(a), find(b));
  const emailToName = new Map();
  for (const acc of accounts) {
    const name = acc[0];
    for (let i = 1; i < acc.length; i++) {
      emailToName.set(acc[i], name);
      if (i > 1) union(acc[i], acc[i - 1]);
    }
  }
  const groups = new Map();
  for (const email of emailToName.keys()) {
    const root = find(email);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(email);
  }
  const out = [];
  for (const emails of groups.values()) {
    const name = emailToName.get(emails[0]);
    out.push([name, ...emails.sort()]);
  }
  out.sort((a, b) => a[1].localeCompare(b[1]));
  return out;
};

ref.validTree = (n, edges) => {
  if (edges.length !== n - 1) return false;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const [a, b] of edges) {
    const ra = find(a), rb = find(b);
    if (ra === rb) return false;
    parent[ra] = rb;
  }
  return true;
};

ref.longestConsecutive = (nums) => {
  const set = new Set(nums);
  let best = 0;
  for (const x of set) {
    if (!set.has(x - 1)) {
      let cur = x, len = 1;
      while (set.has(cur + 1)) { cur++; len++; }
      best = Math.max(best, len);
    }
  }
  return best;
};

ref.makeConnected = (n, connections) => {
  if (connections.length < n - 1) return -1;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const [a, b] of connections) parent[find(a)] = find(b);
  const roots = new Set();
  for (let i = 0; i < n; i++) roots.add(find(i));
  return roots.size - 1;
};

ref.subarraySum = (nums, k) => {
  const map = new Map([[0, 1]]);
  let sum = 0, count = 0;
  for (const x of nums) {
    sum += x;
    count += map.get(sum - k) || 0;
    map.set(sum, (map.get(sum) || 0) + 1);
  }
  return count;
};

ref.isHappy = (n) => {
  const seen = new Set();
  while (n !== 1 && !seen.has(n)) {
    seen.add(n);
    n = String(n).split("").reduce((acc, d) => acc + (+d) * (+d), 0);
  }
  return n === 1;
};

const buildTree = (arr) => {
  if (!arr || arr.length === 0) return null;
  const root = { val: arr[0], left: null, right: null };
  const q = [root];
  let i = 1;
  while (q.length && i < arr.length) {
    const node = q.shift();
    if (arr[i] !== null && arr[i] !== undefined) { node.left = { val: arr[i], left: null, right: null }; q.push(node.left); }
    i++;
    if (i < arr.length && arr[i] !== null && arr[i] !== undefined) { node.right = { val: arr[i], left: null, right: null }; q.push(node.right); }
    i++;
  }
  return root;
};

ref.kthSmallestBST = (root, k) => {
  const stack = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.left; }
    cur = stack.pop();
    if (--k === 0) return cur.val;
    cur = cur.right;
  }
  return -1;
};

ref.rightSideView = (root) => {
  const out = [];
  const dfs = (node, depth) => {
    if (!node) return;
    if (out.length === depth) out.push(node.val);
    dfs(node.right, depth + 1);
    dfs(node.left, depth + 1);
  };
  dfs(root, 0);
  return out;
};

ref.zigzagLevelOrder = (root) => {
  if (!root) return [];
  const out = [];
  let q = [root];
  let ltr = true;
  while (q.length) {
    const vals = q.map((n) => n.val);
    out.push(ltr ? vals : vals.reverse());
    const next = [];
    for (const n of q) {
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    q = next;
    ltr = !ltr;
  }
  return out;
};

ref.isMatch = (s, p) => {
  const memo = new Map();
  const dp = (i, j) => {
    const key = i + "," + j;
    if (memo.has(key)) return memo.get(key);
    let res;
    if (j === p.length) res = i === s.length;
    else {
      const firstMatch = i < s.length && (s[i] === p[j] || p[j] === ".");
      if (j + 1 < p.length && p[j + 1] === "*") {
        res = dp(i, j + 2) || (firstMatch && dp(i + 1, j));
      } else {
        res = firstMatch && dp(i + 1, j + 1);
      }
    }
    memo.set(key, res);
    return res;
  };
  return dp(0, 0);
};

ref.change = (amount, coins) => {
  const dp = Array(amount + 1).fill(0);
  dp[0] = 1;
  for (const coin of coins) for (let a = coin; a <= amount; a++) dp[a] += dp[a - coin];
  return dp[amount];
};

ref.findPeakElement = (nums) => nums.indexOf(Math.max(...nums));

ref.searchRange = (nums, target) => {
  const find = (leftmost) => {
    let lo = 0, hi = nums.length - 1, ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (nums[mid] === target) {
        ans = mid;
        if (leftmost) hi = mid - 1; else lo = mid + 1;
      } else if (nums[mid] < target) lo = mid + 1;
      else hi = mid - 1;
    }
    return ans;
  };
  return [find(true), find(false)];
};

// Independent brute-force longestOnes for cross-checking the sliding window.
ref.longestOnesBrute = (nums, k) => {
  let best = 0;
  for (let i = 0; i < nums.length; i++) {
    let zeros = 0;
    for (let j = i; j < nums.length; j++) {
      if (nums[j] === 0) zeros++;
      if (zeros > k) break;
      best = Math.max(best, j - i + 1);
    }
  }
  return best;
};

ref.decodeString = (s) => {
  const stack = [];
  let cur = "", num = 0;
  for (const ch of s) {
    if (/\d/.test(ch)) num = num * 10 + +ch;
    else if (ch === "[") { stack.push([cur, num]); cur = ""; num = 0; }
    else if (ch === "]") {
      const [prev, n] = stack.pop();
      cur = prev + cur.repeat(n);
    } else cur += ch;
  }
  return cur;
};

ref.largestRectangleArea = (heights) => {
  const stack = [];
  let max = 0;
  for (let i = 0; i <= heights.length; i++) {
    const h = i === heights.length ? 0 : heights[i];
    while (stack.length && heights[stack[stack.length - 1]] > h) {
      const height = heights[stack.pop()];
      const width = stack.length ? i - stack[stack.length - 1] - 1 : i;
      max = Math.max(max, height * width);
    }
    stack.push(i);
  }
  return max;
};

ref.longestOnes = (nums, k) => {
  let left = 0, zeros = 0, best = 0;
  for (let right = 0; right < nums.length; right++) {
    if (nums[right] === 0) zeros++;
    while (zeros > k) { if (nums[left] === 0) zeros--; left++; }
    best = Math.max(best, right - left + 1);
  }
  return best;
};

ref.eraseOverlapIntervals = (intervals) => {
  if (!intervals.length) return 0;
  intervals = [...intervals].sort((a, b) => a[1] - b[1]);
  let count = 0, prevEnd = intervals[0][1];
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < prevEnd) count++;
    else prevEnd = intervals[i][1];
  }
  return count;
};

const buildList = (arr) => {
  if (!arr.length) return null;
  const head = { val: arr[0], next: null };
  let cur = head;
  for (let i = 1; i < arr.length; i++) { cur.next = { val: arr[i], next: null }; cur = cur.next; }
  return head;
};

ref.rotateRight = (head, k) => {
  if (!head || !head.next) return head;
  let len = 1, tail = head;
  while (tail.next) { tail = tail.next; len++; }
  tail.next = head;
  k = k % len;
  let steps = len - k;
  let newTail = head;
  while (--steps) newTail = newTail.next;
  const newHead = newTail.next;
  newTail.next = null;
  return newHead;
};

ref.romanToInt = (s) => {
  const vals = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    if (i + 1 < s.length && vals[s[i]] < vals[s[i + 1]]) total -= vals[s[i]];
    else total += vals[s[i]];
  }
  return total;
};

// ---------- Runner ----------
console.log("Expansion questions found:", expansion.length);

let failures = 0;
for (const q of expansion) {
  const fn = ref[q.functionName];
  if (!fn) {
    console.log("⚠ NO REFERENCE for", q.functionName);
    failures++;
    continue;
  }
  let passed = 0;
  for (const tc of q.testCases) {
    let actual;
    const converted = tc.input.map((v, i) => {
      const t = (q.argTypes || [])[i];
      if (t === "tree") return buildTree(v);
      if (t === "listnode") return buildList(v);
      return v;
    });
    try {
      actual = fn(...converted);
    } catch (e) {
      console.log("❌", q.functionName, "THREW:", e.message, JSON.stringify(tc.input));
      failures++;
      continue;
    }
    const ser = (v) => {
      if (v && typeof v === "object" && typeof v.val === "number" && v.next !== undefined) {
        const arr = [];
        let cur = v;
        let guard = 0;
        while (cur && guard++ < 1000) { arr.push(cur.val); cur = cur.next; }
        return JSON.stringify(arr);
      }
      return JSON.stringify(v);
    };
    // Cross-check longestOnes against brute force.
    if (q.functionName === "longestOnes") {
      for (const tc of q.testCases) {
        const brute = ref.longestOnesBrute(...tc.input);
        const window = ref.longestOnes(...tc.input);
        if (brute !== window) {
          console.log("⚠ REFERENCE BUG? window", window, "brute", brute, JSON.stringify(tc.input));
        }
      }
    }
    const ok = ser(actual) === ser(tc.expected);
    if (!ok) {
      failures++;
      console.log("❌ MISMATCH", q.functionName, "\n   input   :", JSON.stringify(tc.input), "\n   expected:", JSON.stringify(tc.expected), "\n   actual  :", ser(actual));
    } else passed++;
  }
  console.log(`${passed}/${q.testCases.length} PASS  ${q.functionName}`);
}

console.log(failures ? `\n${failures} FAILURES` : "\nALL TEST CASES VERIFIED ✓");
