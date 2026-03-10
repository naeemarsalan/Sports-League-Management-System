const { device } = require("detox");

beforeAll(async () => {
  await device.launchApp({ newInstance: true });
});

afterAll(async () => {
  await device.terminateApp();
});

beforeEach(async () => {
  await device.reloadReactNative();
});
