/**
 * LeetCode-style question bank used to seed the Question table.
 * testCases: array of { input: [...args], expected: <value> } — input is spread
 * into the candidate's function call. expected must be JSON-serializable.
 */

const STARTER = {
  javascript: (signature, body) =>
    `// Write your JavaScript solution here\n${signature} {\n${body}\n}\n`,
  typescript: (signature, body) =>
    `// Write your TypeScript solution here\n${signature} {\n${body}\n}\n`,
  python: (signature, body) =>
    `# Write your Python solution here\n${signature}:\n${body}\n`,
  java: (signature, body) =>
    `// Write your Java solution here\npublic class Solution {\n    public ${signature} {\n${body}\n    }\n}\n`,
  cpp: (signature, body) =>
    `// Write your C++ solution here\n#include <vector>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    ${signature} {\n${body}\n    }\n};\n`,
};

const questions = [
  {
    title: "Two Sum",
    topic: "Arrays & Hashing",
    difficulty: "easy",
    company: "Google",
    functionName: "twoSum",
    description:
      "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. You may assume that each input has exactly one solution, and you may not use the same element twice. Return the answer in any order.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
      },
      {
        input: "nums = [3,3], target = 6",
        output: "[0,1]",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    testCases: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
      { input: [[3, 3], 6], expected: [0, 1] },
      { input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
      { input: [[1, 2, 3], 5], expected: [1, 2] },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\nfunction twoSum(nums, target) {\n  // return the indices of the two numbers that add up to target\n}\n",
      typescript:
        "// Write your TypeScript solution here\nfunction twoSum(nums: number[], target: number): number[] {\n  // return the indices of the two numbers that add up to target\n}\n",
      python:
        "# Write your Python solution here\ndef two_sum(nums: list[int], target: int) -> list[int]:\n    # return the indices of the two numbers that add up to target\n    pass\n",
      java:
        "// Write your Java solution here\npublic class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // return the indices of the two numbers that add up to target\n        return new int[0];\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // return the indices of the two numbers that add up to target\n        return {};\n    }\n};\n",
    },
  },
  {
    title: "Valid Parentheses",
    topic: "Stack",
    difficulty: "easy",
    company: "Amazon",
    functionName: "isValid",
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if open brackets are closed by the same type of bracket, open brackets are closed in the correct order, and every close bracket has a corresponding open bracket of the same type.",
    examples: [
      { input: "s = \"()\"", output: "true" },
      { input: "s = \"()[]{}\"", output: "true" },
      { input: "s = \"(]\"", output: "false" },
      { input: "s = \"([)]\"", output: "false" },
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'.",
    ],
    testCases: [
      { input: ["()"], expected: true },
      { input: ["()[]{}"], expected: true },
      { input: ["(]"], expected: false },
      { input: ["([)]"], expected: false },
      { input: ["{[]}"], expected: true },
      { input: [""], expected: true },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\nfunction isValid(s) {\n  // return true if the bracket string is valid\n}\n",
      typescript:
        "// Write your TypeScript solution here\nfunction isValid(s: string): boolean {\n  // return true if the bracket string is valid\n}\n",
      python:
        "# Write your Python solution here\ndef is_valid(s: str) -> bool:\n    # return True if the bracket string is valid\n    pass\n",
      java:
        "// Write your Java solution here\npublic class Solution {\n    public boolean isValid(String s) {\n        // return true if the bracket string is valid\n        return false;\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\n#include <string>\n#include <stack>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValid(string s) {\n        // return true if the bracket string is valid\n        return false;\n    }\n};\n",
    },
  },
  {
    title: "Best Time to Buy and Sell Stock",
    topic: "Arrays",
    difficulty: "easy",
    company: "Meta",
    functionName: "maxProfit",
    description:
      "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price 1) and sell on day 5 (price 6), profit = 5." },
      { input: "prices = [7,6,4,3,1]", output: "0", explanation: "No transactions are done and the max profit = 0." },
    ],
    constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
    testCases: [
      { input: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { input: [[7, 6, 4, 3, 1]], expected: 0 },
      { input: [[1]], expected: 0 },
      { input: [[2, 4, 1]], expected: 2 },
      { input: [[3, 2, 6, 5, 0, 3]], expected: 4 },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\nfunction maxProfit(prices) {\n  // return the maximum profit you can achieve\n}\n",
      typescript:
        "// Write your TypeScript solution here\nfunction maxProfit(prices: number[]): number {\n  // return the maximum profit you can achieve\n}\n",
      python:
        "# Write your Python solution here\ndef max_profit(prices: list[int]) -> int:\n    # return the maximum profit you can achieve\n    pass\n",
      java:
        "// Write your Java solution here\npublic class Solution {\n    public int maxProfit(int[] prices) {\n        // return the maximum profit you can achieve\n        return 0;\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        // return the maximum profit you can achieve\n        return 0;\n    }\n};\n",
    },
  },
  {
    title: "Maximum Subarray",
    topic: "Dynamic Programming",
    difficulty: "medium",
    company: "Microsoft",
    functionName: "maxSubArray",
    description:
      "Given an integer array nums, find the subarray with the largest sum, and return its sum. The subarray must be contiguous.",
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
      { input: "nums = [1]", output: "1" },
      { input: "nums = [5,4,-1,7,8]", output: "23" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    testCases: [
      { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { input: [[1]], expected: 1 },
      { input: [[5, 4, -1, 7, 8]], expected: 23 },
      { input: [[-1]], expected: -1 },
      { input: [[-2, -1]], expected: -1 },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\nfunction maxSubArray(nums) {\n  // return the largest contiguous subarray sum\n}\n",
      typescript:
        "// Write your TypeScript solution here\nfunction maxSubArray(nums: number[]): number {\n  // return the largest contiguous subarray sum\n}\n",
      python:
        "# Write your Python solution here\ndef max_sub_array(nums: list[int]) -> int:\n    # return the largest contiguous subarray sum\n    pass\n",
      java:
        "// Write your Java solution here\npublic class Solution {\n    public int maxSubArray(int[] nums) {\n        // return the largest contiguous subarray sum\n        return 0;\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // return the largest contiguous subarray sum\n        return 0;\n    }\n};\n",
    },
  },
  {
    title: "Product of Array Except Self",
    topic: "Arrays & Hashing",
    difficulty: "medium",
    company: "Apple",
    functionName: "productExceptSelf",
    description:
      "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer. You must write an algorithm that runs in O(n) time and without using the division operation.",
    examples: [
      { input: "nums = [1,2,3,4]", output: "[24,12,8,6]" },
      { input: "nums = [-1,1,0,-3,3]", output: "[0,0,9,0,0]" },
    ],
    constraints: ["2 <= nums.length <= 10^5", "-30 <= nums[i] <= 30"],
    testCases: [
      { input: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
      { input: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0] },
      { input: [[0, 0]], expected: [0, 0] },
      { input: [[2, 3]], expected: [3, 2] },
      { input: [[1, -1]], expected: [-1, 1] },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\nfunction productExceptSelf(nums) {\n  // return an array where answer[i] is the product of all elements except nums[i]\n}\n",
      typescript:
        "// Write your TypeScript solution here\nfunction productExceptSelf(nums: number[]): number[] {\n  // return an array where answer[i] is the product of all elements except nums[i]\n}\n",
      python:
        "# Write your Python solution here\ndef product_except_self(nums: list[int]) -> list[int]:\n    # return an array where answer[i] is the product of all elements except nums[i]\n    pass\n",
      java:
        "// Write your Java solution here\npublic class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        // return an array where answer[i] is the product of all elements except nums[i]\n        return new int[0];\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        // return an array where answer[i] is the product of all elements except nums[i]\n        return {};\n    }\n};\n",
    },
  },
  {
    title: "Longest Substring Without Repeating Characters",
    topic: "Sliding Window",
    difficulty: "medium",
    company: "Netflix",
    functionName: "lengthOfLongestSubstring",
    description:
      "Given a string s, find the length of the longest substring without repeating characters.",
    examples: [
      { input: "s = \"abcabcbb\"", output: "3", explanation: "The answer is \"abc\", with the length of 3." },
      { input: "s = \"bbbbb\"", output: "1" },
      { input: "s = \"pwwkew\"", output: "3" },
    ],
    constraints: ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
    testCases: [
      { input: ["abcabcbb"], expected: 3 },
      { input: ["bbbbb"], expected: 1 },
      { input: ["pwwkew"], expected: 3 },
      { input: [""], expected: 0 },
      { input: ["au"], expected: 2 },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\nfunction lengthOfLongestSubstring(s) {\n  // return the length of the longest substring without repeating characters\n}\n",
      typescript:
        "// Write your TypeScript solution here\nfunction lengthOfLongestSubstring(s: string): number {\n  // return the length of the longest substring without repeating characters\n}\n",
      python:
        "# Write your Python solution here\ndef length_of_longest_substring(s: str) -> int:\n    # return the length of the longest substring without repeating characters\n    pass\n",
      java:
        "// Write your Java solution here\npublic class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // return the length of the longest substring without repeating characters\n        return 0;\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\n#include <string>\n#include <unordered_set>\nusing namespace std;\n\nclass Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // return the length of the longest substring without repeating characters\n        return 0;\n    }\n};\n",
    },
  },
  {
    title: "Container With Most Water",
    topic: "Two Pointers",
    difficulty: "medium",
    company: "OpenAI",
    functionName: "maxArea",
    description:
      "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.",
    examples: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49" },
      { input: "height = [1,1]", output: "1" },
    ],
    constraints: ["n == height.length", "2 <= n <= 10^5", "0 <= height[i] <= 10^4"],
    testCases: [
      { input: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49 },
      { input: [[1, 1]], expected: 1 },
      { input: [[4, 3, 2, 1, 4]], expected: 16 },
      { input: [[1, 2, 1]], expected: 2 },
      { input: [[2, 3, 4, 5, 18, 17, 6]], expected: 17 },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\nfunction maxArea(height) {\n  // return the maximum amount of water a container can store\n}\n",
      typescript:
        "// Write your TypeScript solution here\nfunction maxArea(height: number[]): number {\n  // return the maximum amount of water a container can store\n}\n",
      python:
        "# Write your Python solution here\ndef max_area(height: list[int]) -> int:\n    # return the maximum amount of water a container can store\n    pass\n",
      java:
        "// Write your Java solution here\npublic class Solution {\n    public int maxArea(int[] height) {\n        // return the maximum amount of water a container can store\n        return 0;\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        // return the maximum amount of water a container can store\n        return 0;\n    }\n};\n",
    },
  },
  {
    title: "Merge Intervals",
    topic: "Intervals",
    difficulty: "medium",
    company: "Microsoft",
    functionName: "merge",
    description:
      "Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" },
      { input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]" },
    ],
    constraints: ["1 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= start_i <= end_i <= 10^4"],
    testCases: [
      { input: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
      { input: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
      { input: [[[1, 2], [3, 4]]], expected: [[1, 2], [3, 4]] },
      { input: [[[1, 4]]], expected: [[1, 4]] },
      { input: [[[2, 3], [1, 2]]], expected: [[1, 3]] },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\nfunction merge(intervals) {\n  // return the merged non-overlapping intervals\n}\n",
      typescript:
        "// Write your TypeScript solution here\nfunction merge(intervals: number[][]): number[][] {\n  // return the merged non-overlapping intervals\n}\n",
      python:
        "# Write your Python solution here\ndef merge(intervals: list[list[int]]) -> list[list[int]]:\n    # return the merged non-overlapping intervals\n    pass\n",
      java:
        "// Write your Java solution here\npublic class Solution {\n    public int[][] merge(int[][] intervals) {\n        // return the merged non-overlapping intervals\n        return new int[0][0];\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // return the merged non-overlapping intervals\n        return {};\n    }\n};\n",
    },
  },
  {
    title: "Valid Anagram",
    topic: "Arrays & Hashing",
    difficulty: "easy",
    company: "Netflix",
    functionName: "isAnagram",
    description:
      "Given two strings s and t, return true if t is an anagram of s, and false otherwise. An anagram is a word formed by rearranging the letters of another word.",
    examples: [
      { input: "s = \"anagram\", t = \"nagaram\"", output: "true" },
      { input: "s = \"rat\", t = \"car\"", output: "false" },
    ],
    constraints: ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
    testCases: [
      { input: ["anagram", "nagaram"], expected: true },
      { input: ["rat", "car"], expected: false },
      { input: ["aacc", "ccac"], expected: false },
      { input: ["", ""], expected: true },
      { input: ["listen", "silent"], expected: true },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\nfunction isAnagram(s, t) {\n  // return true if t is an anagram of s\n}\n",
      typescript:
        "// Write your TypeScript solution here\nfunction isAnagram(s: string, t: string): boolean {\n  // return true if t is an anagram of s\n}\n",
      python:
        "# Write your Python solution here\ndef is_anagram(s: str, t: str) -> bool:\n    # return true if t is an anagram of s\n    pass\n",
      java:
        "// Write your Java solution here\npublic class Solution {\n    public boolean isAnagram(String s, String t) {\n        // return true if t is an anagram of s\n        return false;\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        // return true if t is an anagram of s\n        return false;\n    }\n};\n",
    },
  },
  {
    title: "Longest Common Prefix",
    topic: "Strings",
    difficulty: "easy",
    company: "Meta",
    functionName: "longestCommonPrefix",
    description:
      "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string \"\".",
    examples: [
      { input: "strs = [\"flower\",\"flow\",\"flight\"]", output: "\"fl\"" },
      { input: "strs = [\"dog\",\"racecar\",\"car\"]", output: "\"\"" },
    ],
    constraints: ["1 <= strs.length <= 200", "0 <= strs[i].length <= 200", "strs[i] consists of lowercase English letters."],
    testCases: [
      { input: [["flower", "flow", "flight"]], expected: "fl" },
      { input: [["dog", "racecar", "car"]], expected: "" },
      { input: [["a"]], expected: "a" },
      { input: [["ab", "a"]], expected: "a" },
      { input: [["", ""]], expected: "" },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\nfunction longestCommonPrefix(strs) {\n  // return the longest common prefix string\n}\n",
      typescript:
        "// Write your TypeScript solution here\nfunction longestCommonPrefix(strs: string[]): string {\n  // return the longest common prefix string\n}\n",
      python:
        "# Write your Python solution here\ndef longest_common_prefix(strs: list[str]) -> str:\n    # return the longest common prefix string\n    pass\n",
      java:
        "// Write your Java solution here\npublic class Solution {\n    public String longestCommonPrefix(String[] strs) {\n        // return the longest common prefix string\n        return \"\";\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\n#include <vector>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    string longestCommonPrefix(vector<string>& strs) {\n        // return the longest common prefix string\n        return \"\";\n    }\n};\n",
    },
  },
  {
    title: "Maximum Depth of Binary Tree",
    topic: "Trees",
    difficulty: "easy",
    company: "Amazon",
    functionName: "maxDepth",
    argTypes: ["tree"],
    description:
      "Given the root of a binary tree, return its maximum depth. A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node. Input is provided as a level-order array where null marks a missing child.",
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "3" },
      { input: "root = [1,null,2]", output: "2" },
    ],
    constraints: ["The number of nodes is in the range [0, 10^4].", "-100 <= Node.val <= 100"],
    testCases: [
      { input: [[3, 9, 20, null, null, 15, 7]], expected: 3 },
      { input: [[1, null, 2]], expected: 2 },
      { input: [[]], expected: 0 },
      { input: [[1]], expected: 1 },
      { input: [[1, 2, 3, 4, 5, 6, 7, 8]], expected: 4 },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\n// TreeNode is provided by the execution harness:\n//   function TreeNode(val, left, right) { this.val = val; this.left = left; this.right = right; }\nfunction maxDepth(root) {\n  // return the maximum depth of the binary tree\n}\n",
      typescript:
        "// Write your TypeScript solution here\n// TreeNode is provided by the execution harness.\nfunction maxDepth(root: TreeNode | null): number {\n  // return the maximum depth of the binary tree\n  return 0;\n}\n",
      python:
        "# Write your Python solution here\n# TreeNode is provided by the execution harness:\n#   class TreeNode:\n#       def __init__(self, val=0, left=None, right=None): ...\ndef max_depth(root: Optional[TreeNode]) -> int:\n    # return the maximum depth of the binary tree\n    pass\n",
      java:
        "// Write your Java solution here\n// TreeNode is provided by the execution harness.\npublic class Solution {\n    public int maxDepth(TreeNode root) {\n        // return the maximum depth of the binary tree\n        return 0;\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\n// TreeNode is provided by the execution harness.\nclass Solution {\npublic:\n    int maxDepth(TreeNode* root) {\n        // return the maximum depth of the binary tree\n        return 0;\n    }\n};\n",
    },
  },
  {
    title: "Climbing Stairs",
    topic: "Dynamic Programming",
    difficulty: "easy",
    company: "Apple",
    functionName: "climbStairs",
    description:
      "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    examples: [
      { input: "n = 2", output: "2", explanation: "1 step + 1 step, or 2 steps." },
      { input: "n = 3", output: "3", explanation: "1+1+1, 1+2, 2+1." },
    ],
    constraints: ["1 <= n <= 45"],
    testCases: [
      { input: [2], expected: 2 },
      { input: [3], expected: 3 },
      { input: [4], expected: 5 },
      { input: [5], expected: 8 },
      { input: [6], expected: 13 },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\nfunction climbStairs(n) {\n  // return the number of distinct ways to climb to the top\n}\n",
      typescript:
        "// Write your TypeScript solution here\nfunction climbStairs(n: number): number {\n  // return the number of distinct ways to climb to the top\n  return 0;\n}\n",
      python:
        "# Write your Python solution here\ndef climb_stairs(n: int) -> int:\n    # return the number of distinct ways to climb to the top\n    pass\n",
      java:
        "// Write your Java solution here\npublic class Solution {\n    public int climbStairs(int n) {\n        // return the number of distinct ways to climb to the top\n        return 0;\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\nclass Solution {\npublic:\n    int climbStairs(int n) {\n        // return the number of distinct ways to climb to the top\n        return 0;\n    }\n};\n",
    },
  },
  {
    title: "House Robber",
    topic: "Dynamic Programming",
    difficulty: "medium",
    company: "Google",
    functionName: "rob",
    description:
      "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed (nums[i]). Adjacent houses have security systems that alert the police if two adjacent houses are broken into on the same night. Return the maximum amount of money you can rob tonight without alerting the police.",
    examples: [
      { input: "nums = [1,2,3,1]", output: "4", explanation: "Rob house 1 (1) and house 3 (3)." },
      { input: "nums = [2,7,9,3,1]", output: "12", explanation: "Rob houses 1, 3, and 5." },
    ],
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 400"],
    testCases: [
      { input: [[2, 7, 9, 3, 1]], expected: 12 },
      { input: [[1, 2, 3, 1]], expected: 4 },
      { input: [[5]], expected: 5 },
      { input: [[2, 1, 1, 2]], expected: 4 },
      { input: [[0]], expected: 0 },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\nfunction rob(nums) {\n  // return the maximum amount you can rob tonight\n}\n",
      typescript:
        "// Write your TypeScript solution here\nfunction rob(nums: number[]): number {\n  // return the maximum amount you can rob tonight\n  return 0;\n}\n",
      python:
        "# Write your Python solution here\ndef rob(nums: list[int]) -> int:\n    # return the maximum amount you can rob tonight\n    pass\n",
      java:
        "// Write your Java solution here\npublic class Solution {\n    public int rob(int[] nums) {\n        // return the maximum amount you can rob tonight\n        return 0;\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int rob(vector<int>& nums) {\n        // return the maximum amount you can rob tonight\n        return 0;\n    }\n};\n",
    },
  },
  {
    title: "Binary Tree Level Order Traversal",
    topic: "Trees",
    difficulty: "medium",
    company: "Microsoft",
    functionName: "levelOrder",
    argTypes: ["tree"],
    description:
      "Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level). Input is provided as a level-order array where null marks a missing child.",
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "[[3],[9,20],[15,7]]" },
      { input: "root = [1]", output: "[[1]]" },
    ],
    constraints: ["The number of nodes is in the range [0, 2000].", "-1000 <= Node.val <= 1000"],
    testCases: [
      { input: [[3, 9, 20, null, null, 15, 7]], expected: [[3], [9, 20], [15, 7]] },
      { input: [[1]], expected: [[1]] },
      { input: [[]], expected: [] },
      { input: [[1, 2, 3, 4]], expected: [[1], [2, 3], [4]] },
      { input: [[1, null, 2, null, 3]], expected: [[1], [2], [3]] },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\n// TreeNode is provided by the execution harness.\nfunction levelOrder(root) {\n  // return the level order traversal of the binary tree\n}\n",
      typescript:
        "// Write your TypeScript solution here\n// TreeNode is provided by the execution harness.\nfunction levelOrder(root: TreeNode | null): number[][] {\n  // return the level order traversal of the binary tree\n  return [];\n}\n",
      python:
        "# Write your Python solution here\n# TreeNode is provided by the execution harness.\ndef level_order(root: Optional[TreeNode]) -> list[list[int]]:\n    # return the level order traversal of the binary tree\n    pass\n",
      java:
        "// Write your Java solution here\n// TreeNode is provided by the execution harness.\npublic class Solution {\n    public List<List<Integer>> levelOrder(TreeNode root) {\n        // return the level order traversal of the binary tree\n        return new ArrayList<>();\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\n// TreeNode is provided by the execution harness.\nclass Solution {\npublic:\n    vector<vector<int>> levelOrder(TreeNode* root) {\n        // return the level order traversal of the binary tree\n        return {};\n    }\n};\n",
    },
  },
  {
    title: "Number of Islands",
    topic: "Graphs",
    difficulty: "medium",
    company: "Amazon",
    functionName: "numIslands",
    description:
      "Given an m x n 2D binary grid of 1s (land) and 0s (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
    examples: [
      {
        input: "grid = [[1,1,0,0,0],[1,1,0,0,0],[0,0,1,0,0],[0,0,0,1,1]]",
        output: "3",
      },
      { input: "grid = [[1,1],[0,0]]", output: "1" },
    ],
    constraints: ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 300", "grid[i][j] is 0 or 1"],
    testCases: [
      { input: [[[1, 1, 0, 0, 0], [1, 1, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 1, 1]]], expected: 3 },
      { input: [[[1, 1], [0, 0]]], expected: 1 },
      { input: [[[1]]], expected: 1 },
      { input: [[[0, 0], [0, 0]]], expected: 0 },
      { input: [[[1, 0, 1], [0, 1, 0], [1, 0, 1]]], expected: 5 },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\nfunction numIslands(grid) {\n  // return the number of islands in the grid\n}\n",
      typescript:
        "// Write your TypeScript solution here\nfunction numIslands(grid: number[][]): number {\n  // return the number of islands in the grid\n  return 0;\n}\n",
      python:
        "# Write your Python solution here\ndef num_islands(grid: list[list[int]]) -> int:\n    # return the number of islands in the grid\n    pass\n",
      java:
        "// Write your Java solution here\npublic class Solution {\n    public int numIslands(int[][] grid) {\n        // return the number of islands in the grid\n        return 0;\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int numIslands(vector<vector<int>>& grid) {\n        // return the number of islands in the grid\n        return 0;\n    }\n};\n",
    },
  },
  {
    title: "Valid Sudoku",
    topic: "Arrays & Hashing",
    difficulty: "medium",
    company: "Netflix",
    functionName: "isValidSudoku",
    description:
      "Determine if a 9 x 9 Sudoku board is valid. Only the filled cells need to be validated according to the following rules: each row must contain the digits 1-9 without repetition, each column must contain the digits 1-9 without repetition, and each of the nine 3 x 3 sub-boxes must contain the digits 1-9 without repetition. Empty cells are represented by '.'. The board is passed as an array of 9 strings, each of length 9.",
    examples: [
      {
        input: "board = [\"53..7....\",\"6..195...\",\".98....6.\",\"8...6...3\",\"4..8.3..1\",\"7...2...6\",\".6....28.\",\"...419..5\",\"....8..79\"]",
        output: "true",
      },
    ],
    constraints: ["board.length == 9", "board[i].length == 9", "board[i][j] is a digit 1-9 or '.'"],
    testCases: [
      {
        input: [["53..7....", "6..195...", ".98....6.", "8...6...3", "4..8.3..1", "7...2...6", ".6....28.", "...419..5", "....8..79"]],
        expected: true,
      },
      {
        input: [["83..7....", "6..195...", ".98....6.", "8...6...3", "4..8.3..1", "7...2...6", ".6....28.", "...419..5", "....8..79"]],
        expected: false,
      },
      { input: [["....5..1.", ".4.3.....", ".....3..1", "8......2.", "..2.7....", ".15......", ".....2...", ".2.9.....", "..4......"]], expected: false },
      { input: [["..........", "..........", "..........", "..........", "..........", "..........", "..........", "..........", ".........."]], expected: true },
      {
        input: [["1........", ".........", ".........", ".........", ".........", ".........", ".........", ".........", "........."]],
        expected: true,
      },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\nfunction isValidSudoku(board) {\n  // return true if the Sudoku board is valid\n}\n",
      typescript:
        "// Write your TypeScript solution here\nfunction isValidSudoku(board: string[]): boolean {\n  // return true if the Sudoku board is valid\n  return false;\n}\n",
      python:
        "# Write your Python solution here\ndef is_valid_sudoku(board: list[str]) -> bool:\n    # return true if the Sudoku board is valid\n    pass\n",
      java:
        "// Write your Java solution here\npublic class Solution {\n    public boolean isValidSudoku(String[][] board) {\n        // return true if the Sudoku board is valid\n        return false;\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\n#include <vector>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValidSudoku(vector<vector<string>>& board) {\n        // return true if the Sudoku board is valid\n        return false;\n    }\n};\n",
    },
  },
  {
    title: "Longest Palindromic Substring",
    topic: "Strings",
    difficulty: "medium",
    company: "OpenAI",
    functionName: "longestPalindrome",
    description:
      "Given a string s, return the longest palindromic substring in s. If there are multiple valid answers of the same length, any of them is acceptable.",
    examples: [
      { input: "s = \"babad\"", output: "\"bab\" or \"aba\"" },
      { input: "s = \"cbbd\"", output: "\"bb\"" },
    ],
    constraints: ["1 <= s.length <= 1000", "s consists of lowercase English letters."],
    testCases: [
      { input: ["racecar"], expected: "racecar" },
      { input: ["cbbd"], expected: "bb" },
      { input: ["a"], expected: "a" },
      { input: ["ac"], expected: "a" },
      { input: ["forgeeksskeegfor"], expected: "geeksskeeg" },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\nfunction longestPalindrome(s) {\n  // return the longest palindromic substring\n}\n",
      typescript:
        "// Write your TypeScript solution here\nfunction longestPalindrome(s: string): string {\n  // return the longest palindromic substring\n  return \"\";\n}\n",
      python:
        "# Write your Python solution here\ndef longest_palindrome(s: str) -> str:\n    # return the longest palindromic substring\n    pass\n",
      java:
        "// Write your Java solution here\npublic class Solution {\n    public String longestPalindrome(String s) {\n        // return the longest palindromic substring\n        return \"\";\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    string longestPalindrome(string s) {\n        // return the longest palindromic substring\n        return \"\";\n    }\n};\n",
    },
  },
  {
    title: "Trapping Rain Water",
    topic: "Two Pointers",
    difficulty: "hard",
    company: "OpenAI",
    functionName: "trap",
    description:
      "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    examples: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6", explanation: "The elevation map traps 6 units of rain water." },
      { input: "height = [4,2,0,3,2,5]", output: "9" },
    ],
    constraints: ["n == height.length", "1 <= n <= 2 * 10^4", "0 <= height[i] <= 10^5"],
    testCases: [
      { input: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6 },
      { input: [[4, 2, 0, 3, 2, 5]], expected: 9 },
      { input: [[1]], expected: 0 },
      { input: [[2, 0, 2]], expected: 2 },
      { input: [[5, 4, 3, 2, 1]], expected: 0 },
    ],
    starterCode: {
      javascript:
        "// Write your JavaScript solution here\nfunction trap(height) {\n  // return how much water the elevation map can trap\n}\n",
      typescript:
        "// Write your TypeScript solution here\nfunction trap(height: number[]): number {\n  // return how much water the elevation map can trap\n  return 0;\n}\n",
      python:
        "# Write your Python solution here\ndef trap(height: list[int]) -> int:\n    # return how much water the elevation map can trap\n    pass\n",
      java:
        "// Write your Java solution here\npublic class Solution {\n    public int trap(int[] height) {\n        // return how much water the elevation map can trap\n        return 0;\n    }\n}\n",
      cpp:
        "// Write your C++ solution here\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int trap(vector<int>& height) {\n        // return how much water the elevation map can trap\n        return 0;\n    }\n};\n",
    },
  },
];

module.exports = { questions };
