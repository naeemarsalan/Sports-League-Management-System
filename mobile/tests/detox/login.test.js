const { device, element, by, expect: detoxExpect } = require("detox");

require("./setup");

describe("Login Flow", () => {
  it("should show login screen on launch", async () => {
    await detoxExpect(element(by.id("input-email"))).toBeVisible();
    await detoxExpect(element(by.id("input-password"))).toBeVisible();
    await detoxExpect(element(by.id("btn-login"))).toBeVisible();
  });

  it("should show error with invalid credentials", async () => {
    await element(by.id("input-email")).typeText("invalid@test.local");
    await element(by.id("input-password")).typeText("wrongpass");
    await element(by.id("btn-login")).tap();

    // Wait for error to appear (alert or inline error)
    await waitFor(element(by.text(/invalid|incorrect|error/i)))
      .toBeVisible()
      .withTimeout(5000);
  });

  it("should login with valid credentials and show dashboard", async () => {
    // These credentials should be for a pre-existing test account
    // Set via environment variables for CI
    const email = process.env.DETOX_TEST_EMAIL || "detox-test@test.local";
    const password = process.env.DETOX_TEST_PASSWORD || "TestPass1234!";

    await element(by.id("input-email")).clearText();
    await element(by.id("input-email")).typeText(email);
    await element(by.id("input-password")).clearText();
    await element(by.id("input-password")).typeText(password);
    await element(by.id("btn-login")).tap();

    // Wait for dashboard to appear
    await waitFor(element(by.id("dashboard-container")))
      .toBeVisible()
      .withTimeout(10000);
  });
});
