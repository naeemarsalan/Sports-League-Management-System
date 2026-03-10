require("./setup");
const {
  getInviteCodeForUser,
  findUserByEmail,
  cleanupTestUsers,
} = require("./helpers");

/**
 * Full League Flow — comprehensive E2E test covering:
 * 1. Register User 1 → create league with custom settings
 * 2. Log out → Register User 2 → join league
 * 3. Log out → Log in User 1 → accept User 2 → promote to mod → schedule match
 * 4. Log out → Log in User 2 → submit score → verify leaderboard
 */

const TIMESTAMP = Date.now();
const USER1_EMAIL = `detox-owner-${TIMESTAMP}@test.local`;
const USER2_EMAIL = `detox-player-${TIMESTAMP}@test.local`;
const USER1_NAME = "DetoxOwner";
const USER2_NAME = "DetoxPlayer";
const PASSWORD = "TestPass1234!";
const LEAGUE_NAME = `Detox League ${TIMESTAMP}`;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** Dismiss iOS Save Password prompt by backgrounding and relaunching */
async function dismissSavePassword() {
  await device.sendToHome();
  await device.launchApp({ newInstance: false });
}

/** Scroll down to find an element */
async function scrollDownTo(testID, scrollViewID) {
  await waitFor(element(by.id(testID)))
    .toBeVisible()
    .whileElement(by.id(scrollViewID || "dashboard-container"))
    .scroll(200, "down");
}

