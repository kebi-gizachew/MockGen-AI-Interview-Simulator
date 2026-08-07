const { makeStarter } = require("./_starter");

module.exports = [
  {
    title: "Kth Largest Element in an Array",
    topic: "Heap",
    difficulty: "medium",
    company: "Meta",
    functionName: "findKthLargest",
    description: "Given an integer array nums and an integer k, return the kth largest element in the array. Note that it is the kth largest element in the sorted order, not the kth distinct element.",
    examples: [
      { input: "nums = [3,2,1,5,6,4], k = 2", output: "5" },
      { input: "nums = [3,2,3,1,2,4,5,5,6], k = 4", output: "4" },
    ],
    constraints: ["1 <= k <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    testCases: [
      { input: [[3, 2, 1, 5, 6, 4], 2], expected: 5 },
      { input: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], expected: 4 },
      { input: [[1], 1], expected: 1 },
      { input: [[2, 1], 1], expected: 2 },
      { input: [[-1, -2, -3], 3], expected: -3 },
    ],
    starterCode: makeStarter({ fnName: "findKthLargest", jsSig: "function findKthLargest(nums, k)", tsSig: "function findKthLargest(nums: number[], k: number): number", pySig: "def find_kth_largest(nums: list[int], k: int) -> int", javaSig: "public int findKthLargest(int[] nums, int k)", javaReturn: "0", cppSig: "int findKthLargest(vector<int>& nums, int k)", cppReturn: "0" }),
  },
  {
    title: "K Closest Points to Origin",
    topic: "Heap",
    difficulty: "medium",
    company: "Google",
    functionName: "kClosest",
    description: "Given an array of points where points[i] = [xi, yi] represents a point on the X-Y plane and an integer k, return the k closest points to the origin (0, 0). The distance between two points on the X-Y plane is the Euclidean distance. Return the answer sorted by distance ascending; when two points tie on distance, the smaller x first, then smaller y.",
    examples: [
      { input: "points = [[1,3],[-2,2]], k = 1", output: "[[-2,2]]" },
      { input: "points = [[3,3],[5,-1],[-2,4]], k = 2", output: "[[3,3],[-2,4]]" },
    ],
    constraints: ["1 <= k <= points.length <= 10^4", "-10^4 <= xi, yi <= 10^4"],
    testCases: [
      { input: [[[1, 3], [-2, 2]], 1], expected: [[-2, 2]] },
      { input: [[[3, 3], [5, -1], [-2, 4]], 2], expected: [[3, 3], [-2, 4]] },
      { input: [[[0, 1], [1, 0]], 2], expected: [[0, 1], [1, 0]] },
      { input: [[[1, 1]], 1], expected: [[1, 1]] },
      { input: [[[-2, 2], [2, -2], [1, 1]], 2], expected: [[1, 1], [-2, 2]] },
    ],
    starterCode: makeStarter({ fnName: "kClosest", jsSig: "function kClosest(points, k)", tsSig: "function kClosest(points: number[][], k: number): number[][]", pySig: "def k_closest(points: list[list[int]], k: int) -> list[list[int]]", javaSig: "public int[][] kClosest(int[][] points, int k)", javaReturn: "new int[0][0]", cppSig: "vector<vector<int>> kClosest(vector<vector<int>>& points, int k)", cppReturn: "{}" }),
  },
  {
    title: "Last Stone Weight",
    topic: "Heap",
    difficulty: "easy",
    company: "Netflix",
    functionName: "lastStoneWeight",
    description: "You are given an array of integers stones where stones[i] is the weight of the ith stone. We are playing a game with the stones. On each turn, we choose the heaviest two stones and smash them together: if they are equal, both are destroyed; otherwise, the heavier stone is destroyed and the lighter one is replaced by their difference. Return the weight of the last remaining stone. If there are no stones left, return 0.",
    examples: [
      { input: "stones = [2,7,4,1,8,1]", output: "1" },
      { input: "stones = [1]", output: "1" },
    ],
    constraints: ["1 <= stones.length <= 30", "1 <= stones[i] <= 1000"],
    testCases: [
      { input: [[2, 7, 4, 1, 8, 1]], expected: 1 },
      { input: [[1]], expected: 1 },
      { input: [[2, 2]], expected: 0 },
      { input: [[10, 4, 2, 10]], expected: 2 },
      { input: [[3, 7, 2]], expected: 2 },
    ],
    starterCode: makeStarter({ fnName: "lastStoneWeight", jsSig: "function lastStoneWeight(stones)", tsSig: "function lastStoneWeight(stones: number[]): number", pySig: "def last_stone_weight(stones: list[int]) -> int", javaSig: "public int lastStoneWeight(int[] stones)", javaReturn: "0", cppSig: "int lastStoneWeight(vector<int>& stones)", cppReturn: "0" }),
  },
];
