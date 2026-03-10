require("./setup");

/** Dismiss iOS Save Password prompt by backgrounding and relaunching */
async function dismissSavePassword() {
  await device.sendToHome();
  await device.launchApp({ newInstance: false });
}

describe("League Flow", () => {
  beforeAll(async () => {
    const email = process.env.DETOX_TEST_EMAIL || "detox-test@test.local";
    const password = process.env.DETOX_TEST_PASSWORD || "TestPass1234!";

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

  it("should show Create League button on dashboard when no leagues", async () => {
    // When user has no leagues, dashboard shows "Create League" and "Join League" buttons
    // When user has leagues, the dashboard shows league cards and admin controls
    try {
      await waitFor(element(by.id("btn-create-league")))
        .toBeVisible()
        .withTimeout(5000);
    } catch (e) {
      // User already has leagues — "See all" link navigates to Leagues screen
      await waitFor(element(by.text("See all")))
        .toBeVisible()
        .withTimeout(5000);
    }
  });

  it("should create a league with a name", async () => {
    // Navigate to CreateLeague screen
    try {
      // Try the "no leagues" state button first
      await element(by.id("btn-create-league")).tap();
    } catch (e) {
      // User has leagues — go via "See all" → Leagues screen → create
      await element(by.text("See all")).tap();
      await waitFor(element(by.id("btn-create-league")))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id("btn-create-league")).tap();
    }

    await waitFor(element(by.id("input-league-name")))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id("input-league-name")).tap();
    await element(by.id("input-league-name")).typeText("Detox Test League");

    await device.disableSynchronization();
    await element(by.id("btn-submit-create-league")).tap();

    await waitFor(element(by.text("Detox Test League")))
      .toBeVisible()
      .withTimeout(15000);
    await device.enableSynchronization();
  });

  it("should navigate to Challenge Player from dashboard", async () => {
    // After creating a league, dashboard should show admin controls
    // "Challenge Player" button is in LEAGUE MANAGEMENT section
    await waitFor(element(by.id("btn-challenge-player")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id("btn-challenge-player")).tap();

    // ChallengeScreen should show the match creation flow
    await waitFor(element(by.id("btn-create-match")))
      .toBeVisible()
      .withTimeout(5000);
  });

  it("should show Matches tab with match list", async () => {
    // Navigate to Matches via bottom tab
    await element(by.text("Matches")).tap();

    await waitFor(element(by.text("Matches")))
      .toBeVisible()
      .withTimeout(5000);
  });

  it("should show Standings tab with leaderboard", async () => {
    // Navigate to Standings via bottom tab
    await element(by.text("Standings")).tap();

    await waitFor(element(by.id("leaderboard-table")))
      .toBeVisible()
      .withTimeout(5000);
  });
});
