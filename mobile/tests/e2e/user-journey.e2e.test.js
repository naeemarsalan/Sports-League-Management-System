/**
 * Full User Journey E2E Test
 *
 * Uses test@test.com (existing) and test2@test.com (created fresh).
 * Walks through the complete app flow:
 *   1. Login as test@test.com
 *   2. Create test2@test.com
 *   3. Create a league
 *   4. test2 joins the league
 *   5. test1 approves test2
 *   6. test1 challenges test2 (create match)
 *   7. test2 schedules the match
 *   8. test1 submits scores
 *   9. Verify leaderboard standings
 *  10. Cleanup
 */
const {
  CONFIG,
  getAdminClient,
  ID,
  Permission,
  Query,
  Role,
} = require("./helpers");

const { Client, Account, Databases } = require("node-appwrite");

const SKIP = !CONFIG.apiKey;
const describeE2E = SKIP ? describe.skip : describe;

// --- Test accounts ---
const TEST1_EMAIL = "test@test.com";
const TEST1_PASSWORD = "test1234";

const TEST2_EMAIL = "test2@test.com";
const TEST2_PASSWORD = "Test1234!";
const TEST2_NAME = "Test Player 2";

describeE2E("User Journey: League → Join → Challenge → Match → Leaderboard", () => {
  let admin;
  let user1; // test@test.com (existing)
  let user2; // test2@test.com (created)
  let user1Profile;
  let user2Profile;
  let league;
  let user1Membership;
  let user2Membership;
  let challengeMatch;
  let rematchMatch;

  // Track created resources for cleanup
  const cleanupDocs = [];
  let createdUser2 = false;

  // --- Helper: authenticate a user via admin session ---
  async function authenticateUser(userId) {
    const session = await admin.users.createSession(userId);
    const client = new Client()
      .setEndpoint(CONFIG.endpoint)
      .setProject(CONFIG.projectId)
      .setSession(session.secret);
    return {
      account: new Account(client),
      databases: new Databases(client),
    };
  }

  // --- Setup ---
  beforeAll(async () => {
    admin = getAdminClient();

    // --- User 1: test@test.com (should already exist) ---
    const existingUsers = await admin.users.list([
      Query.equal("email", TEST1_EMAIL),
    ]);
    if (existingUsers.total === 0) {
      throw new Error(
        `${TEST1_EMAIL} does not exist. Please create this account first.`
      );
    }
    const user1Data = existingUsers.users[0];
    const user1Auth = await authenticateUser(user1Data.$id);
    user1 = { userId: user1Data.$id, ...user1Auth };

    // --- User 2: test2@test.com (create fresh) ---
    // Delete if leftover from a previous run
    const existing2 = await admin.users.list([
      Query.equal("email", TEST2_EMAIL),
    ]);
    if (existing2.total > 0) {
      // Clean up old profiles for this user
      const oldProfiles = await admin.databases.listDocuments(
        CONFIG.databaseId,
        CONFIG.profilesCollectionId,
        [Query.equal("userId", existing2.users[0].$id)]
      );
      for (const p of oldProfiles.documents) {
        await admin.databases.deleteDocument(
          CONFIG.databaseId, CONFIG.profilesCollectionId, p.$id
        ).catch(() => {});
      }
      await admin.users.delete(existing2.users[0].$id);
    }

    const newUser2 = await admin.users.create(
      ID.unique(), TEST2_EMAIL, undefined, TEST2_PASSWORD, TEST2_NAME
    );
    createdUser2 = true;
    const user2Auth = await authenticateUser(newUser2.$id);
    user2 = { userId: newUser2.$id, ...user2Auth };
  });

  // --- Cleanup ---
  afterAll(async () => {
    // Delete created documents in reverse order
    for (const [colId, docId] of cleanupDocs.reverse()) {
      try {
        await admin.databases.deleteDocument(CONFIG.databaseId, colId, docId);
      } catch (e) {}
    }
    // Delete test2 user
    if (createdUser2) {
      await admin.users.delete(user2.userId).catch(() => {});
    }
  });

  // ========================================
  // STEP 1: Verify test@test.com can login
  // ========================================
  it("Step 1: test@test.com is authenticated and can access account", async () => {
    const me = await user1.account.get();
    expect(me.email).toBe(TEST1_EMAIL);
    console.log(`  ✓ Logged in as ${me.email} (${me.name})`);
  });

  // ========================================
  // STEP 2: test2@test.com is created and has a profile
  // ========================================
  it("Step 2: test2@test.com is created and sets up profile", async () => {
    const me = await user2.account.get();
    expect(me.email).toBe(TEST2_EMAIL);

    // Create profile (like the app does on first login)
    user2Profile = await user2.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.profilesCollectionId,
      ID.unique(),
      { userId: user2.userId, displayName: TEST2_NAME, role: "player" }
    );
    cleanupDocs.push([CONFIG.profilesCollectionId, user2Profile.$id]);

    expect(user2Profile.displayName).toBe(TEST2_NAME);
    console.log(`  ✓ Created profile for ${TEST2_EMAIL}: "${TEST2_NAME}"`);
  });

  // ========================================
  // STEP 3: Ensure test@test.com has a profile
  // ========================================
  it("Step 3: test@test.com has a profile", async () => {
    const res = await user1.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.profilesCollectionId,
      [Query.equal("userId", user1.userId)]
    );

    if (res.documents.length > 0) {
      user1Profile = res.documents[0];
    } else {
      // Create one if missing
      user1Profile = await user1.databases.createDocument(
        CONFIG.databaseId,
        CONFIG.profilesCollectionId,
        ID.unique(),
        { userId: user1.userId, displayName: "Test Player 1", role: "player" }
      );
      cleanupDocs.push([CONFIG.profilesCollectionId, user1Profile.$id]);
    }

    expect(user1Profile.userId).toBe(user1.userId);
    console.log(`  ✓ Profile: "${user1Profile.displayName}"`);
  });

  // ========================================
  // STEP 4: test@test.com creates a league
  // ========================================
  it("Step 4: test@test.com creates a new league", async () => {
    const inviteCode = "TEST" + Math.random().toString(36).slice(2, 4).toUpperCase();

    league = await user1.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.leaguesCollectionId,
      ID.unique(),
      {
        name: "Journey Test League",
        description: "Created during E2E user journey test",
        inviteCode,
        createdBy: user1.userId,
        createdAt: new Date().toISOString(),
        isActive: true,
        memberCount: 1,
      }
    );
    cleanupDocs.push([CONFIG.leaguesCollectionId, league.$id]);

    // Add creator as owner
    user1Membership = await user1.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.leagueMembersCollectionId,
      ID.unique(),
      {
        leagueId: league.$id,
        userId: user1.userId,
        role: "owner",
        status: "approved",
        joinedAt: new Date().toISOString(),
        requestedAt: new Date().toISOString(),
      }
    );
    cleanupDocs.push([CONFIG.leagueMembersCollectionId, user1Membership.$id]);

    expect(league.name).toBe("Journey Test League");
    expect(league.inviteCode).toBe(inviteCode);
    console.log(`  ✓ League created: "${league.name}" (code: ${inviteCode})`);
  });

  // ========================================
  // STEP 5: test2 finds league by invite code and requests to join
  // ========================================
  it("Step 5: test2@test.com finds league by invite code and requests to join", async () => {
    // Find the league
    const found = await user2.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.leaguesCollectionId,
      [Query.equal("inviteCode", league.inviteCode), Query.equal("isActive", true)]
    );
    expect(found.documents).toHaveLength(1);
    expect(found.documents[0].$id).toBe(league.$id);

    // Request to join
    user2Membership = await user2.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.leagueMembersCollectionId,
      ID.unique(),
      {
        leagueId: league.$id,
        userId: user2.userId,
        role: "player",
        status: "pending",
        requestedAt: new Date().toISOString(),
      }
    );
    cleanupDocs.push([CONFIG.leagueMembersCollectionId, user2Membership.$id]);

    expect(user2Membership.status).toBe("pending");
    console.log(`  ✓ ${TEST2_EMAIL} found league and requested to join`);
  });

  // ========================================
  // STEP 6: test1 (owner) approves test2
  // ========================================
  it("Step 6: test@test.com approves test2's join request", async () => {
    // Owner sees pending requests
    const pending = await user1.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.leagueMembersCollectionId,
      [Query.equal("leagueId", league.$id), Query.equal("status", "pending")]
    );
    expect(pending.documents.length).toBeGreaterThanOrEqual(1);

    const request = pending.documents.find((m) => m.userId === user2.userId);
    expect(request).toBeDefined();

    // Approve
    const approved = await user1.databases.updateDocument(
      CONFIG.databaseId,
      CONFIG.leagueMembersCollectionId,
      request.$id,
      { status: "approved", joinedAt: new Date().toISOString() }
    );
    user2Membership = approved;

    // Update member count
    await user1.databases.updateDocument(
      CONFIG.databaseId,
      CONFIG.leaguesCollectionId,
      league.$id,
      { memberCount: 2 }
    );

    expect(approved.status).toBe("approved");
    console.log(`  ✓ ${TEST2_NAME} approved — league now has 2 members`);
  });

  // ========================================
  // STEP 7: test1 challenges test2 (create match)
  // ========================================
  it("Step 7: test@test.com challenges test2@test.com to a match", async () => {
    challengeMatch = await user1.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      ID.unique(),
      {
        player1Id: user1.userId,
        player2Id: user2.userId,
        leagueId: league.$id,
        weekCommencing: new Date().toISOString(),
        isCompleted: false,
      },
      [
        Permission.read(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );
    cleanupDocs.push([CONFIG.matchesCollectionId, challengeMatch.$id]);

    expect(challengeMatch.player1Id).toBe(user1.userId);
    expect(challengeMatch.player2Id).toBe(user2.userId);
    expect(challengeMatch.isCompleted).toBe(false);
    console.log(`  ✓ Challenge created (match ${challengeMatch.$id})`);
  });

  // ========================================
  // STEP 8: test2 schedules the match
  // ========================================
  it("Step 8: test2@test.com schedules the match", async () => {
    const scheduledAt = new Date(Date.now() + 2 * 86400000).toISOString(); // 2 days from now

    const updated = await user2.databases.updateDocument(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      challengeMatch.$id,
      { scheduledAt }
    );

    expect(new Date(updated.scheduledAt).getTime()).toBe(new Date(scheduledAt).getTime());
    console.log(`  ✓ Match scheduled for ${scheduledAt}`);
  });

  // ========================================
  // STEP 9: test1 submits scores — test1 wins 3-1
  // ========================================
  it("Step 9: test@test.com submits scores (3-1 win)", async () => {
    const updated = await user1.databases.updateDocument(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      challengeMatch.$id,
      { scorePlayer1: 3, scorePlayer2: 1, isCompleted: true }
    );

    expect(updated.scorePlayer1).toBe(3);
    expect(updated.scorePlayer2).toBe(1);
    expect(updated.isCompleted).toBe(true);
    console.log(`  ✓ Score submitted: ${user1Profile.displayName} 3 - 1 ${TEST2_NAME}`);
  });

  // ========================================
  // STEP 10: test2 challenges test1 back (rematch)
  // ========================================
  it("Step 10: test2@test.com challenges test@test.com back", async () => {
    rematchMatch = await user2.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      ID.unique(),
      {
        player1Id: user2.userId,
        player2Id: user1.userId,
        leagueId: league.$id,
        weekCommencing: new Date().toISOString(),
        isCompleted: false,
      },
      [
        Permission.read(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );
    cleanupDocs.push([CONFIG.matchesCollectionId, rematchMatch.$id]);

    expect(rematchMatch.player1Id).toBe(user2.userId);
    console.log(`  ✓ Rematch created (match ${rematchMatch.$id})`);
  });

  // ========================================
  // STEP 11: Submit rematch scores — test2 wins 3-2
  // ========================================
  it("Step 11: test2@test.com wins the rematch 3-2", async () => {
    const updated = await user2.databases.updateDocument(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      rematchMatch.$id,
      { scorePlayer1: 3, scorePlayer2: 2, isCompleted: true }
    );

    expect(updated.scorePlayer1).toBe(3);
    expect(updated.scorePlayer2).toBe(2);
    expect(updated.isCompleted).toBe(true);
    console.log(`  ✓ Rematch score: ${TEST2_NAME} 3 - 2 ${user1Profile.displayName}`);
  });

  // ========================================
  // STEP 12: Verify leaderboard standings
  // ========================================
  it("Step 12: Leaderboard shows correct standings (1 win each, 3 pts each)", async () => {
    const matchesRes = await user1.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      [
        Query.equal("leagueId", league.$id),
        Query.equal("isCompleted", true),
        Query.limit(500),
      ]
    );
    expect(matchesRes.documents).toHaveLength(2);

    // Compute standings
    const stats = {};
    stats[user1.userId] = { name: user1Profile.displayName, wins: 0, losses: 0, points: 0 };
    stats[user2.userId] = { name: TEST2_NAME, wins: 0, losses: 0, points: 0 };

    for (const m of matchesRes.documents) {
      if (m.scorePlayer1 > m.scorePlayer2) {
        stats[m.player1Id].wins++;
        stats[m.player1Id].points += 3;
        stats[m.player2Id].losses++;
      } else if (m.scorePlayer2 > m.scorePlayer1) {
        stats[m.player2Id].wins++;
        stats[m.player2Id].points += 3;
        stats[m.player1Id].losses++;
      }
    }

    // Both should have 1 win, 1 loss, 3 points
    expect(stats[user1.userId].wins).toBe(1);
    expect(stats[user1.userId].losses).toBe(1);
    expect(stats[user1.userId].points).toBe(3);

    expect(stats[user2.userId].wins).toBe(1);
    expect(stats[user2.userId].losses).toBe(1);
    expect(stats[user2.userId].points).toBe(3);

    console.log(`  ✓ Standings:`);
    console.log(`    ${stats[user1.userId].name}: W${stats[user1.userId].wins} L${stats[user1.userId].losses} (${stats[user1.userId].points}pts)`);
    console.log(`    ${stats[user2.userId].name}: W${stats[user2.userId].wins} L${stats[user2.userId].losses} (${stats[user2.userId].points}pts)`);
  });

  // ========================================
  // STEP 13: Verify match listing filters work
  // ========================================
  it("Step 13: Match filters work (by league, by player, by status)", async () => {
    // By league
    const byLeague = await user1.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      [Query.equal("leagueId", league.$id), Query.limit(100)]
    );
    expect(byLeague.documents.length).toBeGreaterThanOrEqual(2);

    // By player
    const byPlayer = await user1.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      [Query.equal("player1Id", user1.userId), Query.limit(100)]
    );
    expect(byPlayer.documents.length).toBeGreaterThanOrEqual(1);

    // By completed status
    const completed = await user1.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      [
        Query.equal("leagueId", league.$id),
        Query.equal("isCompleted", true),
        Query.limit(100),
      ]
    );
    expect(completed.documents).toHaveLength(2);

    console.log(`  ✓ All filters working`);
  });
});
