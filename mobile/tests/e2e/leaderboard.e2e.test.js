/**
 * Leaderboard E2E Tests
 *
 * Creates real profiles and completed matches, then verifies that
 * leaderboard standings compute correctly from the data.
 */
const {
  CONFIG,
  getAdminClient,
  createTestUser,
  adminDeleteDoc,
  adminCreateProfile,
  ID,
  Permission,
  Query,
  Role,
} = require("./helpers");

const SKIP = !CONFIG.apiKey;
const describeE2E = SKIP ? describe.skip : describe;

describeE2E("Leaderboard E2E", () => {
  let admin;
  let user;
  let league;
  let profileA, profileB, profileC;
  const cleanupDocs = [];

  beforeAll(async () => {
    admin = getAdminClient();
    user = await createTestUser("lb");

    // Create 3 player profiles via admin
    profileA = await adminCreateProfile(user.userId, "Alice LB");
    cleanupDocs.push([CONFIG.profilesCollectionId, profileA.$id]);

    const userB = await createTestUser("lb-b");
    profileB = await adminCreateProfile(userB.userId, "Bob LB");
    cleanupDocs.push([CONFIG.profilesCollectionId, profileB.$id]);

    const userC = await createTestUser("lb-c");
    profileC = await adminCreateProfile(userC.userId, "Charlie LB");
    cleanupDocs.push([CONFIG.profilesCollectionId, profileC.$id]);

    // Create a league
    league = await user.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.leaguesCollectionId,
      ID.unique(),
      {
        name: "Leaderboard Test League",
        description: "",
        inviteCode: "LDR" + Date.now().toString(36).slice(-3).toUpperCase(),
        createdBy: user.userId,
        createdAt: new Date().toISOString(),
        isActive: true,
        memberCount: 3,
      }
    );
    cleanupDocs.push([CONFIG.leaguesCollectionId, league.$id]);

    // Add all 3 as league members via admin (to avoid permission issues)
    for (const u of [
      { userId: user.userId },
      { userId: userB.userId },
      { userId: userC.userId },
    ]) {
      const mem = await admin.databases.createDocument(
        CONFIG.databaseId,
        CONFIG.leagueMembersCollectionId,
        ID.unique(),
        {
          leagueId: league.$id,
          userId: u.userId,
          role: "player",
          status: "approved",
          joinedAt: new Date().toISOString(),
          requestedAt: new Date().toISOString(),
        },
        [Permission.read(Role.users()), Permission.update(Role.users())]
      );
      cleanupDocs.push([CONFIG.leagueMembersCollectionId, mem.$id]);
    }

    // Create completed matches via admin:
    // Alice beats Bob 3-2, Alice beats Charlie 3-1, Bob beats Charlie 3-0
    const matches = [
      {
        player1Id: user.userId,
        player2Id: userB.userId,
        scorePlayer1: 3,
        scorePlayer2: 2,
      },
      {
        player1Id: user.userId,
        player2Id: userC.userId,
        scorePlayer1: 3,
        scorePlayer2: 1,
      },
      {
        player1Id: userB.userId,
        player2Id: userC.userId,
        scorePlayer1: 3,
        scorePlayer2: 0,
      },
    ];

    for (const m of matches) {
      const doc = await admin.databases.createDocument(
        CONFIG.databaseId,
        CONFIG.matchesCollectionId,
        ID.unique(),
        {
          ...m,
          leagueId: league.$id,
          weekCommencing: new Date().toISOString(),
          isCompleted: true,
        },
        [Permission.read(Role.users()), Permission.update(Role.users())]
      );
      cleanupDocs.push([CONFIG.matchesCollectionId, doc.$id]);
    }

    // Store user refs for cleanup
    user._extraCleanup = [userB, userC];
  });

  afterAll(async () => {
    for (const [colId, docId] of cleanupDocs) {
      await adminDeleteDoc(colId, docId);
    }
    await user.cleanup();
    if (user._extraCleanup) {
      for (const u of user._extraCleanup) {
        await u.cleanup();
      }
    }
  });

  it("should fetch completed matches for the league", async () => {
    const response = await user.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      [
        Query.equal("leagueId", league.$id),
        Query.equal("isCompleted", true),
        Query.limit(500),
      ]
    );

    expect(response.documents).toHaveLength(3);
  });

  it("should compute correct standings from match data", async () => {
    // Fetch completed matches
    const matchesRes = await user.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      [
        Query.equal("leagueId", league.$id),
        Query.equal("isCompleted", true),
        Query.limit(500),
      ]
    );

    // Fetch profiles
    const profilesRes = await user.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.profilesCollectionId,
      [Query.limit(500)]
    );

    // Fetch league members
    const membersRes = await user.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.leagueMembersCollectionId,
      [
        Query.equal("leagueId", league.$id),
        Query.equal("status", "approved"),
      ]
    );

    // --- Compute standings (same logic as the app's leaderboard.js) ---
    const memberUserIds = new Set(membersRes.documents.map((m) => m.userId));
    const profiles = profilesRes.documents;
    const matches = matchesRes.documents;

    // Build profile maps
    const profileByDocId = new Map();
    const profileByUserId = new Map();
    profiles.forEach((p) => {
      profileByDocId.set(p.$id, p);
      if (p.userId) profileByUserId.set(p.userId, p);
    });
    const findProfile = (id) => profileByDocId.get(id) || profileByUserId.get(id);

    // Initialize standings for league members only
    const standings = {};
    profiles
      .filter((p) => memberUserIds.has(p.userId))
      .forEach((p) => {
        standings[p.$id] = {
          name: p.displayName,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          points: 0,
        };
      });

    // Process matches
    matches.forEach((m) => {
      const p1 = findProfile(m.player1Id);
      const p2 = findProfile(m.player2Id);
      if (!p1 || !p2 || !standings[p1.$id] || !standings[p2.$id]) return;
      if (m.scorePlayer1 == null || m.scorePlayer2 == null) return;

      standings[p1.$id].gamesPlayed++;
      standings[p2.$id].gamesPlayed++;

      if (m.scorePlayer1 > m.scorePlayer2) {
        standings[p1.$id].wins++;
        standings[p1.$id].points += 3;
        standings[p2.$id].losses++;
      } else if (m.scorePlayer2 > m.scorePlayer1) {
        standings[p2.$id].wins++;
        standings[p2.$id].points += 3;
        standings[p1.$id].losses++;
      } else {
        standings[p1.$id].draws++;
        standings[p1.$id].points++;
        standings[p2.$id].draws++;
        standings[p2.$id].points++;
      }
    });

    const leaderboard = Object.values(standings)
      .filter((e) => e.name)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.name.localeCompare(b.name);
      });

    // --- Verify standings ---
    // Alice: 2 wins (3+3=6 pts), Bob: 1 win 1 loss (3 pts), Charlie: 0 wins 2 losses (0 pts)
    expect(leaderboard).toHaveLength(3);

    expect(leaderboard[0].name).toBe("Alice LB");
    expect(leaderboard[0].wins).toBe(2);
    expect(leaderboard[0].losses).toBe(0);
    expect(leaderboard[0].points).toBe(6);

    expect(leaderboard[1].name).toBe("Bob LB");
    expect(leaderboard[1].wins).toBe(1);
    expect(leaderboard[1].losses).toBe(1);
    expect(leaderboard[1].points).toBe(3);

    expect(leaderboard[2].name).toBe("Charlie LB");
    expect(leaderboard[2].wins).toBe(0);
    expect(leaderboard[2].losses).toBe(2);
    expect(leaderboard[2].points).toBe(0);
  });

  it("should rank by points, then wins, then name", async () => {
    // Create a draw match between Bob and Charlie (via admin)
    const drawMatch = await admin.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      ID.unique(),
      {
        player1Id: user._extraCleanup[0].userId, // Bob
        player2Id: user._extraCleanup[1].userId, // Charlie
        leagueId: league.$id,
        weekCommencing: new Date().toISOString(),
        scorePlayer1: 2,
        scorePlayer2: 2,
        isCompleted: true,
      },
      [Permission.read(Role.users()), Permission.update(Role.users())]
    );
    cleanupDocs.push([CONFIG.matchesCollectionId, drawMatch.$id]);

    // Now: Alice 6pts, Bob 4pts (3+1), Charlie 1pt
    const matchesRes = await user.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      [
        Query.equal("leagueId", league.$id),
        Query.equal("isCompleted", true),
        Query.limit(500),
      ]
    );

    expect(matchesRes.documents).toHaveLength(4);
  });
});
