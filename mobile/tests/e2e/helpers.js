/**
 * E2E Test Helpers
 *
 * Uses node-appwrite server SDK for admin operations (API key auth)
 * and user operations (session auth) to test real Appwrite permissions.
 *
 * Required env vars:
 *   APPWRITE_API_KEY  - Server API key with full access
 *
 * Optional env vars:
 *   APPWRITE_ENDPOINT   - defaults to https://appwrite.arsalan.io/v1
 *   APPWRITE_PROJECT_ID - defaults to 696436a5002d6f83aed7
 */

const {
  Client,
  Account,
  Databases,
  Functions,
  Users,
  ID,
  Permission,
  Query,
  Role,
} = require("node-appwrite");

const CONFIG = {
  endpoint: process.env.APPWRITE_ENDPOINT || "https://appwrite.arsalan.io/v1",
  projectId: process.env.APPWRITE_PROJECT_ID || "696436a5002d6f83aed7",
  apiKey: process.env.APPWRITE_API_KEY,
  databaseId: "pool-league",
  profilesCollectionId: "profiles",
  matchesCollectionId: "matches",
  leaguesCollectionId: "leagues",
  leagueMembersCollectionId: "league_members",
};

/**
 * Create an admin client (server SDK with API key).
 * Bypasses all permission checks - use only for setup/teardown.
 */
function getAdminClient() {
  if (!CONFIG.apiKey) {
    throw new Error("APPWRITE_API_KEY env var is required for E2E tests");
  }
  const client = new Client()
    .setEndpoint(CONFIG.endpoint)
    .setProject(CONFIG.projectId)
    .setKey(CONFIG.apiKey);
  return {
    client,
    users: new Users(client),
    databases: new Databases(client),
  };
}

/**
 * Create a test user via admin API and return an authenticated user client.
 * The user client uses session auth (NOT API key), so it's subject to
 * collection and document-level permissions — just like the real app.
 */
async function createTestUser(prefix = "e2e") {
  const admin = getAdminClient();
  const rand = Math.random().toString(36).slice(2, 8);
  const email = `${prefix}-${Date.now()}-${rand}@test.local`;
  const password = "TestPass1234!";
  const displayName = `Test ${prefix} ${rand}`;

  // Create user via admin API
  const user = await admin.users.create(
    ID.unique(),
    email,
    undefined, // phone
    password,
    displayName
  );

  // Create a session for this user via admin Users API.
  // This returns the session with its secret, which we can use to
  // authenticate a client-side SDK instance (subject to permissions).
  const session = await admin.users.createSession(user.$id);

  // Create a user-level client (no API key — uses session auth)
  const userClient = new Client()
    .setEndpoint(CONFIG.endpoint)
    .setProject(CONFIG.projectId)
    .setSession(session.secret);

  const userAccount = new Account(userClient);

  return {
    userId: user.$id,
    email,
    password,
    displayName,
    account: userAccount,
    databases: new Databases(userClient),
    functions: new Functions(userClient),
    // Cleanup helper - deletes the user (cascades sessions)
    cleanup: async () => {
      try {
        await admin.users.delete(user.$id);
      } catch (e) {
        // ignore
      }
    },
  };
}

/**
 * Delete a document using admin privileges (bypasses permissions).
 */
async function adminDeleteDoc(collectionId, docId) {
  const admin = getAdminClient();
  try {
    await admin.databases.deleteDocument(CONFIG.databaseId, collectionId, docId);
  } catch (e) {
    // ignore - document may already be deleted
  }
}

/**
 * Create a profile for a test user (via admin, so it always works).
 */
async function adminCreateProfile(userId, displayName, role = "player") {
  const admin = getAdminClient();
  return admin.databases.createDocument(
    CONFIG.databaseId,
    CONFIG.profilesCollectionId,
    ID.unique(),
    { userId, displayName, role },
    [
      Permission.read(Role.users()),
      Permission.update(Role.users()),
    ]
  );
}

module.exports = {
  CONFIG,
  getAdminClient,
  createTestUser,
  adminDeleteDoc,
  adminCreateProfile,
  ID,
  Permission,
  Query,
  Role,
};
