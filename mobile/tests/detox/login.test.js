require("./setup");

/** Dismiss iOS Save Password prompt by backgrounding and relaunching */
async function dismissSavePassword() {
  await device.sendToHome();
  await device.launchApp({ newInstance: false });
}

describe("Login Flow", () => {
  it("should show login screen on launch", async () => {
    await expect(element(by.id("input-email"))).toBeVisible();
    await expect(element(by.id("input-password"))).toBeVisible();
    await expect(element(by.id("btn-login"))).toBeVisible();
  });

  it("should show error with invalid credentials", async () => {
    await element(by.id("input-email")).tap();
    await element(by.id("input-email")).typeText("invalid@test.local");
    await element(by.id("input-password")).tap();
    await element(by.id("input-password")).typeText("wrongpass");

    await device.disableSynchronization();
    await element(by.id("btn-login")).tap();
    await new Promise((r) => setTimeout(r, 500));
    await element(by.id("btn-login")).tap();

    await waitFor(element(by.text("Login failed")))
      .toBeVisible()
      .withTimeout(15000);
    await element(by.text("OK")).tap();
    await device.enableSynchronization();
  });

  it("should login with valid credentials and show dashboard", async () => {
    const email = process.env.DETOX_TEST_EMAIL || "detox-test@test.local";
    const password = process.env.DETOX_TEST_PASSWORD || "TestPass1234!";

    await device.launchApp({ newInstance: true });

    await element(by.id("input-email")).tap();
    await element(by.id("input-email")).typeText(email);
    await element(by.id("input-password")).tap();
    await element(by.id("input-password")).typeText(password);

    await device.disableSynchronization();
    await element(by.id("btn-login")).tap();
    await new Promise((r) => setTimeout(r, 500));
    await element(by.id("btn-login")).tap();

    // Dismiss Save Password prompt
    await new Promise((r) => setTimeout(r, 2000));
    await dismissSavePassword();

    await waitFor(element(by.id("dashboard-container")))
      .toBeVisible()
      .withTimeout(20000);
    await device.enableSynchronization();
  });
});
