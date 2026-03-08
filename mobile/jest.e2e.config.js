/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/e2e/**/*.e2e.test.js"],
  // Run tests sequentially — E2E tests share backend state
  maxWorkers: 1,
  // Network calls need more time
  testTimeout: 30000,
};
