/**
 * Matches E2E Tests
 *
 * THIS IS THE KEY TEST FILE — it verifies that users can create matches,
 * which was broken by the missing create("users") permission on the
 * matches collection.
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

describeE2E("Matches E2E", () => {
  let admin;
  let user1; // challenger
  let user2; // opponent
  let league;
  let profile1;
  let profile2;
  const cleanupDocs = [];

  beforeAll(async () => {
    admin = getAdminClient();
    user1 = await createTestUser("match-p1");
    user2 = await createTestUser("match-p2");

    // Create profiles (via admin so they always exist)
    profile1 = await adminCreateProfile(user1.userId, user1.displayName);
    cleanupDocs.push([CONFIG.profilesCollectionId, profile1.$id]);

    profile2 = await adminCreateProfile(user2.userId, user2.displayName);
    cleanupDocs.push([CONFIG.profilesCollectionId, profile2.$id]);

    // Create a league
    league = await user1.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.leaguesCollectionId,
      ID.unique(),
      {
        name: "Matches Test League",
        description: "",
        inviteCode: "MAT" + Date.now().toString(36).slice(-3).toUpperCase(),
        createdBy: user1.userId,
        createdAt: new Date().toISOString(),
        isActive: true,
        memberCount: 2,
      }
    );
    cleanupDocs.push([CONFIG.leaguesCollectionId, league.$id]);

    // Add both users as league members
    for (const u of [user1, user2]) {
      const mem = await u.databases.createDocument(
        CONFIG.databaseId,
        CONFIG.leagueMembersCollectionId,
        ID.unique(),
        {
          leagueId: league.$id,
          userId: u.userId,
          role: u === user1 ? "admin" : "player",
          status: "approved",
          joinedAt: new Date().toISOString(),
          requestedAt: new Date().toISOString(),
        }
      );
      cleanupDocs.push([CONFIG.leagueMembersCollectionId, mem.$id]);
    }
  });

  afterAll(async () => {
    for (const [colId, docId] of cleanupDocs) {
      await adminDeleteDoc(colId, docId);
    }
    await user1.cleanup();
    await user2.cleanup();
  });

  // =========================================================
  // THE CRITICAL TEST: Can a user create a match?
  // This was the "Not Authorized" bug.
  // =========================================================
  it("should allow a user to create a match with document-level permissions", async () => {
    const match = await user1.databases.createDocument(
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
    cleanupDocs.push([CONFIG.matchesCollectionId, match.$id]);

    expect(match.$id).toBeTruthy();
    expect(match.player1Id).toBe(user1.userId);
    expect(match.player2Id).toBe(user2.userId);
    expect(match.leagueId).toBe(league.$id);
    expect(match.isCompleted).toBe(false);
  });

  it("should allow the opponent to also create a match (challenge back)", async () => {
    const match = await user2.databases.createDocument(
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
    cleanupDocs.push([CONFIG.matchesCollectionId, match.$id]);

    expect(match.$id).toBeTruthy();
    expect(match.player1Id).toBe(user2.userId);
  });

  it("should list matches filtered by leagueId", async () => {
    const response = await user1.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      [
        Query.equal("leagueId", league.$id),
        Query.limit(100),
      ]
    );

    expect(response.documents.length).toBeGreaterThanOrEqual(2);
    for (const doc of response.documents) {
      expect(doc.leagueId).toBe(league.$id);
    }
  });

  it("should list matches filtered by status (upcoming)", async () => {
    const response = await user1.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      [
        Query.equal("leagueId", league.$id),
        Query.equal("isCompleted", false),
        Query.limit(100),
      ]
    );

    expect(response.documents.length).toBeGreaterThanOrEqual(1);
    for (const doc of response.documents) {
      expect(doc.isCompleted).toBe(false);
    }
  });

  it("should list matches filtered by player", async () => {
    const response = await user1.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      [
        Query.equal("player1Id", user1.userId),
        Query.limit(100),
      ]
    );

    expect(response.documents.length).toBeGreaterThanOrEqual(1);
    for (const doc of response.documents) {
      expect(doc.player1Id).toBe(user1.userId);
    }
  });

  it("should update a match to schedule it", async () => {
    // Create a match to schedule
    const match = await user1.databases.createDocument(
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
    cleanupDocs.push([CONFIG.matchesCollectionId, match.$id]);

    const scheduledAt = new Date(Date.now() + 86400000).toISOString(); // tomorrow
    const updated = await user1.databases.updateDocument(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      match.$id,
      { scheduledAt }
    );

    // Appwrite normalizes "Z" to "+00:00", so compare as Date
    expect(new Date(updated.scheduledAt).getTime()).toBe(new Date(scheduledAt).getTime());
  });

  it("should submit scores and complete a match", async () => {
    const match = await user1.databases.createDocument(
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
    cleanupDocs.push([CONFIG.matchesCollectionId, match.$id]);

    const updated = await user1.databases.updateDocument(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      match.$id,
      {
        scorePlayer1: 3,
        scorePlayer2: 2,
        isCompleted: true,
      }
    );

    expect(updated.scorePlayer1).toBe(3);
    expect(updated.scorePlayer2).toBe(2);
    expect(updated.isCompleted).toBe(true);
  });

  it("should allow the opponent to update a match (shared permissions)", async () => {
    // User1 creates a match
    const match = await user1.databases.createDocument(
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
    cleanupDocs.push([CONFIG.matchesCollectionId, match.$id]);

    // User2 (opponent) updates it
    const updated = await user2.databases.updateDocument(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      match.$id,
      { scheduledAt: new Date().toISOString() }
    );

    expect(updated.$id).toBe(match.$id);
    expect(updated.scheduledAt).toBeTruthy();
  });

  it("should filter completed matches", async () => {
    const response = await user1.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.matchesCollectionId,
      [
        Query.equal("leagueId", league.$id),
        Query.equal("isCompleted", true),
        Query.limit(100),
      ]
    );

    expect(response.documents.length).toBeGreaterThanOrEqual(1);
    for (const doc of response.documents) {
      expect(doc.isCompleted).toBe(true);
    }
  });
});
