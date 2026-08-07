/**
 * Shared starter-code builder for the question bank.
 *
 * Each question supplies per-language function signatures; this helper emits
 * ready-to-edit starter files for all five supported languages. Stubs include
 * the required function name so candidates know exactly what to implement.
 */

const makeStarter = ({
  fnName,
  jsSig,
  tsSig,
  pySig,
  javaSig,
  cppSig,
  javaReturn = "null",
  cppReturn = "{}",
  jsNote = "",
  tsNote = "",
  pyNote = "",
  javaNote = "",
  cppNote = "",
  extraIncludes = "",
}) => {
  const jsComment = jsNote ? `${jsNote}\n` : "";
  const tsComment = tsNote ? `${tsNote}\n` : "";
  const pyComment = pyNote ? `${pyNote}\n` : "";
  const javaComment = javaNote ? `${javaNote}\n` : "";
  const cppComment = cppNote ? `${cppNote}\n` : "";

  return {
    javascript:
      `// Write your JavaScript solution here\n${jsComment}${jsSig} {\n  // implement \`${fnName}\`\n}\n`,
    typescript:
      `// Write your TypeScript solution here\n${tsComment}${tsSig} {\n  // implement \`${fnName}\`\n}\n`,
    python:
      `# Write your Python solution here\n${pyComment}${pySig}:\n    # implement \`${fnName}\`\n    pass\n`,
    java:
      `// Write your Java solution here\npublic class Solution {\n    ${javaComment}${javaSig} {\n        // implement \`${fnName}\`\n        return ${javaReturn};\n    }\n}\n`,
    cpp:
      `// Write your C++ solution here\n#include <vector>\n#include <string>\n${extraIncludes}using namespace std;\n\nclass Solution {\npublic:\n    ${cppComment}${cppSig} {\n        // implement \`${fnName}\`\n        return ${cppReturn};\n    }\n};\n`,
  };
};

module.exports = { makeStarter };
