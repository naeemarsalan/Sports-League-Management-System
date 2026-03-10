const { device, element, by, expect: detoxExpect } = require("detox");

require("./setup");

describe("League Flow", () => {
  beforeAll(async () => {
    // Login first
    const email = process.env.DETOX_TEST_EMAIL || "detox-test@test.local";
    const password = process.env.DETOX_TEST_PASSWORD || "TestPass1234!";

    await element(by.id("input-email")).typeText(email);
    await element(by.id("input-password")).typeText(password);
    await element(by.id("btn-login")).tap();

    await waitFor(element(by.id("dashboard-container")))
      .toBeVisible()
      .withTimeout(10000);
  });

  it("should navigate to Leagues and show Create League option", async () => {
    // Navigate to leagues screen via dashboard or tab
    await element(by.text("Leagues")).tap();

    await waitFor(element(by.id("btn-create-league")))
      .toBeVisible()
      .withTimeout(5000);
  });

  it("should create a league with a name", async () => {
    await element(by.id("btn-create-league")).tap();

    await waitFor(element(by.id("input-league-name")))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id("input-league-name")).typeText("Detox Test League");
    await element(by.id("btn-submit-create-league")).tap();

    // Should see success or navigate back to leagues list
    await waitFor(element(by.text("Detox Test League")))
      .toBeVisible()
      .withTimeout(10000);
  });

  it("should navigate to Challenge and create a match", async () => {
    // Navigate to Challenge screen
    await element(by.text("Matches")).tap();
    await element(by.id("btn-create-match")).tap();

    await waitFor(element(by.text("Challenge Player")))
      .toBeVisible()
      .withTimeout(5000);

    // Select first available opponent
    // The opponent list is dynamic — tap the first item
    await element(by.id("opponent-list")).atIndex(0).tap();

    // Confirm challenge
    await element(by.id("btn-confirm-challenge")).tap();

    await waitFor(element(by.text(/match created|challenge sent/i)))
      .toBeVisible()
      .withTimeout(10000);
  });

  it("should submit scores on a match", async () => {
    // Navigate to the match detail
    await element(by.text("Matches")).tap();

    // Tap the first match in the list
    await element(by.id("match-list-item")).atIndex(0).tap();

    await waitFor(element(by.id("input-score-p1")))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id("input-score-p1")).typeText("3");
    await element(by.id("input-score-p2")).typeText("1");
    await element(by.id("btn-submit-score")).tap();

    await waitFor(element(by.text(/score.*submitted|completed/i)))
      .toBeVisible()
      .withTimeout(10000);
  });

  it("should show updated leaderboard", async () => {
    await element(by.text("Standings")).tap();

    await waitFor(element(by.id("leaderboard-table")))
      .toBeVisible()
      .withTimeout(5000);
  });
});
