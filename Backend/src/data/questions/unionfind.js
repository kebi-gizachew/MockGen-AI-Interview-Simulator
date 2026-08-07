const { makeStarter } = require("./_starter");

module.exports = [
  {
    title: "Number of Provinces",
    topic: "Union Find",
    difficulty: "medium",
    company: "Microsoft",
    functionName: "findCircleNum",
    description: "There are n cities. Some of them are connected, while some are not. If city a is connected directly with city b, and city b is connected directly with city c, then city a is connected indirectly with city c. A province is a group of directly or indirectly connected cities and no other cities outside of the group. You are given an n x n matrix isConnected where isConnected[i][j] = 1 if the ith city and the jth city are directly connected, and isConnected[i][j] = 0 otherwise. Return the total number of provinces.",
    examples: [
      { input: "isConnected = [[1,1,0],[1,1,0],[0,0,1]]", output: "2" },
      { input: "isConnected = [[1,0,0],[0,1,0],[0,0,1]]", output: "3" },
    ],
    constraints: ["1 <= n <= 200", "n == isConnected.length", "n == isConnected[i].length", "isConnected[i][j] is 1 or 0.", "isConnected[i][i] == 1", "isConnected[i][j] == isConnected[j][i]"],
    testCases: [
      { input: [[[1, 1, 0], [1, 1, 0], [0, 0, 1]]], expected: 2 },
      { input: [[[1, 0, 0], [0, 1, 0], [0, 0, 1]]], expected: 3 },
      { input: [[[1]]], expected: 1 },
      { input: [[[1, 1], [1, 1]]], expected: 1 },
      { input: [[[1, 0, 1], [0, 1, 0], [1, 0, 1]]], expected: 2 },
    ],
    starterCode: makeStarter({ fnName: "findCircleNum", jsSig: "function findCircleNum(isConnected)", tsSig: "function findCircleNum(isConnected: number[][]): number", pySig: "def find_circle_num(is_connected: list[list[int]]) -> int", javaSig: "public int findCircleNum(int[][] isConnected)", javaReturn: "0", cppSig: "int findCircleNum(vector<vector<int>>& isConnected)", cppReturn: "0" }),
  },
  {
    title: "Redundant Connection",
    topic: "Union Find",
    difficulty: "medium",
    company: "Amazon",
    functionName: "findRedundantConnection",
    description: "In this problem, a tree is an undirected graph that is connected and has no cycles. You are given a graph that started as a tree with n nodes labeled from 1 to n, with one additional edge added. The added edge has two different vertices chosen from 1 to n, and was not an edge that already existed. The graph is represented as an array edges of length n where edges[i] = [ai, bi] indicates that there is an edge between nodes ai and bi in the graph. Return an edge that can be removed so that the resulting graph is a tree of n nodes. If there are multiple answers, return the answer that occurs last in the input.",
    examples: [
      { input: "edges = [[1,2],[1,3],[2,3]]", output: "[2,3]" },
      { input: "edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]", output: "[1,4]" },
    ],
    constraints: ["n == edges.length", "3 <= n <= 1000", "edges[i].length == 2", "1 <= ai < bi <= edges.length"],
    testCases: [
      { input: [[[1, 2], [1, 3], [2, 3]]], expected: [2, 3] },
      { input: [[[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]], expected: [1, 4] },
      { input: [[[1, 2], [1, 3], [2, 3]]], expected: [2, 3] },
      { input: [[[1, 2], [2, 3], [3, 1]]], expected: [3, 1] },
      { input: [[[1, 2], [1, 3], [2, 4], [3, 4]]], expected: [3, 4] },
    ],
    starterCode: makeStarter({ fnName: "findRedundantConnection", jsSig: "function findRedundantConnection(edges)", tsSig: "function findRedundantConnection(edges: number[][]): number[]", pySig: "def find_redundant_connection(edges: list[list[int]]) -> list[int]", javaSig: "public int[] findRedundantConnection(int[][] edges)", javaReturn: "new int[0]", cppSig: "vector<int> findRedundantConnection(vector<vector<int>>& edges)", cppReturn: "{}" }),
  },
  {
    title: "Number of Connected Components in an Undirected Graph",
    topic: "Union Find",
    difficulty: "medium",
    company: "Stripe",
    functionName: "countComponents",
    description: "You have a graph of n nodes labeled from 0 to n - 1. You are given an integer n and a list of edges where edges[i] = [ai, bi] indicates that there is an undirected edge between nodes ai and bi. Return the number of connected components in this graph.",
    examples: [
      { input: "n = 5, edges = [[0,1],[1,2],[3,4]]", output: "2" },
      { input: "n = 5, edges = [[0,1],[1,2],[2,3],[3,4]]", output: "1" },
    ],
    constraints: ["1 <= n <= 2000", "0 <= edges.length <= 5000", "edges[i].length == 2", "0 <= ai, bi < n"],
    testCases: [
      { input: [5, [[0, 1], [1, 2], [3, 4]]], expected: 2 },
      { input: [5, [[0, 1], [1, 2], [2, 3], [3, 4]]], expected: 1 },
      { input: [1, []], expected: 1 },
      { input: [4, [[0, 1], [2, 3]]], expected: 2 },
      { input: [3, [[0, 1], [1, 2], [0, 2]]], expected: 1 },
    ],
    starterCode: makeStarter({ fnName: "countComponents", jsSig: "function countComponents(n, edges)", tsSig: "function countComponents(n: number, edges: number[][]): number", pySig: "def count_components(n: int, edges: list[list[int]]) -> int", javaSig: "public int countComponents(int n, int[][] edges)", javaReturn: "0", cppSig: "int countComponents(int n, vector<vector<int>>& edges)", cppReturn: "0" }),
  },
];
