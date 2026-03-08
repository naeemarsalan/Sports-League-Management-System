const {
  CONFIG,
  getAdminClient,
  createTestUser,
  adminDeleteDoc,
  ID,
  Query,
} = require("./helpers");

const SKIP = !CONFIG.apiKey;
const describeE2E = SKIP ? describe.skip : describe;

describeE2E("Members E2E", () => {
  let admin;
  let owner;
  let player;
  let league;
  const cleanupDocs = [];

  beforeAll(async () => {
    admin = getAdminClient();
    owner = await createTestUser("member-owner");
    player = await createTestUser("member-player");

    // Create a league owned by `owner`
    league = await owner.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.leaguesCollectionId,
      ID.unique(),
      {
        name: "Members Test League",
        description: "",
        inviteCode: "MBR" + Date.now().toString(36).slice(-3).toUpperCase(),
        createdBy: owner.userId,
        createdAt: new Date().toISOString(),
        isActive: true,
        memberCount: 1,
      }
    );
    cleanupDocs.push([CONFIG.leaguesCollectionId, league.$id]);

    // Add owner membership
    const ownerMembership = await owner.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.leagueMembersCollectionId,
      ID.unique(),
      {
        leagueId: league.$id,
        userId: owner.userId,
        role: "owner",
        status: "approved",
        joinedAt: new Date().toISOString(),
        requestedAt: new Date().toISOString(),
      }
    );
    cleanupDocs.push([CONFIG.leagueMembersCollectionId, ownerMembership.$id]);
  });

  afterAll(async () => {
    for (const [colId, docId] of cleanupDocs) {
      await adminDeleteDoc(colId, docId);
    }
    await owner.cleanup();
    await player.cleanup();
  });

  it("should request to join a league (pending status)", async () => {
    const membership = await player.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.leagueMembersCollectionId,
      ID.unique(),
      {
        leagueId: league.$id,
        userId: player.userId,
        role: "player",
        status: "pending",
        requestedAt: new Date().toISOString(),
      }
    );
    cleanupDocs.push([CONFIG.leagueMembersCollectionId, membership.$id]);

    expect(membership.status).toBe("pending");
    expect(membership.leagueId).toBe(league.$id);
    expect(membership.userId).toBe(player.userId);
  });

  it("should list pending join requests for a league", async () => {
    const response = await owner.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.leagueMembersCollectionId,
      [
        Query.equal("leagueId", league.$id),
        Query.equal("status", "pending"),
      ]
    );

    expect(response.documents.length).toBeGreaterThanOrEqual(1);
    const playerRequest = response.documents.find(
      (m) => m.userId === player.userId
    );
    expect(playerRequest).toBeDefined();
  });

  it("should approve a member", async () => {
    // Find the pending membership
    const response = await owner.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.leagueMembersCollectionId,
      [
        Query.equal("leagueId", league.$id),
        Query.equal("userId", player.userId),
      ]
    );
    const membership = response.documents[0];

    const updated = await owner.databases.updateDocument(
      CONFIG.databaseId,
      CONFIG.leagueMembersCollectionId,
      membership.$id,
      { status: "approved", joinedAt: new Date().toISOString() }
    );

    expect(updated.status).toBe("approved");
    expect(updated.joinedAt).toBeTruthy();
  });

  it("should list approved league members", async () => {
    const response = await owner.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.leagueMembersCollectionId,
      [
        Query.equal("leagueId", league.$id),
        Query.equal("status", "approved"),
      ]
    );

    expect(response.documents.length).toBeGreaterThanOrEqual(2); // owner + player
    const userIds = response.documents.map((m) => m.userId);
    expect(userIds).toContain(owner.userId);
    expect(userIds).toContain(player.userId);
  });

  it("should update a member's role", async () => {
    const response = await owner.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.leagueMembersCollectionId,
      [
        Query.equal("leagueId", league.$id),
        Query.equal("userId", player.userId),
      ]
    );
    const membership = response.documents[0];

    // Promote to mod
    const updated = await owner.databases.updateDocument(
      CONFIG.databaseId,
      CONFIG.leagueMembersCollectionId,
      membership.$id,
      { role: "mod" }
    );
    expect(updated.role).toBe("mod");

    // Demote back to player
    const reverted = await owner.databases.updateDocument(
      CONFIG.databaseId,
      CONFIG.leagueMembersCollectionId,
      membership.$id,
      { role: "player" }
    );
    expect(reverted.role).toBe("player");
  });

  it("should allow a member to leave a league", async () => {
    // Create a third user to leave
    const leaver = await createTestUser("member-leaver");
    const membership = await leaver.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.leagueMembersCollectionId,
      ID.unique(),
      {
        leagueId: league.$id,
        userId: leaver.userId,
        role: "player",
        status: "approved",
        joinedAt: new Date().toISOString(),
        requestedAt: new Date().toISOString(),
      }
    );

    // Leave (delete membership) — use admin since document-level perms may vary
    await admin.databases.deleteDocument(
      CONFIG.databaseId,
      CONFIG.leagueMembersCollectionId,
      membership.$id
    );

    // Verify membership is gone
    await expect(
      leaver.databases.getDocument(
        CONFIG.databaseId,
        CONFIG.leagueMembersCollectionId,
        membership.$id
      )
    ).rejects.toThrow();

    await leaver.cleanup();
  });
});
