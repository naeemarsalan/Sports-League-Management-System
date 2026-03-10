/** @type {import('jest').Config} */
module.exports = {
  rootDir: ".",
  testMatch: ["<rootDir>/**/*.test.js"],
  maxWorkers: 1,
  testTimeout: 120000,
  globalSetup: "detox/runners/jest/globalSetup",
  globalTeardown: "detox/runners/jest/globalTeardown",
  testEnvironment: "detox/runners/jest/testEnvironment",
  reporters: ["detox/runners/jest/reporter"],
  verbose: true,
};
