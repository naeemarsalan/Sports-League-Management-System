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

/** Dismiss "Use Strong Password" popup that iOS shows on registration forms */
async function dismissStrongPasswordPrompt() {
  try {
    // iOS shows "Use Strong Password" sheet — tap "Choose My Own Password"
    await waitFor(element(by.label("Choose My Own Password")))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.label("Choose My Own Password")).tap();
    await delay(500);
  } catch (e) {
    // No strong password prompt appeared — that's fine
    try {
      // Alternative: might say "Not Now" or other text
      await element(by.label("Not Now")).tap();
    } catch (e2) {
      // No popup at all
    }
  }
}

/** Login helper — handles double-tap bug and save password */
async function loginUser(email, password) {
  await device.disableSynchronization();

  await element(by.id("input-email")).tap();
  await element(by.id("input-email")).typeText(email);
  await element(by.id("input-password")).tap();
  await element(by.id("input-password")).typeText(password);

  await element(by.id("btn-login")).tap();
  await delay(500);
  await element(by.id("btn-login")).tap();

  await delay(2000);
  await dismissSavePassword();

  await waitFor(element(by.id("dashboard-container")))
    .toBeVisible()
    .withTimeout(20000);
  await device.enableSynchronization();
}

/** Logout helper — navigates to Profile tab, taps Log Out, confirms */
async function logoutUser() {
  await element(by.text("Profile")).tap();

  await waitFor(element(by.id("btn-logout")))
    .toBeVisible()
    .withTimeout(5000);

  await device.disableSynchronization();
  await element(by.id("btn-logout")).tap();

  // The alert has title "Sign Out" and a destructive button also labeled "Sign Out"
  // Use the button (second occurrence)
  await delay(1000);

  // Tap the destructive "Sign Out" button (the alert button, not the title)
  try {
    await element(by.label("Sign Out")).atIndex(1).tap();
  } catch (e) {
    // Fallback: try by text
    await element(by.text("Sign Out")).atIndex(1).tap();
  }

  await waitFor(element(by.id("input-email")))
    .toBeVisible()
    .withTimeout(15000);
  await device.enableSynchronization();
}