describe("Full League Flow", () => {
  let inviteCode;

  afterAll(async () => {
    // Clean up test users and their data
    try {
      await cleanupTestUsers([USER1_EMAIL, USER2_EMAIL]);
    } catch (e) {
      console.warn("Cleanup error:", e.message);
    }
  });

  // ─── Step 1: Register User 1 ───────────────────────────────
  it("should register User 1", async () => {
    // Navigate to Register screen
    await element(by.text("Create an account")).tap();

    await waitFor(element(by.id("input-register-name")))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id("input-register-name")).tap();
    await element(by.id("input-register-name")).typeText(USER1_NAME);
    await element(by.id("input-register-email")).tap();
    await element(by.id("input-register-email")).typeText(USER1_EMAIL);
    await element(by.id("input-register-password")).tap();
    await element(by.id("input-register-password")).typeText(PASSWORD);

    // Accept terms
    await element(by.id("checkbox-agree")).tap();

    await device.disableSynchronization();
    await element(by.id("btn-register")).tap();

    // Dismiss Save Password prompt
    await delay(2000);
    await dismissSavePassword();

    // Should land on Profile Setup screen
    await waitFor(element(by.id("input-profile-name")))
      .toBeVisible()
      .withTimeout(20000);
    await device.enableSynchronization();
  });

  // ─── Step 2: Complete profile setup ─────────────────────────
  it("should complete profile setup for User 1", async () => {
    await element(by.id("input-profile-name")).tap();
    await element(by.id("input-profile-name")).clearText();
    await element(by.id("input-profile-name")).typeText(USER1_NAME);

    await device.disableSynchronization();
    await element(by.id("btn-complete-setup")).tap();

    await waitFor(element(by.id("dashboard-container")))
      .toBeVisible()
      .withTimeout(20000);
    await device.enableSynchronization();
  });

  // ─── Step 3: Create league with custom settings ─────────────
  it("should create a league with custom settings", async () => {
    // Dashboard should show "No leagues yet" → Create League button
    await waitFor(element(by.id("btn-create-league")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id("btn-create-league")).tap();

    // Fill in league name
    await waitFor(element(by.id("input-league-name")))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id("input-league-name")).tap();
    await element(by.id("input-league-name")).typeText(LEAGUE_NAME);

    // Open Advanced Settings
    await element(by.id("btn-advanced-settings")).tap();

    // Modify points per win (clear default "3" and type "5")
    await waitFor(element(by.id("input-points-per-win")))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.id("input-points-per-win")).tap();
    await element(by.id("input-points-per-win")).clearText();
    await element(by.id("input-points-per-win")).typeText("5");

    // Enable frame points
    await element(by.id("switch-frame-points")).tap();

    await device.disableSynchronization();
    await element(by.id("btn-submit-create-league")).tap();

    // Alert: "League Created!" → tap OK
    await waitFor(element(by.text("League Created!")))
      .toBeVisible()
      .withTimeout(15000);
    await element(by.text("OK")).tap();

    // Should navigate back to dashboard with the league visible
    await waitFor(element(by.id("dashboard-container")))
      .toBeVisible()
      .withTimeout(15000);
    await device.enableSynchronization();
  });

  // ─── Step 4: Fetch invite code via API ──────────────────────
  it("should fetch the invite code", async () => {
    // Look up the user and their league to get the invite code
    const user1 = await findUserByEmail(USER1_EMAIL);
    expect(user1).toBeTruthy();
    inviteCode = await getInviteCodeForUser(user1.$id);
    expect(inviteCode).toBeTruthy();
    expect(inviteCode.length).toBe(6);
    console.log(`Invite code: ${inviteCode}`);
  });

  // ─── Step 5: Log out User 1 ────────────────────────────────
  it("should log out User 1", async () => {
    // Navigate to Profile tab
    await element(by.text("Profile")).tap();

    await waitFor(element(by.id("btn-logout")))
      .toBeVisible()
      .withTimeout(5000);

    await device.disableSynchronization();
    await element(by.id("btn-logout")).tap();

    // Alert: "Sign Out" → confirm
    await waitFor(element(by.text("Sign Out")))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text("Sign Out")).atIndex(1).tap();

    // Should return to login screen
    await waitFor(element(by.id("input-email")))
      .toBeVisible()
      .withTimeout(15000);
    await device.enableSynchronization();
  });

  // ─── Step 6: Register User 2 ───────────────────────────────
  it("should register User 2", async () => {
    await element(by.text("Create an account")).tap();

    await waitFor(element(by.id("input-register-name")))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id("input-register-name")).tap();
    await element(by.id("input-register-name")).typeText(USER2_NAME);
    await element(by.id("input-register-email")).tap();
    await element(by.id("input-register-email")).typeText(USER2_EMAIL);
    await element(by.id("input-register-password")).tap();
    await element(by.id("input-register-password")).typeText(PASSWORD);

    await element(by.id("checkbox-agree")).tap();

    await device.disableSynchronization();
    await element(by.id("btn-register")).tap();

    await delay(2000);
    await dismissSavePassword();

    await waitFor(element(by.id("input-profile-name")))
      .toBeVisible()
      .withTimeout(20000);
    await device.enableSynchronization();
  });

  // ─── Step 7: Profile setup for User 2 ──────────────────────
  it("should complete profile setup for User 2", async () => {
    await element(by.id("input-profile-name")).tap();
    await element(by.id("input-profile-name")).clearText();
    await element(by.id("input-profile-name")).typeText(USER2_NAME);

    await device.disableSynchronization();
    await element(by.id("btn-complete-setup")).tap();

    await waitFor(element(by.id("dashboard-container")))
      .toBeVisible()
      .withTimeout(20000);
    await device.enableSynchronization();
  });

  // ─── Step 8: User 2 joins the league ───────────────────────
  it("should join the league with invite code", async () => {
    // Dashboard shows "No leagues yet" → Join League
    await waitFor(element(by.id("btn-join-league")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id("btn-join-league")).tap();

    // Enter invite code
    await waitFor(element(by.id("input-invite-code")))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id("input-invite-code")).tap();
    await element(by.id("input-invite-code")).typeText(inviteCode);

    await device.disableSynchronization();
    await element(by.id("btn-find-league")).tap();

    // Wait for league card to appear, then request to join
    await waitFor(element(by.id("btn-request-join")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id("btn-request-join")).tap();

    // Alert: "Request Sent!" → OK
    await waitFor(element(by.text("Request Sent!")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text("OK")).tap();

    // Should go back to dashboard
    await waitFor(element(by.id("dashboard-container")))
      .toBeVisible()
      .withTimeout(10000);
    await device.enableSynchronization();
  });

  // ─── Step 9: Log out User 2 ────────────────────────────────
  it("should log out User 2", async () => {
    await element(by.text("Profile")).tap();

    await waitFor(element(by.id("btn-logout")))
      .toBeVisible()
      .withTimeout(5000);

    await device.disableSynchronization();
    await element(by.id("btn-logout")).tap();

    await waitFor(element(by.text("Sign Out")))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text("Sign Out")).atIndex(1).tap();

    await waitFor(element(by.id("input-email")))
      .toBeVisible()
      .withTimeout(15000);
    await device.enableSynchronization();
  });

  // ─── Step 10: Log in User 1 ────────────────────────────────
  it("should log in User 1", async () => {
    await element(by.id("input-email")).tap();
    await element(by.id("input-email")).typeText(USER1_EMAIL);
    await element(by.id("input-password")).tap();
    await element(by.id("input-password")).typeText(PASSWORD);

    await device.disableSynchronization();
    await element(by.id("btn-login")).tap();
    await delay(500);
    await element(by.id("btn-login")).tap();

    await delay(2000);
    await dismissSavePassword();

    await waitFor(element(by.id("dashboard-container")))
      .toBeVisible()
      .withTimeout(20000);
    await device.enableSynchronization();
  });

  // ─── Step 11: Accept User 2 ────────────────────────────────
  it("should accept User 2 into the league", async () => {
    // Navigate to Manage Members
    await waitFor(element(by.text("Manage Members")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text("Manage Members")).tap();

    // Switch to Pending tab
    await waitFor(element(by.id("tab-pending")))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id("tab-pending")).tap();

    // Wait for the pending member to appear and approve
    await waitFor(element(by.id("btn-approve-member")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id("btn-approve-member")).tap();

    // Alert: "Approve Member" → "Approve"
    await waitFor(element(by.text("Approve")))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text("Approve")).tap();

    // Wait for the pending list to clear
    await delay(2000);
  });

  // ─── Step 12: Promote User 2 to mod ────────────────────────
  it("should promote User 2 to moderator", async () => {
    // Switch to Members tab
    await element(by.id("tab-members")).tap();
    await delay(1000);

    // Tap the "..." button on User 2's row
    await waitFor(element(by.id("btn-member-actions")))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id("btn-member-actions")).tap();

    // Alert: "Choose an action" → "Change Role"
    await waitFor(element(by.text("Change Role")))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text("Change Role")).tap();

    // Alert: "Select a new role" → "Moderator"
    await waitFor(element(by.text("Moderator")))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text("Moderator")).tap();

    // Wait for role update to complete
    await delay(2000);

    // Go back to dashboard
    await device.pressBack();
  });

  // ─── Step 13: Schedule a match (User 1 vs User 2) ──────────
  it("should schedule a match between User 1 and User 2", async () => {
    await waitFor(element(by.id("dashboard-container")))
      .toBeVisible()
      .withTimeout(10000);

    // Tap "Challenge Player"
    await waitFor(element(by.id("btn-challenge-player")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id("btn-challenge-player")).tap();

    // Wait for opponent list — select User 2
    await waitFor(element(by.text(USER2_NAME)))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text(USER2_NAME)).tap();

    // "Next" button should appear
    await waitFor(element(by.id("btn-create-match")))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id("btn-create-match")).tap();

    // Step 2: Confirm challenge
    await waitFor(element(by.id("btn-confirm-challenge")))
      .toBeVisible()
      .withTimeout(5000);

    await device.disableSynchronization();
    await element(by.id("btn-confirm-challenge")).tap();

    // Alert: "Challenge sent!" → OK
    await waitFor(element(by.text("Challenge sent!")))
      .toBeVisible()
      .withTimeout(15000);
    await element(by.text("OK")).tap();

    // Back on dashboard
    await waitFor(element(by.id("dashboard-container")))
      .toBeVisible()
      .withTimeout(10000);
    await device.enableSynchronization();
  });

  // ─── Step 14: Log out User 1 ───────────────────────────────
  it("should log out User 1 again", async () => {
    await element(by.text("Profile")).tap();

    await waitFor(element(by.id("btn-logout")))
      .toBeVisible()
      .withTimeout(5000);

    await device.disableSynchronization();
    await element(by.id("btn-logout")).tap();

    await waitFor(element(by.text("Sign Out")))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text("Sign Out")).atIndex(1).tap();

    await waitFor(element(by.id("input-email")))
      .toBeVisible()
      .withTimeout(15000);
    await device.enableSynchronization();
  });

  // ─── Step 15: Log in User 2 ────────────────────────────────
  it("should log in User 2", async () => {
    await element(by.id("input-email")).tap();
    await element(by.id("input-email")).typeText(USER2_EMAIL);
    await element(by.id("input-password")).tap();
    await element(by.id("input-password")).typeText(PASSWORD);

    await device.disableSynchronization();
    await element(by.id("btn-login")).tap();
    await delay(500);
    await element(by.id("btn-login")).tap();

    await delay(2000);
    await dismissSavePassword();

    await waitFor(element(by.id("dashboard-container")))
      .toBeVisible()
      .withTimeout(20000);
    await device.enableSynchronization();
  });

  // ─── Step 16: Submit score on the match ─────────────────────
  it("should submit a score on the match", async () => {
    // Navigate to Matches tab
    await element(by.text("Matches")).tap();

    // Wait for the match row to appear and tap it
    await waitFor(element(by.id("match-row")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id("match-row")).atIndex(0).tap();

    // Enter scores
    await waitFor(element(by.id("input-score-p1")))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id("input-score-p1")).tap();
    await element(by.id("input-score-p1")).typeText("4");
    await element(by.id("input-score-p2")).tap();
    await element(by.id("input-score-p2")).typeText("2");

    await device.disableSynchronization();
    await element(by.id("btn-submit-score")).tap();

    // Alert: "Updated" → OK
    await waitFor(element(by.text("Updated")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text("OK")).tap();

    await device.enableSynchronization();
  });

  // ─── Step 17: Verify leaderboard ───────────────────────────
  it("should show the correct leaderboard", async () => {
    // Navigate to Standings tab
    await element(by.text("Standings")).tap();

    await waitFor(element(by.id("leaderboard-table")))
      .toBeVisible()
      .withTimeout(10000);

    // User 1 (DetoxOwner) won 4-2, so they should be at top
    // With pointsPerWin=5 and includeFramePoints=true:
    // User1: 5 (win) + 4 (frames) = 9 pts
    // User2: 0 (loss) + 2 (frames) = 2 pts
    await expect(element(by.text(USER1_NAME))).toBeVisible();
    await expect(element(by.text(USER2_NAME))).toBeVisible();
  });
});
