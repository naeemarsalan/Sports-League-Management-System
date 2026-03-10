/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/detox/**/*.test.js"],
  maxWorkers: 1,
  testTimeout: 60000,
  globalSetup: "detox/runners/jest/globalSetup",
  globalTeardown: "detox/runners/jest/globalTeardown",
  reporters: ["detox/runners/jest/reporter"],
  verbose: true,
};
