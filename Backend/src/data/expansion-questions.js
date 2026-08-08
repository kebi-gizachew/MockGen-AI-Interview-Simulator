/**
 * Expanded multi-company question bank.
 *
 * Adds ~26 well-known interview problems to the seed library, explicitly
 * covering BFS / DFS topics and strengthening Heap, Queue, Union Find and the
 * smaller company pools. Every question declares `companies` (all companies
 * known to ask it, primary first) and `roles` (interview role relevance).
 *
 * Note: questions with tree/list inputs use argTypes so the execution harness
 * can build the structures from the JSON test cases.
 */
const { makeStarter } = require("./questions/_starter");

const ROLES = {
  intern: "Software Engineer Intern",
  backend: "Backend Engineer",
  frontend: "Frontend Engineer",
  fullstack: "Full Stack Engineer",
  ml: "Machine Learning Engineer",
};

const TREE_NOTES = {
  jsNote: "// TreeNode is provided by the execution harness:\n//   function TreeNode(val, left, right) { this.val = val; this.left = left; this.right = right; }",
  tsNote: "// TreeNode is provided by the execution harness.",
  pyNote: "// TreeNode is provided by the execution harness:\n//   class TreeNode:\n//       def __init__(self, val=0, left=None, right=None): ...",
  javaNote: "// TreeNode is provided by the execution harness.",
  cppNote: "// TreeNode is provided by the execution harness.",
};

const LIST_NOTES = {
  jsNote: "// ListNode is provided by the execution harness:\n//   function ListNode(val, next) { this.val = val; this.next = next; }",
  tsNote: "// ListNode is provided by the execution harness.",
  pyNote: "// ListNode is provided by the execution harness:\n//   class ListNode:\n//       def __init__(self, val=0, next=None): ...",
  javaNote: "// ListNode is provided by the execution harness.",
  cppNote: "// ListNode is provided by the execution harness.",
};

