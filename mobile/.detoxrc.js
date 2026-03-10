/** @type {import('detox').DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      config: "tests/detox/jest.config.js",
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    "ios.debug": {
      type: "ios.app",
      binaryPath:
        "ios/build/Build/Products/Debug-iphonesimulator/snookerpoolleague.app",
      build: "npx expo run:ios --configuration Debug",
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: { type: "iPhone 17 Pro" },
    },
  },
  configurations: {
    "ios.sim.debug": {
      device: "simulator",
      app: "ios.debug",
    },
  },
};
