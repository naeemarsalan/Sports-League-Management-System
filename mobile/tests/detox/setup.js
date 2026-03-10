// Detox 20.x injects `device`, `element`, `by`, `expect` as globals
// via testEnvironment. This file provides shared lifecycle hooks.

beforeAll(async () => {
  await device.launchApp({
    newInstance: true,
    launchArgs: {
      // Attempt to reduce system popups
      detoxURLBlacklistRegex: ".*keychain.*",
    },
  });
});