module.exports = [
  {
    title: "Word Ladder",
    topic: "BFS",
    difficulty: "hard",
    companies: ["Amazon", "Meta", "Google", "Uber"],
    roles: [ROLES.backend, ROLES.fullstack, ROLES.ml],
    functionName: "wordLadder",
    description:
      "Given two words, beginWord and endWord, and a dictionary wordList, return the number of words in the shortest transformation sequence from beginWord to endWord, or 0 if no such sequence exists. Each adjacent pair in the sequence must differ by exactly one letter, every intermediate word must be in wordList. The endWord must be in wordList.",
    examples: [
      { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: "5" },
      { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]', output: "0" },
    ],
    constraints: ["1 <= beginWord.length <= 10", "wordList contains distinct lowercase English words.", "beginWord, endWord and wordList[i] all have the same length."],
    testCases: [
      { input: ["hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]], expected: 5 },
      { input: ["hit", "cog", ["hot", "dot", "dog", "lot", "log"]], expected: 0 },
      { input: ["a", "c", ["a", "b", "c"]], expected: 2 },
      { input: ["hot", "dog", ["hot", "dog", "dot"]], expected: 3 },
      { input: ["lost", "cost", ["most", "fist", "lost", "cost", "fish"]], expected: 2 },
    ],
    starterCode: makeStarter({ fnName: "wordLadder", jsSig: "function wordLadder(beginWord, endWord, wordList)", tsSig: "function wordLadder(beginWord: string, endWord: string, wordList: string[]): number", pySig: "def word_ladder(begin_word: str, end_word: str, word_list: list[str]) -> int", javaSig: "public int wordLadder(String beginWord, String endWord, String[] wordList)", javaReturn: "0", cppSig: "int wordLadder(string beginWord, string endWord, vector<string>& wordList)", cppReturn: "0" }),
  },
  {
    title: "Shortest Path in Binary Matrix",
    topic: "BFS",
    difficulty: "medium",
    companies: ["Amazon", "Google", "Microsoft"],
    roles: [ROLES.backend, ROLES.fullstack, ROLES.ml],
    functionName: "shortestPathBinaryMatrix",
    description:
      "Given an n x n binary matrix grid, return the length of the shortest clear path in the matrix. A clear path is a path from the top-left cell (0,0) to the bottom-right cell (n-1,n-1) that visits only cells with value 0 and moves in 8 directions (including diagonals). You can visit each cell at most once. Return -1 if no clear path exists.",
    examples: [
      { input: "grid = [[0,1],[1,0]]", output: "2" },
      { input: "grid = [[0,0,0],[1,1,0],[1,1,0]]", output: "4" },
    ],
    constraints: ["1 <= grid.length <= 100", "grid[i].length == grid.length", "grid[i][j] is 0 or 1."],
    testCases: [
      { input: [[[0, 1], [1, 0]]], expected: 2 },
      { input: [[[0, 0, 0], [1, 1, 0], [1, 1, 0]]], expected: 4 },
      { input: [[[1, 0, 0], [1, 1, 0], [1, 1, 0]]], expected: -1 },
      { input: [[[0]]], expected: 1 },
      { input: [[[0, 0, 0], [0, 1, 0], [0, 0, 0]]], expected: 4 },
    ],
    starterCode: makeStarter({ fnName: "shortestPathBinaryMatrix", jsSig: "function shortestPathBinaryMatrix(grid)", tsSig: "function shortestPathBinaryMatrix(grid: number[][]): number", pySig: "def shortest_path_binary_matrix(grid: list[list[int]]) -> int", javaSig: "public int shortestPathBinaryMatrix(int[][] grid)", javaReturn: "0", cppSig: "int shortestPathBinaryMatrix(vector<vector<int>>& grid)", cppReturn: "0" }),
  },
  {
    title: "Pacific Atlantic Water Flow",
    topic: "DFS",
    difficulty: "medium",
    companies: ["Google", "Meta", "Amazon"],
    roles: [ROLES.backend, ROLES.fullstack, ROLES.ml],
    functionName: "pacificAtlantic",
    description:
      "There is an m x n rectangular island that borders both the Pacific Ocean (top and left edges) and the Atlantic Ocean (bottom and right edges). Rain water can flow to neighboring cells (up, down, left, right) only if the neighbor's height is less than or equal to the current cell's height. Return a list of [row, col] cells where rain water can flow to BOTH oceans, ordered row-major (by row, then column).",
    examples: [
      { input: "heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]", output: "[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]" },
      { input: "heights = [[1]]", output: "[[0,0]]" },
    ],
    constraints: ["1 <= m, n <= 200", "0 <= heights[r][c] <= 10^5"],
    testCases: [
      { input: [[[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]]], expected: [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]] },
      { input: [[[1]]], expected: [[0, 0]] },
      { input: [[[1, 2, 3], [8, 9, 4], [7, 6, 5]]], expected: [[0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]] },
      { input: [[[1, 2], [3, 4]]], expected: [[0, 1], [1, 0], [1, 1]] },
      { input: [[[2, 1], [1, 2]]], expected: [[0, 0], [0, 1], [1, 0], [1, 1]] },
    ],
    starterCode: makeStarter({ fnName: "pacificAtlantic", jsSig: "function pacificAtlantic(heights)", tsSig: "function pacificAtlantic(heights: number[][]): number[][]", pySig: "def pacific_atlantic(heights: list[list[int]]) -> list[list[int]]", javaSig: "public int[][] pacificAtlantic(int[][] heights)", javaReturn: "new int[0][0]", cppSig: "vector<vector<int>> pacificAtlantic(vector<vector<int>>& heights)", cppReturn: "{}" }),
  },
  {
    title: "Top K Frequent Words",
    topic: "Heap",
    difficulty: "medium",
    companies: ["Meta", "Google", "Amazon"],
    roles: [ROLES.backend, ROLES.fullstack],
    functionName: "topKFrequentWords",
    description:
      "Given an array of strings words and an integer k, return the k most frequent strings. Return the answer sorted by frequency from highest to lowest; when two words have the same frequency, the lexicographically smaller word comes first.",
    examples: [
      { input: 'words = ["i","love","leetcode","i","love","coding"], k = 2', output: '["i","love"]' },
      { input: 'words = ["the","day","is","sunny","the","the","the","sunny","is","is"], k = 4', output: '["the","is","sunny","day"]' },
    ],
    constraints: ["1 <= words.length <= 500", "1 <= words[i].length <= 10", "1 <= k <= number of unique words"],
    testCases: [
      { input: [["i", "love", "leetcode", "i", "love", "coding"], 2], expected: ["i", "love"] },
      { input: [["the", "day", "is", "sunny", "the", "the", "the", "sunny", "is", "is"], 4], expected: ["the", "is", "sunny", "day"] },
      { input: [["a", "a", "b", "b", "c"], 2], expected: ["a", "b"] },
      { input: [["a"], 1], expected: ["a"] },
      { input: [["x", "y", "x", "z", "z", "z"], 2], expected: ["z", "x"] },
    ],
    starterCode: makeStarter({ fnName: "topKFrequentWords", jsSig: "function topKFrequentWords(words, k)", tsSig: "function topKFrequentWords(words: string[], k: number): string[]", pySig: "def top_k_frequent_words(words: list[str], k: int) -> list[str]", javaSig: "public String[] topKFrequentWords(String[] words, int k)", javaReturn: "new String[0]", cppSig: "vector<string> topKFrequentWords(vector<string>& words, int k)", cppReturn: "{}" }),
  },
  {
    title: "Kth Smallest Element in a Sorted Matrix",
    topic: "Heap",
    difficulty: "medium",
    companies: ["Meta", "Microsoft", "Amazon"],
    roles: [ROLES.backend, ROLES.fullstack],
    functionName: "kthSmallest",
    description:
      "Given an n x n matrix where each row and column is sorted in ascending order, return the kth smallest element in the matrix. Note it is the kth smallest element in the sorted order, not the kth distinct element.",
    examples: [
      { input: "matrix = [[1,5,9],[10,11,13],[12,13,15]], k = 8", output: "13" },
      { input: "matrix = [[-5]], k = 1", output: "-5" },
    ],
    constraints: ["n == matrix.length == matrix[i].length", "1 <= n <= 300", "1 <= k <= n^2", "-10^9 <= matrix[i][j] <= 10^9"],
    testCases: [
      { input: [[[1, 5, 9], [10, 11, 13], [12, 13, 15]], 8], expected: 13 },
      { input: [[[-5]], 1], expected: -5 },
      { input: [[[1, 2], [1, 3]], 2], expected: 1 },
      { input: [[[1, 2, 3], [2, 3, 4], [3, 4, 5]], 5], expected: 3 },
      { input: [[[1, 10, 20], [2, 11, 21], [3, 12, 22]], 4], expected: 10 },
    ],
    starterCode: makeStarter({ fnName: "kthSmallest", jsSig: "function kthSmallest(matrix, k)", tsSig: "function kthSmallest(matrix: number[][], k: number): number", pySig: "def kth_smallest(matrix: list[list[int]], k: int) -> int", javaSig: "public int kthSmallest(int[][] matrix, int k)", javaReturn: "0", cppSig: "int kthSmallest(vector<vector<int>>& matrix, int k)", cppReturn: "0" }),
  },
  {
    title: "Sort Characters by Frequency",
    topic: "Heap",
    difficulty: "medium",
    companies: ["Microsoft", "Amazon", "Google", "Meta"],
    roles: [ROLES.backend, ROLES.frontend, ROLES.fullstack],
    functionName: "frequencySort",
    description:
      "Given a string s, sort it in decreasing order based on the frequency of the characters. When two characters have the same frequency, the character that appears earlier in s comes first. Return the sorted string.",
    examples: [
      { input: 's = "tree"', output: '"eetr"' },
      { input: 's = "cccaaa"', output: '"cccaaa"' },
    ],
    constraints: ["1 <= s.length <= 5 * 10^5", "s consists of uppercase and lowercase English letters and digits."],
    testCases: [
      { input: ["tree"], expected: "eetr" },
      { input: ["cccaaa"], expected: "cccaaa" },
      { input: ["Aabb"], expected: "bbAa" },
      { input: ["loveleetcode"], expected: "eeeelloovtcd" },
      { input: ["a"], expected: "a" },
    ],
    starterCode: makeStarter({ fnName: "frequencySort", jsSig: "function frequencySort(s)", tsSig: "function frequencySort(s: string): string", pySig: "def frequency_sort(s: str) -> str", javaSig: "public String frequencySort(String s)", javaReturn: "\"\"", cppSig: "string frequencySort(string s)", cppReturn: "\"\"" }),
  },
  {
    title: "Dota2 Senate",
    topic: "Queue",
    difficulty: "medium",
    companies: ["OpenAI", "Google", "Uber"],
    roles: [ROLES.backend, ROLES.fullstack],
    functionName: "predictPartyVictory",
    description:
      "In the world of Dota2, there are two parties: the Radiant and the Dire. Given a string senate where 'R' is Radiant and 'D' is Dire, in each round each senator can exercise one of two rights: Ban the next senator's right to vote, or Announce victory. Each senator votes in order, and banned senators are skipped. Return the party that will announce the victory: \"Radiant\" or \"Dire\".",
    examples: [
      { input: 'senate = "RD"', output: '"Radiant"' },
      { input: 'senate = "RDD"', output: '"Dire"' },
    ],
    constraints: ["1 <= senate.length <= 10^4", "senate[i] is 'R' or 'D'"],
    testCases: [
      { input: ["RD"], expected: "Radiant" },
      { input: ["RDD"], expected: "Dire" },
      { input: ["RRR"], expected: "Radiant" },
      { input: ["DDD"], expected: "Dire" },
      { input: ["DDRRR"], expected: "Dire" },
      { input: ["RDDR"], expected: "Radiant" },
    ],
    starterCode: makeStarter({ fnName: "predictPartyVictory", jsSig: "function predictPartyVictory(senate)", tsSig: "function predictPartyVictory(senate: string): string", pySig: "def predict_party_victory(senate: str) -> str", javaSig: "public String predictPartyVictory(String senate)", javaReturn: "\"\"", cppSig: "string predictPartyVictory(string senate)", cppReturn: "\"\"" }),
  },
  {
    title: "Accounts Merge",
    topic: "Union Find",
    difficulty: "medium",
    companies: ["Amazon", "Google", "Meta"],
    roles: [ROLES.backend, ROLES.fullstack],
    functionName: "mergeAccounts",
    description:
      "Given a list of accounts where each element accounts[i] is a list of strings: the first element is the name, and the rest are emails. Two accounts belong to the same person if they share at least one email. Return the merged accounts: each account is [name, ...emails] with emails sorted in ascending order, and the accounts are ordered by their first email in ascending order.",
    examples: [
      { input: 'accounts = [["John","johnsmith@mail.com","john_newyork@mail.com"],["John","johnsmith@mail.com","john00@mail.com"],["Mary","mary@mail.com"],["John","johnnybravo@mail.com"]]', output: '[["John","john00@mail.com","john_newyork@mail.com","johnsmith@mail.com"],["John","johnnybravo@mail.com"],["Mary","mary@mail.com"]]' },
    ],
    constraints: ["1 <= accounts.length <= 1000", "2 <= accounts[i].length <= 10", "accounts[i][0] is a name, remaining elements are valid emails."],
    testCases: [
      {
        input: [[["John", "johnsmith@mail.com", "john_newyork@mail.com"], ["John", "johnsmith@mail.com", "john00@mail.com"], ["Mary", "mary@mail.com"], ["John", "johnnybravo@mail.com"]]],
        expected: [["John", "john00@mail.com", "john_newyork@mail.com", "johnsmith@mail.com"], ["John", "johnnybravo@mail.com"], ["Mary", "mary@mail.com"]],
      },
      {
        input: [[["Gabe", "Gabe0@m.co", "Gabe3@m.co", "Gabe1@m.co"], ["Kevin", "Kevin3@m.co", "Kevin5@m.co", "Kevin0@m.co"], ["Ethan", "Ethan5@m.co", "Ethan4@m.co", "Ethan0@m.co"], ["Hanzo", "Hanzo3@m.co", "Hanzo1@m.co", "Hanzo0@m.co"], ["Fern", "Fern5@m.co", "Fern1@m.co", "Fern0@m.co"]]],
        expected: [["Ethan", "Ethan0@m.co", "Ethan4@m.co", "Ethan5@m.co"], ["Fern", "Fern0@m.co", "Fern1@m.co", "Fern5@m.co"], ["Gabe", "Gabe0@m.co", "Gabe1@m.co", "Gabe3@m.co"], ["Hanzo", "Hanzo0@m.co", "Hanzo1@m.co", "Hanzo3@m.co"], ["Kevin", "Kevin0@m.co", "Kevin3@m.co", "Kevin5@m.co"]],
      },
      {
        input: [[["a", "a@m.co", "b@m.co"], ["a", "b@m.co", "c@m.co"]]],
        expected: [["a", "a@m.co", "b@m.co", "c@m.co"]],
      },
      { input: [[["x", "x@m.co"]]], expected: [["x", "x@m.co"]] },
    ],
    starterCode: makeStarter({ fnName: "mergeAccounts", jsSig: "function mergeAccounts(accounts)", tsSig: "function mergeAccounts(accounts: string[][]): string[][]", pySig: "def merge_accounts(accounts: list[list[str]]) -> list[list[str]]", javaSig: "public String[][] mergeAccounts(String[][] accounts)", javaReturn: "new String[0][0]", cppSig: "vector<vector<string>> mergeAccounts(vector<vector<string>>& accounts)", cppReturn: "{}" }),
  },
  {
    title: "Graph Valid Tree",
    topic: "Union Find",
    difficulty: "medium",
    companies: ["Google", "Amazon", "Uber", "Airbnb"],
    roles: [ROLES.backend, ROLES.fullstack, ROLES.ml],
    functionName: "validTree",
    description:
      "Given n nodes labeled from 0 to n - 1 and a list of undirected edges (each edge is a pair of nodes), write a function to check whether these edges make up a valid tree. A valid tree must be fully connected and contain no cycles.",
    examples: [
      { input: "n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]", output: "true" },
      { input: "n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]", output: "false" },
    ],
    constraints: ["1 <= n <= 2000", "0 <= edges.length <= 5000"],
    testCases: [
      { input: [5, [[0, 1], [0, 2], [0, 3], [1, 4]]], expected: true },
      { input: [5, [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]]], expected: false },
      { input: [4, [[0, 1], [2, 3]]], expected: false },
      { input: [1, []], expected: true },
      { input: [3, [[0, 1], [1, 2], [0, 2]]], expected: false },
    ],
    starterCode: makeStarter({ fnName: "validTree", jsSig: "function validTree(n, edges)", tsSig: "function validTree(n: number, edges: number[][]): boolean", pySig: "def valid_tree(n: int, edges: list[list[int]]) -> bool", javaSig: "public boolean validTree(int n, int[][] edges)", javaReturn: "false", cppSig: "bool validTree(int n, vector<vector<int>>& edges)", cppReturn: "false" }),
  },
  {
    title: "Longest Consecutive Sequence",
    topic: "Union Find",
    difficulty: "medium",
    companies: ["Google", "Amazon", "Microsoft", "Netflix", "Uber"],
    roles: [ROLES.backend, ROLES.fullstack, ROLES.ml],
    functionName: "longestConsecutive",
    description:
      "Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence. You must write an algorithm that runs in O(n) time.",
    examples: [
      { input: "nums = [100,4,200,1,3,2]", output: "4" },
      { input: "nums = [0,3,7,2,5,8,4,6,0,1]", output: "9" },
    ],
    constraints: ["0 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    testCases: [
      { input: [[100, 4, 200, 1, 3, 2]], expected: 4 },
      { input: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], expected: 9 },
      { input: [[]], expected: 0 },
      { input: [[1, 2, 0, 1]], expected: 3 },
      { input: [[1]], expected: 1 },
    ],
    starterCode: makeStarter({ fnName: "longestConsecutive", jsSig: "function longestConsecutive(nums)", tsSig: "function longestConsecutive(nums: number[]): number", pySig: "def longest_consecutive(nums: list[int]) -> int", javaSig: "public int longestConsecutive(int[] nums)", javaReturn: "0", cppSig: "int longestConsecutive(vector<int>& nums)", cppReturn: "0" }),
  },
  {
    title: "Number of Operations to Make Network Connected",
    topic: "Union Find",
    difficulty: "medium",
    companies: ["Microsoft", "Google", "Amazon"],
    roles: [ROLES.backend, ROLES.fullstack, ROLES.ml],
    functionName: "makeConnected",
    description:
      "There are n computers numbered from 0 to n - 1 connected by ethernet cables connections forming a network where connections[i] = [a, b] represents a cable between computers a and b. You are allowed to disconnect any cable and reconnect it to another pair of computers. Return the minimum number of times you can do this to make all computers connected, or -1 if it is impossible.",
    examples: [
      { input: "n = 4, connections = [[0,1],[0,2],[1,2]]", output: "1" },
      { input: "n = 6, connections = [[0,1],[0,2],[0,3],[1,2],[1,3]]", output: "2" },
    ],
    constraints: ["1 <= n <= 10^5", "0 <= connections.length <= min(10^5, n * (n-1) / 2)"],
    testCases: [
      { input: [4, [[0, 1], [0, 2], [1, 2]]], expected: 1 },
      { input: [6, [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3]]], expected: 2 },
      { input: [6, [[0, 1], [0, 2], [0, 3], [1, 2]]], expected: -1 },
      { input: [1, []], expected: 0 },
      { input: [5, [[0, 1], [1, 2], [2, 3], [3, 4]]], expected: 0 },
    ],
    starterCode: makeStarter({ fnName: "makeConnected", jsSig: "function makeConnected(n, connections)", tsSig: "function makeConnected(n: number, connections: number[][]): number", pySig: "def make_connected(n: int, connections: list[list[int]]) -> int", javaSig: "public int makeConnected(int n, int[][] connections)", javaReturn: "0", cppSig: "int makeConnected(int n, vector<vector<int>>& connections)", cppReturn: "0" }),
  },
  {
    title: "Subarray Sum Equals K",
    topic: "Arrays & Hashing",
    difficulty: "medium",
    companies: ["Google", "Amazon", "Meta", "Microsoft"],
    roles: [ROLES.backend, ROLES.fullstack, ROLES.ml],
    functionName: "subarraySum",
    description:
      "Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals k. A subarray is a contiguous, non-empty sequence of elements within an array.",
    examples: [
      { input: "nums = [1,1,1], k = 2", output: "2" },
      { input: "nums = [1,2,3], k = 3", output: "2" },
    ],
    constraints: ["1 <= nums.length <= 2 * 10^4", "-1000 <= nums[i] <= 1000", "-10^7 <= k <= 10^7"],
    testCases: [
      { input: [[1, 1, 1], 2], expected: 2 },
      { input: [[1, 2, 3], 3], expected: 2 },
      { input: [[1, -1, 0], 0], expected: 3 },
      { input: [[3, 4, 7, 2, -3, 1, 4, 2], 7], expected: 4 },
      { input: [[1], 0], expected: 0 },
    ],
    starterCode: makeStarter({ fnName: "subarraySum", jsSig: "function subarraySum(nums, k)", tsSig: "function subarraySum(nums: number[], k: number): number", pySig: "def subarray_sum(nums: list[int], k: int) -> int", javaSig: "public int subarraySum(int[] nums, int k)", javaReturn: "0", cppSig: "int subarraySum(vector<int>& nums, int k)", cppReturn: "0" }),
  },
  {
    title: "Happy Number",
    topic: "Arrays & Hashing",
    difficulty: "easy",
    companies: ["Meta", "Google", "Amazon"],
    roles: [ROLES.intern, ROLES.backend, ROLES.frontend, ROLES.fullstack],
    functionName: "isHappy",
    description:
      "Write an algorithm to determine if a number n is happy. A happy number is a number defined by the following process: starting with any positive integer, replace the number by the sum of the squares of its digits, and repeat until the number equals 1 (where it will stay), or it loops endlessly in a cycle which does not include 1. Return true if n is a happy number.",
    examples: [
      { input: "n = 19", output: "true" },
      { input: "n = 2", output: "false" },
    ],
    constraints: ["1 <= n <= 2^31 - 1"],
    testCases: [
      { input: [19], expected: true },
      { input: [2], expected: false },
      { input: [1], expected: true },
      { input: [7], expected: true },
      { input: [20], expected: false },
    ],
    starterCode: makeStarter({ fnName: "isHappy", jsSig: "function isHappy(n)", tsSig: "function isHappy(n: number): boolean", pySig: "def is_happy(n: int) -> bool", javaSig: "public boolean isHappy(int n)", javaReturn: "false", cppSig: "bool isHappy(int n)", cppReturn: "false" }),
  },
  {
    title: "Kth Smallest Element in a BST",
    topic: "Trees",
    difficulty: "medium",
    companies: ["Google", "Amazon", "Meta", "Microsoft", "Apple"],
    roles: [ROLES.backend, ROLES.fullstack, ROLES.frontend],
    functionName: "kthSmallestBST",
    argTypes: ["tree", "int"],
    description:
      "Given the root of a binary search tree, and an integer k, return the kth smallest value (1-indexed) of all the values of the nodes in the tree. The root is provided as a level-order array where null marks a missing child.",
    examples: [
      { input: "root = [3,1,4,null,2], k = 1", output: "1" },
      { input: "root = [5,3,6,2,4,null,null,1], k = 3", output: "3" },
    ],
    constraints: ["The number of nodes is in the range [1, 10^4].", "0 <= Node.val <= 10^4", "1 <= k <= number of nodes"],
    testCases: [
      { input: [[3, 1, 4, null, 2], 1], expected: 1 },
      { input: [[5, 3, 6, 2, 4, null, null, 1], 3], expected: 3 },
      { input: [[2, 1], 2], expected: 2 },
      { input: [[1], 1], expected: 1 },
      { input: [[5, 3, 6, 2, 4, null, null, 1], 5], expected: 5 },
    ],
    starterCode: makeStarter({ fnName: "kthSmallestBST", jsSig: "function kthSmallestBST(root, k)", tsSig: "function kthSmallestBST(root: TreeNode | null, k: number): number", pySig: "def kth_smallest_bst(root: Optional[TreeNode], k: int) -> int", javaSig: "public int kthSmallestBST(TreeNode root, int k)", javaReturn: "0", cppSig: "int kthSmallestBST(TreeNode* root, int k)", cppReturn: "0", ...TREE_NOTES }),
  },
  {
    title: "Binary Tree Right Side View",
    topic: "Trees",
    difficulty: "medium",
    companies: ["Amazon", "Meta", "Microsoft"],
    roles: [ROLES.backend, ROLES.fullstack, ROLES.frontend],
    functionName: "rightSideView",
    argTypes: ["tree"],
    description:
      "Given the root of a binary tree, imagine yourself standing on the right side of it, return the values of the nodes you can see ordered from top to bottom. The root is provided as a level-order array where null marks a missing child.",
    examples: [
      { input: "root = [1,2,3,null,5,null,4]", output: "[1,3,4]" },
      { input: "root = [1,null,3]", output: "[1,3]" },
    ],
    constraints: ["The number of nodes is in the range [0, 100].", "-100 <= Node.val <= 100"],
    testCases: [
      { input: [[1, 2, 3, null, 5, null, 4]], expected: [1, 3, 4] },
      { input: [[1, null, 3]], expected: [1, 3] },
      { input: [[]], expected: [] },
      { input: [[1, 2, 3, 4]], expected: [1, 3, 4] },
      { input: [[1, 2, 3, null, 4]], expected: [1, 3, 4] },
    ],
    starterCode: makeStarter({ fnName: "rightSideView", jsSig: "function rightSideView(root)", tsSig: "function rightSideView(root: TreeNode | null): number[]", pySig: "def right_side_view(root: Optional[TreeNode]) -> list[int]", javaSig: "public int[] rightSideView(TreeNode root)", javaReturn: "new int[0]", cppSig: "vector<int> rightSideView(TreeNode* root)", cppReturn: "{}", ...TREE_NOTES }),
  },
  {
    title: "Binary Tree Zigzag Level Order Traversal",
    topic: "Trees",
    difficulty: "medium",
    companies: ["Amazon", "Meta", "Microsoft", "Google"],
    roles: [ROLES.backend, ROLES.fullstack, ROLES.frontend],
    functionName: "zigzagLevelOrder",
    argTypes: ["tree"],
    description:
      "Given the root of a binary tree, return the zigzag level order traversal of its nodes' values: level 0 left-to-right, level 1 right-to-left, and so on, alternating. The root is provided as a level-order array where null marks a missing child.",
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "[[3],[20,9],[15,7]]" },
      { input: "root = [1]", output: "[[1]]" },
    ],
    constraints: ["The number of nodes is in the range [0, 2000].", "-100 <= Node.val <= 100"],
    testCases: [
      { input: [[3, 9, 20, null, null, 15, 7]], expected: [[3], [20, 9], [15, 7]] },
      { input: [[1]], expected: [[1]] },
      { input: [[]], expected: [] },
      { input: [[1, 2, 3, 4, null, null, 5]], expected: [[1], [3, 2], [4, 5]] },
      { input: [[1, 2, 3, 4, 5]], expected: [[1], [3, 2], [4, 5]] },
    ],
    starterCode: makeStarter({ fnName: "zigzagLevelOrder", jsSig: "function zigzagLevelOrder(root)", tsSig: "function zigzagLevelOrder(root: TreeNode | null): number[][]", pySig: "def zigzag_level_order(root: Optional[TreeNode]) -> list[list[int]]", javaSig: "public List<List<Integer>> zigzagLevelOrder(TreeNode root)", javaReturn: "new ArrayList<>()", cppSig: "vector<vector<int>> zigzagLevelOrder(TreeNode* root)", cppReturn: "{}", ...TREE_NOTES }),
  },
  {
    title: "Regular Expression Matching",
    topic: "Dynamic Programming",
    difficulty: "hard",
    companies: ["Google", "Meta", "Amazon", "Microsoft"],
    roles: [ROLES.backend, ROLES.fullstack, ROLES.ml],
    functionName: "isMatch",
    description:
      "Given an input string s and a pattern p, implement regular expression matching with support for '.' (matches any single character) and '*' (matches zero or more of the preceding element). The matching should cover the entire input string (not partial). The '*' can only appear after a character, matching zero or more of that character.",
    examples: [
      { input: 's = "aa", p = "a"', output: "false" },
      { input: 's = "aa", p = "a*"', output: "true" },
      { input: 's = "ab", p = ".*"', output: "true" },
    ],
    constraints: ["1 <= s.length <= 20", "1 <= p.length <= 20", "s contains only lowercase English letters.", "p contains only lowercase English letters, '.' and '*'."],
    testCases: [
      { input: ["aa", "a"], expected: false },
      { input: ["aa", "a*"], expected: true },
      { input: ["ab", ".*"], expected: true },
      { input: ["aab", "c*a*b"], expected: true },
      { input: ["mississippi", "mis*is*p*."], expected: false },
      { input: ["", "a*"], expected: true },
    ],
    starterCode: makeStarter({ fnName: "isMatch", jsSig: "function isMatch(s, p)", tsSig: "function isMatch(s: string, p: string): boolean", pySig: "def is_match(s: str, p: str) -> bool", javaSig: "public boolean isMatch(String s, String p)", javaReturn: "false", cppSig: "bool isMatch(string s, string p)", cppReturn: "false" }),
  },
  {
    title: "Coin Change II",
    topic: "Dynamic Programming",
    difficulty: "medium",
    companies: ["Google", "Microsoft", "Meta", "Amazon"],
    roles: [ROLES.backend, ROLES.fullstack, ROLES.ml],
    functionName: "change",
    description:
      "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the number of combinations that make up that amount. If that amount of money cannot be made up by any combination of the coins, return 0. You may assume that you have an infinite number of each kind of coin.",
    examples: [
      { input: "amount = 5, coins = [1,2,5]", output: "4" },
      { input: "amount = 3, coins = [2]", output: "0" },
    ],
    constraints: ["1 <= coins.length <= 300", "1 <= coins[i] <= 5000", "0 <= amount <= 5000"],
    testCases: [
      { input: [5, [1, 2, 5]], expected: 4 },
      { input: [3, [2]], expected: 0 },
      { input: [10, [1, 2, 5]], expected: 10 },
      { input: [10, [10]], expected: 1 },
      { input: [0, [1]], expected: 1 },
    ],
    starterCode: makeStarter({ fnName: "change", jsSig: "function change(amount, coins)", tsSig: "function change(amount: number, coins: number[]): number", pySig: "def change(amount: int, coins: list[int]) -> int", javaSig: "public int change(int amount, int[] coins)", javaReturn: "0", cppSig: "int change(int amount, vector<int>& coins)", cppReturn: "0" }),
  },
  {
    title: "Find Peak Element",
    topic: "Binary Search",
    difficulty: "medium",
    companies: ["Google", "Amazon", "Meta"],
    roles: [ROLES.backend, ROLES.fullstack, ROLES.ml],
    functionName: "findPeakElement",
    description:
      "A peak element is an element that is strictly greater than its neighbors. Given a 0-indexed integer array nums, find a peak element, and return its index. The array may contain multiple peaks; return the index of the peak found by the search. You must write an algorithm that runs in O(log n) time.",
    examples: [
      { input: "nums = [1,2,3,1]", output: "2" },
      { input: "nums = [3,2,1]", output: "0" },
    ],
    constraints: ["1 <= nums.length <= 1000", "-2^31 <= nums[i] <= 2^31 - 1", "nums[i] != nums[i + 1] for all valid i"],
    testCases: [
      { input: [[1, 2, 3, 1]], expected: 2 },
      { input: [[3, 2, 1]], expected: 0 },
      { input: [[1, 2, 3]], expected: 2 },
      { input: [[1]], expected: 0 },
      { input: [[2, 1]], expected: 0 },
    ],
    starterCode: makeStarter({ fnName: "findPeakElement", jsSig: "function findPeakElement(nums)", tsSig: "function findPeakElement(nums: number[]): number", pySig: "def find_peak_element(nums: list[int]) -> int", javaSig: "public int findPeakElement(int[] nums)", javaReturn: "0", cppSig: "int findPeakElement(vector<int>& nums)", cppReturn: "0" }),
  },
  {
    title: "Find First and Last Position of Element in Sorted Array",
    topic: "Binary Search",
    difficulty: "medium",
    companies: ["Google", "Amazon", "Microsoft", "Meta"],
    roles: [ROLES.backend, ROLES.fullstack],
    functionName: "searchRange",
    description:
      "Given an array of integers nums sorted in non-decreasing order, find the starting and ending position of a given target value. If target is not found in the array, return [-1, -1]. You must write an algorithm with O(log n) runtime complexity.",
    examples: [
      { input: "nums = [5,7,7,8,8,10], target = 8", output: "[3,4]" },
      { input: "nums = [5,7,7,8,8,10], target = 6", output: "[-1,-1]" },
    ],
    constraints: ["0 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9", "nums is a non-decreasing array."],
    testCases: [
      { input: [[5, 7, 7, 8, 8, 10], 8], expected: [3, 4] },
      { input: [[5, 7, 7, 8, 8, 10], 6], expected: [-1, -1] },
      { input: [[], 0], expected: [-1, -1] },
      { input: [[1], 1], expected: [0, 0] },
      { input: [[2, 2], 2], expected: [0, 1] },
    ],
    starterCode: makeStarter({ fnName: "searchRange", jsSig: "function searchRange(nums, target)", tsSig: "function searchRange(nums: number[], target: number): number[]", pySig: "def search_range(nums: list[int], target: int) -> list[int]", javaSig: "public int[] searchRange(int[] nums, int target)", javaReturn: "new int[]{-1,-1}", cppSig: "vector<int> searchRange(vector<int>& nums, int target)", cppReturn: "{-1,-1}" }),
  },
  {
    title: "Decode String",
    topic: "Stack",
    difficulty: "medium",
    companies: ["Google", "Amazon", "Microsoft", "Meta", "Airbnb"],
    roles: [ROLES.backend, ROLES.frontend, ROLES.fullstack],
    functionName: "decodeString",
    description:
      "Given an encoded string, return its decoded string. The encoding rule is: k[encoded_string], where the encoded_string inside the square brackets is repeated exactly k times. k is guaranteed to be a positive integer. The input string is always valid: no extra white spaces, square brackets are well-formed, and digits only appear as the number of repeats. The input does not contain nested brackets more than 3 levels deep.",
    examples: [
      { input: 's = "3[a]2[bc]"', output: '"aaabcbc"' },
      { input: 's = "3[a2[c]]"', output: '"accaccacc"' },
      { input: 's = "2[abc]3[cd]ef"', output: '"abcabccdcdcdef"' },
    ],
    constraints: ["1 <= s.length <= 30", "s consists of lowercase English letters, digits, and square brackets."],
    testCases: [
      { input: ["3[a]2[bc]"], expected: "aaabcbc" },
      { input: ["3[a2[c]]"], expected: "accaccacc" },
      { input: ["2[abc]3[cd]ef"], expected: "abcabccdcdcdef" },
      { input: ["abc3[cd]xyz"], expected: "abccdcdcdxyz" },
      { input: ["2[b]"], expected: "bb" },
    ],
    starterCode: makeStarter({ fnName: "decodeString", jsSig: "function decodeString(s)", tsSig: "function decodeString(s: string): string", pySig: "def decode_string(s: str) -> str", javaSig: "public String decodeString(String s)", javaReturn: "\"\"", cppSig: "string decodeString(string s)", cppReturn: "\"\"" }),
  },
  {
    title: "Largest Rectangle in Histogram",
    topic: "Stack",
    difficulty: "hard",
    companies: ["Google", "Amazon", "Microsoft"],
    roles: [ROLES.backend, ROLES.fullstack],
    functionName: "largestRectangleArea",
    description:
      "Given an array of integers heights representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram.",
    examples: [
      { input: "heights = [2,1,5,6,2,3]", output: "10" },
      { input: "heights = [2,4]", output: "4" },
    ],
    constraints: ["1 <= heights.length <= 10^5", "0 <= heights[i] <= 10^4"],
    testCases: [
      { input: [[2, 1, 5, 6, 2, 3]], expected: 10 },
      { input: [[2, 4]], expected: 4 },
      { input: [[1]], expected: 1 },
      { input: [[2, 1, 2]], expected: 3 },
      { input: [[6, 2, 5, 4, 5, 1, 6]], expected: 12 },
    ],
    starterCode: makeStarter({ fnName: "largestRectangleArea", jsSig: "function largestRectangleArea(heights)", tsSig: "function largestRectangleArea(heights: number[]): number", pySig: "def largest_rectangle_area(heights: list[int]) -> int", javaSig: "public int largestRectangleArea(int[] heights)", javaReturn: "0", cppSig: "int largestRectangleArea(vector<int>& heights)", cppReturn: "0" }),
  },
  {
    title: "Max Consecutive Ones III",
    topic: "Sliding Window",
    difficulty: "medium",
    companies: ["Google", "Amazon", "Microsoft", "Uber"],
    roles: [ROLES.backend, ROLES.frontend, ROLES.fullstack],
    functionName: "longestOnes",
    description:
      "Given a binary array nums and an integer k, return the maximum number of consecutive 1's in the array if you can flip at most k 0's.",
    examples: [
      { input: "nums = [1,1,1,0,0,0,1,1,1,1,0], k = 2", output: "6" },
      { input: "nums = [0,0,1,1,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0], k = 3", output: "10" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "nums[i] is either 0 or 1.", "0 <= k <= nums.length"],
    testCases: [
      { input: [[1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2], expected: 6 },
      { input: [[0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0], 3], expected: 8 },
      { input: [[0, 0, 0, 1], 4], expected: 4 },
      { input: [[1, 1, 1], 0], expected: 3 },
      { input: [[0], 1], expected: 1 },
    ],
    starterCode: makeStarter({ fnName: "longestOnes", jsSig: "function longestOnes(nums, k)", tsSig: "function longestOnes(nums: number[], k: number): number", pySig: "def longest_ones(nums: list[int], k: int) -> int", javaSig: "public int longestOnes(int[] nums, int k)", javaReturn: "0", cppSig: "int longestOnes(vector<int>& nums, int k)", cppReturn: "0" }),
  },
  {
    title: "Non-overlapping Intervals",
    topic: "Greedy",
    difficulty: "medium",
    companies: ["Google", "Uber", "Meta", "Amazon"],
    roles: [ROLES.backend, ROLES.fullstack],
    functionName: "eraseOverlapIntervals",
    description:
      "Given an array of intervals where intervals[i] = [start_i, end_i], return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping. Two intervals [a,b] and [c,d] overlap if they share any point (endpoints touching, e.g. [1,2] and [2,3], do NOT count as overlapping).",
    examples: [
      { input: "intervals = [[1,2],[2,3],[3,4],[1,3]]", output: "1" },
      { input: "intervals = [[1,2],[1,2],[1,2]]", output: "2" },
    ],
    constraints: ["1 <= intervals.length <= 10^5", "intervals[i].length == 2", "-5 * 10^4 <= start_i < end_i <= 5 * 10^4"],
    testCases: [
      { input: [[[1, 2], [2, 3], [3, 4], [1, 3]]], expected: 1 },
      { input: [[[1, 2], [1, 2], [1, 2]]], expected: 2 },
      { input: [[[1, 2], [2, 3]]], expected: 0 },
      { input: [[[1, 100], [11, 22], [1, 11], [2, 12]]], expected: 2 },
      { input: [[]], expected: 0 },
    ],
    starterCode: makeStarter({ fnName: "eraseOverlapIntervals", jsSig: "function eraseOverlapIntervals(intervals)", tsSig: "function eraseOverlapIntervals(intervals: number[][]): number", pySig: "def erase_overlap_intervals(intervals: list[list[int]]) -> int", javaSig: "public int eraseOverlapIntervals(int[][] intervals)", javaReturn: "0", cppSig: "int eraseOverlapIntervals(vector<vector<int>>& intervals)", cppReturn: "0" }),
  },
  {
    title: "Rotate List",
    topic: "Linked Lists",
    difficulty: "medium",
    companies: ["Amazon", "Google", "Meta"],
    roles: [ROLES.backend, ROLES.fullstack],
    functionName: "rotateRight",
    argTypes: ["listnode", "int"],
    description:
      "Given the head of a linked list, rotate the list to the right by k places. The head is provided as a JSON array of node values; return the rotated list as an array of node values.",
    examples: [
      { input: "head = [1,2,3,4,5], k = 2", output: "[4,5,1,2,3]" },
      { input: "head = [0,1,2], k = 4", output: "[2,0,1]" },
    ],
    constraints: ["The number of nodes in the list is in the range [0, 500].", "-100 <= Node.val <= 100", "0 <= k <= 2 * 10^9"],
    testCases: [
      { input: [[1, 2, 3, 4, 5], 2], expected: [4, 5, 1, 2, 3] },
      { input: [[0, 1, 2], 4], expected: [2, 0, 1] },
      { input: [[], 0], expected: null },
      { input: [[1, 2, 3], 0], expected: [1, 2, 3] },
      { input: [[1], 1], expected: [1] },
    ],
    starterCode: makeStarter({ fnName: "rotateRight", jsSig: "function rotateRight(head, k)", tsSig: "function rotateRight(head: ListNode | null, k: number): ListNode | null", pySig: "def rotate_right(head: Optional[ListNode], k: int) -> Optional[ListNode]", javaSig: "public ListNode rotateRight(ListNode head, int k)", javaReturn: "null", cppSig: "ListNode* rotateRight(ListNode* head, int k)", cppReturn: "nullptr", ...LIST_NOTES }),
  },
  {
    title: "Roman to Integer",
    topic: "Strings",
    difficulty: "easy",
    companies: ["Amazon", "Google", "Meta", "Microsoft", "Apple"],
    roles: [ROLES.intern, ROLES.backend, ROLES.frontend, ROLES.fullstack],
    functionName: "romanToInt",
    description:
      "Roman numerals are represented by seven symbols: I (1), V (5), X (10), L (50), C (100), D (500), M (1000). Given a roman numeral s, convert it to an integer. When a smaller symbol appears before a larger one (e.g. IV), it is subtracted.",
    examples: [
      { input: 's = "III"', output: "3" },
      { input: 's = "LVIII"', output: "58" },
      { input: 's = "MCMXCIV"', output: "1994" },
    ],
    constraints: ["1 <= s.length <= 15", "s contains only the characters ('I', 'V', 'X', 'L', 'C', 'D', 'M').", "It is guaranteed that s is a valid roman numeral in the range [1, 3999]."],
    testCases: [
      { input: ["III"], expected: 3 },
      { input: ["LVIII"], expected: 58 },
      { input: ["MCMXCIV"], expected: 1994 },
      { input: ["IV"], expected: 4 },
      { input: ["MMMCMXCIX"], expected: 3999 },
    ],
    starterCode: makeStarter({ fnName: "romanToInt", jsSig: "function romanToInt(s)", tsSig: "function romanToInt(s: string): number", pySig: "def roman_to_int(s: str) -> int", javaSig: "public int romanToInt(String s)", javaReturn: "0", cppSig: "int romanToInt(string s)", cppReturn: "0" }),
  },
];
