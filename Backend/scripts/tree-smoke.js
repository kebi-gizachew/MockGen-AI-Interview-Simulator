const { executeCode } = require("../src/services/codeExecution.service");

const maxDepthCases = [
  { input: [[3, 9, 20, null, null, 15, 7]], expected: 3 },
  { input: [[1, null, 2]], expected: 2 },
  { input: [[]], expected: 0 },
  { input: [[1]], expected: 1 },
  { input: [[1, 2, 3, 4, 5, 6, 7, 8]], expected: 4 },
];

const solutions = {
  python: `def max_depth(root):
    if root is None:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))`,
  javascript: `function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}`,
  java: `class Solution {
    public int maxDepth(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }
}`,
  cpp: `class Solution {
public:
    int maxDepth(TreeNode* root) {
        if (!root) return 0;
        return 1 + std::max(maxDepth(root->left), maxDepth(root->right));
    }
};`,
  // User defines their own TreeNode in Java — harness must not double-declare.
  javaOwnTreeNode: `class TreeNode {
    int val; TreeNode left; TreeNode right;
    TreeNode(int x) { val = x; }
}
class Solution {
    public int maxDepth(TreeNode root) {
        return root == null ? 0 : 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }
}`,
};

(async () => {
  for (const language of ["python", "java", "cpp", "javascript"]) {
    const start = Date.now();
    const result = await executeCode({
      language,
      code: solutions[language],
      functionName: "maxDepth",
      testCases: maxDepthCases,
      argTypes: ["tree"],
    });
    const summary = result.error
      ? `ERROR: ${result.error.slice(0, 160)}`
      : `${result.passed}/${result.total} passed (${result.runtimeMs}ms)`;
    console.log(`${language}: ${summary} (${Date.now() - start}ms wall)`);
  }
  const ownJava = await executeCode({
    language: "java",
    code: solutions.javaOwnTreeNode,
    functionName: "maxDepth",
    testCases: maxDepthCases,
    argTypes: ["tree"],
  });
  console.log("java with user TreeNode:", ownJava.error ? `ERROR: ${ownJava.error.slice(0, 120)}` : `${ownJava.passed}/${ownJava.total} passed`);
  process.exit(0);
})();
