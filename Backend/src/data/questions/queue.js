const { makeStarter } = require("./_starter");

module.exports = [
  {
    title: "Time Needed to Buy Tickets",
    topic: "Queue",
    difficulty: "easy",
    company: "Uber",
    functionName: "timeRequiredToBuy",
    description: "There are n people in a line waiting to buy tickets, where the 0th person is at the front of the line and the (n - 1)th person is at the back. You are given an integer array tickets of length n where the number of tickets that the ith person would like to buy is tickets[i]. Each person takes exactly 1 second to buy a ticket and can only buy one ticket at a time. After buying a ticket, the person leaves if they have no more tickets to buy, otherwise they move to the back of the line. Return the time taken for the person at position k to finish buying tickets.",
    examples: [
      { input: "tickets = [2,3,2], k = 2", output: "6" },
      { input: "tickets = [5,1,1,1], k = 0", output: "8" },
    ],
    constraints: ["n == tickets.length", "1 <= n <= 100", "1 <= tickets[i] <= 100", "0 <= k < n"],
    testCases: [
      { input: [[2, 3, 2], 2], expected: 6 },
      { input: [[5, 1, 1, 1], 0], expected: 8 },
      { input: [[1], 0], expected: 1 },
      { input: [[2, 2, 2], 1], expected: 5 },
      { input: [[3, 1, 1, 1, 1], 4], expected: 5 },
    ],
    starterCode: makeStarter({ fnName: "timeRequiredToBuy", jsSig: "function timeRequiredToBuy(tickets, k)", tsSig: "function timeRequiredToBuy(tickets: number[], k: number): number", pySig: "def time_required_to_buy(tickets: list[int], k: int) -> int", javaSig: "public int timeRequiredToBuy(int[] tickets, int k)", javaReturn: "0", cppSig: "int timeRequiredToBuy(vector<int>& tickets, int k)", cppReturn: "0" }),
  },
];
