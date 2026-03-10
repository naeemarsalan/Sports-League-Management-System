/** @type {import('detox').DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      config: "tests/detox/jest.config.js",
      $0: "npx jest",
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    "ios.debug": {
      type: "ios.app",
      binaryPath:
        "ios/build/Build/Products/Debug-iphonesimulator/SnookerPoolLeague.app",
      build: "npx expo run:ios --configuration Debug",
    },
    "ios.release": {
      type: "ios.app",
      binaryPath:
        "ios/build/Build/Products/Release-iphonesimulator/SnookerPoolLeague.app",
      build:
        "xcodebuild -workspace ios/SnookerPoolLeague.xcworkspace -scheme SnookerPoolLeague -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet build",
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
    "ios.sim.release": {
      device: "simulator",
      app: "ios.release",
    },
  },
};