describe("Full League Flow", () => {
  let inviteCode;

  afterAll(async () => {
    try {
      await cleanupTestUsers([USER1_EMAIL, USER2_EMAIL]);
    } catch (e) {
      console.warn("Cleanup error:", e.message);
    }
  });

  // ─── Step 1: Register User 1 ───────────────────────────────
  it("should register User 1", async () => {
    // Navigate to Register screen via testID
    await element(by.id("link-register")).tap();

    await waitFor(element(by.id("input-register-name")))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id("input-register-name")).tap();
    await element(by.id("input-register-name")).typeText(USER1_NAME);
    await element(by.id("input-register-email")).tap();
    await element(by.id("input-register-email")).typeText(USER1_EMAIL);

    // Tapping password field may trigger "Use Strong Password" popup
    await device.disableSynchronization();
    await element(by.id("input-register-password")).tap();
    await delay(1000);
    await dismissStrongPasswordPrompt();
    await element(by.id("input-register-password")).typeText(PASSWORD);

    // Accept terms
    await element(by.id("checkbox-agree")).tap();

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
    await waitFor(element(by.id("btn-create-league")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id("btn-create-league")).tap();

    await waitFor(element(by.id("input-league-name")))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id("input-league-name")).tap();
    await element(by.id("input-league-name")).typeText(LEAGUE_NAME);

    // Open Advanced Settings
    await element(by.id("btn-advanced-settings")).tap();

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

    await waitFor(element(by.id("dashboard-container")))
      .toBeVisible()
      .withTimeout(15000);
    await device.enableSynchronization();
  });

  // ─── Step 4: Fetch invite code via API ──────────────────────
  it("should fetch the invite code", async () => {
    const user1 = await findUserByEmail(USER1_EMAIL);
    expect(user1).toBeTruthy();
    inviteCode = await getInviteCodeForUser(user1.$id);
    expect(inviteCode).toBeTruthy();
    expect(inviteCode.length).toBe(6);
    console.log(`Invite code: ${inviteCode}`);
  });

  // ─── Step 5: Log out User 1 ────────────────────────────────
  it("should log out User 1", async () => {
    await logoutUser();
  });

  // ─── Step 6: Register User 2 ───────────────────────────────
  it("should register User 2", async () => {
    await element(by.id("link-register")).tap();

    await waitFor(element(by.id("input-register-name")))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id("input-register-name")).tap();
    await element(by.id("input-register-name")).typeText(USER2_NAME);
    await element(by.id("input-register-email")).tap();
    await element(by.id("input-register-email")).typeText(USER2_EMAIL);

    // Tapping password field may trigger "Use Strong Password" popup
    await device.disableSynchronization();
    await element(by.id("input-register-password")).tap();
    await delay(1000);
    await dismissStrongPasswordPrompt();
    await element(by.id("input-register-password")).typeText(PASSWORD);

    await element(by.id("checkbox-agree")).tap();

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
    await waitFor(element(by.id("btn-join-league")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id("btn-join-league")).tap();

    await waitFor(element(by.id("input-invite-code")))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id("input-invite-code")).tap();
    await element(by.id("input-invite-code")).typeText(inviteCode);

    await device.disableSynchronization();
    await element(by.id("btn-find-league")).tap();

    await waitFor(element(by.id("btn-request-join")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id("btn-request-join")).tap();

    // Alert: "Request Sent!" → OK
    await waitFor(element(by.text("Request Sent!")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text("OK")).tap();

    await waitFor(element(by.id("dashboard-container")))
      .toBeVisible()
      .withTimeout(10000);
    await device.enableSynchronization();
  });

  // ─── Step 9: Log out User 2 ────────────────────────────────
  it("should log out User 2", async () => {
    await logoutUser();
  });

  // ─── Step 10: Log in User 1 ────────────────────────────────
  it("should log in User 1", async () => {
    await loginUser(USER1_EMAIL, PASSWORD);
  });

  // ─── Step 11: Accept User 2 ────────────────────────────────
  it("should accept User 2 into the league", async () => {
    // Navigate to Manage Members via "Manage Members" button on dashboard
    await device.disableSynchronization();
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
    await delay(1000);
    await element(by.text("Approve")).tap();

    await delay(2000);
    await device.enableSynchronization();
  });

  // ─── Step 12: Promote User 2 to mod ────────────────────────
  it("should promote User 2 to moderator", async () => {
    // Switch to Members tab
    await element(by.id("tab-members")).tap();
    await delay(2000);

    // Tap the "..." button on User 2's row
    await device.disableSynchronization();
    await waitFor(element(by.id("btn-member-actions")))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id("btn-member-actions")).tap();

    // Alert: "Choose an action" → "Change Role"
    await delay(1000);
    await element(by.text("Change Role")).tap();

    // Alert: "Select a new role" → "Moderator"
    await delay(1000);
    await element(by.text("Moderator")).tap();

    await delay(2000);
    await device.enableSynchronization();
  });

  // ─── Step 13: Go back and schedule a match ──────────────────
  it("should schedule a match between User 1 and User 2", async () => {
    // Navigate back to dashboard using the back button
    await device.disableSynchronization();
    try {
      await element(by.label("Back")).atIndex(0).tap();
    } catch (e) {
      // Fallback: try system back gesture - swipe from left edge
      await element(by.type("RNSScreenStackHeaderConfig")).swipe("right");
    }

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
    await logoutUser();
  });

  // ─── Step 15: Log in User 2 ────────────────────────────────
  it("should log in User 2", async () => {
    await loginUser(USER2_EMAIL, PASSWORD);
  });

  // ─── Step 16: Submit score on the match ─────────────────────
  it("should submit a score on the match", async () => {
    // Navigate to Matches tab
    await element(by.text("Matches")).tap();

    // Wait for the match row to appear and tap it
    await device.disableSynchronization();
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

    // Both players should appear on the leaderboard
    await expect(element(by.text(USER1_NAME))).toBeVisible();
    await expect(element(by.text(USER2_NAME))).toBeVisible();
  });
});
