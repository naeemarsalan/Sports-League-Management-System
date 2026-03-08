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

describeE2E("Leagues E2E", () => {
  let admin;
  let user;
  const cleanupDocs = [];

  beforeAll(async () => {
    admin = getAdminClient();
    user = await createTestUser("league");
  });

  afterAll(async () => {
    for (const [colId, docId] of cleanupDocs) {
      await adminDeleteDoc(colId, docId);
    }
    await user.cleanup();
  });

  // Helper: generate a 6-char invite code (same logic as the app)
  function generateInviteCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  it("should create a league", async () => {
    const inviteCode = generateInviteCode();
    const league = await user.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.leaguesCollectionId,
      ID.unique(),
      {
        name: "E2E Test League",
        description: "Created by E2E tests",
        inviteCode,
        createdBy: user.userId,
        createdAt: new Date().toISOString(),
        isActive: true,
        memberCount: 1,
      }
    );
    cleanupDocs.push([CONFIG.leaguesCollectionId, league.$id]);

    expect(league.$id).toBeTruthy();
    expect(league.name).toBe("E2E Test League");
    expect(league.inviteCode).toBe(inviteCode);

    // Also add creator as owner member
    const membership = await user.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.leagueMembersCollectionId,
      ID.unique(),
      {
        leagueId: league.$id,
        userId: user.userId,
        role: "owner",
        status: "approved",
        joinedAt: new Date().toISOString(),
        requestedAt: new Date().toISOString(),
      }
    );
    cleanupDocs.push([CONFIG.leagueMembersCollectionId, membership.$id]);

    expect(membership.role).toBe("owner");
  });

  it("should list active leagues", async () => {
    const response = await user.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.leaguesCollectionId,
      [Query.equal("isActive", true), Query.limit(100)]
    );

    expect(response.documents).toBeDefined();
    expect(response.documents.length).toBeGreaterThan(0);
  });

  it("should find a league by invite code", async () => {
    // Create a league with a known invite code
    const inviteCode = generateInviteCode();
    const league = await user.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.leaguesCollectionId,
      ID.unique(),
      {
        name: "Invite Code League",
        description: "",
        inviteCode,
        createdBy: user.userId,
        createdAt: new Date().toISOString(),
        isActive: true,
        memberCount: 1,
      }
    );
    cleanupDocs.push([CONFIG.leaguesCollectionId, league.$id]);

    // Find by invite code
    const response = await user.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.leaguesCollectionId,
      [Query.equal("inviteCode", inviteCode), Query.equal("isActive", true)]
    );

    expect(response.documents).toHaveLength(1);
    expect(response.documents[0].$id).toBe(league.$id);
  });

  it("should update league settings", async () => {
    const league = await user.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.leaguesCollectionId,
      ID.unique(),
      {
        name: "Old Name",
        description: "Old desc",
        inviteCode: generateInviteCode(),
        createdBy: user.userId,
        createdAt: new Date().toISOString(),
        isActive: true,
        memberCount: 1,
      }
    );
    cleanupDocs.push([CONFIG.leaguesCollectionId, league.$id]);

    const updated = await user.databases.updateDocument(
      CONFIG.databaseId,
      CONFIG.leaguesCollectionId,
      league.$id,
      { name: "New Name", description: "New desc" }
    );

    expect(updated.name).toBe("New Name");
    expect(updated.description).toBe("New desc");
  });

  it("should soft-delete a league (set isActive=false)", async () => {
    const league = await user.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.leaguesCollectionId,
      ID.unique(),
      {
        name: "To Delete",
        description: "",
        inviteCode: generateInviteCode(),
        createdBy: user.userId,
        createdAt: new Date().toISOString(),
        isActive: true,
        memberCount: 1,
      }
    );
    cleanupDocs.push([CONFIG.leaguesCollectionId, league.$id]);

    const deleted = await user.databases.updateDocument(
      CONFIG.databaseId,
      CONFIG.leaguesCollectionId,
      league.$id,
      { isActive: false }
    );

    expect(deleted.isActive).toBe(false);

    // Should NOT appear in active leagues list
    const response = await user.databases.listDocuments(
      CONFIG.databaseId,
      CONFIG.leaguesCollectionId,
      [Query.equal("inviteCode", league.inviteCode), Query.equal("isActive", true)]
    );
    expect(response.documents).toHaveLength(0);
  });
});
