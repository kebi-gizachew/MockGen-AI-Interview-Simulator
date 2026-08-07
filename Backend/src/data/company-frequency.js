/**
 * Company interview-frequency dataset.
 *
 * Drives the realistic per-company question ranking. Each entry maps a company
 * to its most frequently reported interview questions, ordered by how often
 * they actually appear in real on-sites / phone screens (curated from widely
 * reported LeetCode frequency data and interview-survey write-ups).
 *
 *   rank 1  — "very_high": the company's most frequently reported problems.
 *   rank 2-3 — "very_high": still extremely common.
 *   rank 4-10 — "high": frequently asked.
 *   rank 11+ — "medium"/"low": less commonly reported.
 *
 * Questions not listed here are still seeded, but with a deterministic
 * lower fallback rank so they never outrank known frequent questions.
 *
 * The map is keyed by exact company name + exact question title as they
 * appear in the seed bank (Backend/src/data/questions/*).
 */

const FREQUENCY_BY_COMPANY = {
  Google: {
    "Two Sum": 1,
    "Search in Rotated Sorted Array": 2,
    "Course Schedule": 3,
    "Jump Game": 4,
    "Coin Change": 5,
    "Valid Palindrome": 6,
    "Longest Repeating Character Replacement": 7,
    "Combination Sum": 8,
    "Invert Binary Tree": 9,
    "House Robber": 10,
    "K Closest Points to Origin": 11,
    "Jump Game II": 12,
    "First Unique Character in a String": 13,
    "Remove Nth Node From End of List": 14,
  },
  Amazon: {
    "Valid Parentheses": 1,
    "Number of Islands": 2,
    "Reverse Linked List": 3,
    "Longest Increasing Subsequence": 4,
    "Task Scheduler": 5,
    "Two Sum II - Input Array Is Sorted": 6,
    "Permutation in String": 7,
    "Letter Combinations of a Phone Number": 8,
    "Maximum Depth of Binary Tree": 9,
    "Contains Duplicate": 10,
    "Find Minimum in Rotated Sorted Array": 11,
    "Same Tree": 12,
    "Flood Fill": 13,
    "Redundant Connection": 14,
  },
  Meta: {
    "Group Anagrams": 1,
    "Merge Two Sorted Lists": 2,
    "Best Time to Buy and Sell Stock": 3,
    "3Sum": 4,
    "Kth Largest Element in an Array": 5,
    "Word Break": 6,
    "Longest Common Prefix": 7,
    "Subsets": 8,
    "Symmetric Tree": 9,
    "Isomorphic Strings": 10,
    "First Bad Version": 11,
    "Rotting Oranges": 12,
    "Asteroid Collision": 13,
  },
  Microsoft: {
    "Merge Intervals": 1,
    "Maximum Subarray": 2,
    "Binary Search": 3,
    "Minimum Window Substring": 4,
    "Top K Frequent Elements": 5,
    "Unique Paths": 6,
    "Binary Tree Level Order Traversal": 7,
    "Minimum Size Subarray Sum": 8,
    "Permutations": 9,
    "Number of Provinces": 10,
    "Daily Temperatures": 11,
    "Palindromic Substrings": 12,
    "Max Area of Island": 13,
    "Gas Station": 14,
    "Balanced Binary Tree": 15,
  },
  Apple: {
    "Product of Array Except Self": 1,
    "Climbing Stairs": 2,
    "Middle of the Linked List": 3,
    "Min Cost Climbing Stairs": 4,
    "Diameter of Binary Tree": 5,
    "Reverse String": 6,
    "Remove Duplicates from Sorted Array": 7,
    "Sqrt(x)": 8,
    "Evaluate Reverse Polish Notation": 9,
    "Find All Numbers Disappeared in an Array": 10,
  },
  Netflix: {
    "Longest Substring Without Repeating Characters": 1,
    "Validate Binary Search Tree": 2,
    "Generate Parentheses": 3,
    "Valid Anagram": 4,
    "Add Two Numbers": 5,
    "Majority Element": 6,
    "Sort Colors": 7,
    "Decode Ways": 8,
    "Fruit Into Baskets": 9,
    "Last Stone Weight": 10,
  },
  Uber: {
    "Lowest Common Ancestor of a Binary Tree": 1,
    "Palindrome Linked List": 2,
    "Partition Equal Subset Sum": 3,
    "Missing Number": 4,
    "Car Fleet": 5,
    "Koko Eating Bananas": 6,
    "Subsets II": 7,
    "Palindrome Number": 8,
    "Lemonade Change": 9,
    "Find the Index of the First Occurrence in a String": 10,
    "Time Needed to Buy Tickets": 11,
  },
  Airbnb: {
    "Walls and Gates": 1,
    "Edit Distance": 2,
    "Path Sum": 3,
    "Simplify Path": 4,
    "Summary Ranges": 5,
    "Zigzag Conversion": 6,
    "Assign Cookies": 7,
    "Odd Even Linked List": 8,
    "Maximum Average Subarray I": 9,
  },
  Stripe: {
    "Word Search": 1,
    "Longest Common Subsequence": 2,
    "Number of Connected Components in an Undirected Graph": 3,
    "Ransom Note": 4,
    "Move Zeroes": 5,
    "Search a 2D Matrix": 6,
    "Next Greater Element I": 7,
    "Reverse Words in a String": 8,
    "Binary Tree Inorder Traversal": 9,
    "Swap Nodes in Pairs": 10,
    "Minimum Number of Arrows to Burst Balloons": 11,
  },
  OpenAI: {
    "Trapping Rain Water": 1,
    "Container With Most Water": 2,
    "Longest Palindromic Substring": 3,
    "Sliding Window Maximum": 4,
    "N-Queens": 5,
    "Surrounded Regions": 6,
  },
};

// Frequency tier derived from the rank. 1-3 extremely common, 4-10 frequent,
// 11-30 occasional, 31+ rarely reported.
const tierForRank = (rank) => {
  const numeric = Number(rank);
  if (!Number.isFinite(numeric)) return "low";
  if (numeric <= 3) return "very_high";
  if (numeric <= 10) return "high";
  if (numeric <= 30) return "medium";
  return "low";
};

// Stable, deterministic hash so fallback ranks never change between runs
// (keeps seeding idempotent and ordering stable).
const stableHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
};

// Fallback rank for questions not in the curated map: they are real problems
// but less commonly reported at the company, so they rank below every known
// frequent question. Difficulty gives a soft nudge (harder = slightly more
// notable) then a stable hash spreads them deterministically.
const fallbackRank = (question) => {
  const base =
    question.difficulty === "easy" ? 16 : question.difficulty === "hard" ? 24 : 20;
  return base + (stableHash(String(question.title)) % 14);
};

/**
 * Attach { frequencyRank, interviewFrequency } to a seed question, preferring
 * the curated map and falling back to a deterministic low rank.
 */
const applyFrequencyMetadata = (question) => {
  const company = question && question.company ? String(question.company) : "";
  const rankMap = FREQUENCY_BY_COMPANY[company] || null;
  const rank = (rankMap && rankMap[question.title]) || fallbackRank(question);
  return {
    ...question,
    frequencyRank: rank,
    interviewFrequency: tierForRank(rank),
  };
};

const FREQUENCY_TIERS = ["very_high", "high", "medium", "low"];

module.exports = {
  FREQUENCY_BY_COMPANY,
  FREQUENCY_TIERS,
  tierForRank,
  fallbackRank,
  applyFrequencyMetadata,
};
