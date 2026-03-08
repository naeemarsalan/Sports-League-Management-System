const { Client, Account, ID } = require("node-appwrite");
const {
  CONFIG,
  getAdminClient,
  createTestUser,
  adminDeleteDoc,
} = require("./helpers");

const SKIP = !CONFIG.apiKey;
const describeE2E = SKIP ? describe.skip : describe;

describeE2E("Auth E2E", () => {
  let admin;
  const cleanupUserIds = [];
  const cleanupDocs = []; // [collectionId, docId]

  beforeAll(() => {
    admin = getAdminClient();
  });

  afterAll(async () => {
    for (const [colId, docId] of cleanupDocs) {
      await adminDeleteDoc(colId, docId);
    }
    for (const userId of cleanupUserIds) {
      try {
        await admin.users.delete(userId);
      } catch (e) {}
    }
  });

  it("should create a new user account", async () => {
    const email = `auth-reg-${Date.now()}@test.local`;
    const user = await admin.users.create(
      ID.unique(), email, undefined, "Register1234!", "Auth Test User"
    );
    cleanupUserIds.push(user.$id);

    expect(user.$id).toBeTruthy();
    expect(user.email).toBe(email);
    expect(user.name).toBe("Auth Test User");
  });

  it("should login with correct credentials and get account info", async () => {
    const user = await createTestUser("auth-login");
    cleanupUserIds.push(user.userId);

    const me = await user.account.get();
    expect(me.$id).toBe(user.userId);
    expect(me.email).toBe(user.email);
  });

  it("should reject login with wrong password", async () => {
    const email = `auth-fail-${Date.now()}@test.local`;
    const user = await admin.users.create(
      ID.unique(), email, undefined, "CorrectPass1234!", "Fail User"
    );
    cleanupUserIds.push(user.$id);

    const client = new Client()
      .setEndpoint(CONFIG.endpoint)
      .setProject(CONFIG.projectId);
    const account = new Account(client);

    await expect(
      account.createEmailPasswordSession(email, "WrongPassword!")
    ).rejects.toThrow();
  });

  it("should create and retrieve a user profile", async () => {
    const user = await createTestUser("auth-profile");
    cleanupUserIds.push(user.userId);

    const profile = await user.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.profilesCollectionId,
      ID.unique(),
      { userId: user.userId, displayName: user.displayName, role: "player" }
    );
    cleanupDocs.push([CONFIG.profilesCollectionId, profile.$id]);

    expect(profile.$id).toBeTruthy();
    expect(profile.userId).toBe(user.userId);
    expect(profile.displayName).toBe(user.displayName);

    // Retrieve
    const fetched = await user.databases.getDocument(
      CONFIG.databaseId, CONFIG.profilesCollectionId, profile.$id
    );
    expect(fetched.displayName).toBe(user.displayName);
  });

  it("should update a profile display name", async () => {
    const user = await createTestUser("auth-update");
    cleanupUserIds.push(user.userId);

    const profile = await user.databases.createDocument(
      CONFIG.databaseId,
      CONFIG.profilesCollectionId,
      ID.unique(),
      { userId: user.userId, displayName: "Original Name", role: "player" }
    );
    cleanupDocs.push([CONFIG.profilesCollectionId, profile.$id]);

    const updated = await user.databases.updateDocument(
      CONFIG.databaseId, CONFIG.profilesCollectionId, profile.$id,
      { displayName: "Updated Name" }
    );
    expect(updated.displayName).toBe("Updated Name");
  });
});
