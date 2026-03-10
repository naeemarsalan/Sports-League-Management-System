/**
 * Detox test helpers — lightweight Appwrite REST API helpers
 * for operations that can't be done purely through the UI
 * (e.g., fetching invite codes, cleaning up test data).
 */

const APPWRITE_ENDPOINT = "https://appwrite.arsalan.io/v1";
const APPWRITE_PROJECT_ID = "696436a5002d6f83aed7";
const APPWRITE_API_KEY =
  process.env.APPWRITE_API_KEY ||
  "standard_26bc327d537b38466382e9d1809a9bf2b24d8882eb8241a54805553a95b1fa2b17c857fe0e0fa1a8461597f802934b9338a6fb418d29d07cc4e475f5c33fabfd040838550933c6938b07e7179568b42918ea07f4fce7bdca65026d64866c5ee24d6fdce0c35b118f5b7b31baedade92dcf2520a5c85906aee569e63296759284";

const DB_ID = "snooker_league_db";

async function appwriteRequest(path, method = "GET", body = null) {
  const headers = {
    "X-Appwrite-Project": APPWRITE_PROJECT_ID,
    "X-Appwrite-Key": APPWRITE_API_KEY,
    "Content-Type": "application/json",
  };

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${APPWRITE_ENDPOINT}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Appwrite ${method} ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

/**
 * Query a collection for documents matching filters.
 * @param {string} collectionId
 * @param {Array} queries - Array of query objects, e.g. [{ method: "equal", attribute: "userId", values: ["abc"] }]
 */
async function listDocuments(collectionId, queries = []) {
  const params = new URLSearchParams();
  for (const q of queries) {
    params.append("queries[]", JSON.stringify(q));
  }
  return appwriteRequest(
    `/databases/${DB_ID}/collections/${collectionId}/documents?${params.toString()}`
  );
}

/**
 * Get the invite code for a league created by a specific user.
 */
async function getInviteCodeForUser(userId) {
  const result = await listDocuments("leagues", [
    { method: "equal", attribute: "createdBy", values: [userId] },
    { method: "orderDesc", attribute: "$createdAt", values: [] },
    { method: "limit", attribute: "", values: [1] },
  ]);
  if (result.documents.length === 0) {
    throw new Error(`No league found for user ${userId}`);
  }
  return result.documents[0].inviteCode;
}

/**
 * Find a user by email.
 */
async function findUserByEmail(email) {
  const result = await appwriteRequest(
    `/users?queries[]=${encodeURIComponent(JSON.stringify({ method: "equal", attribute: "email", values: [email] }))}`
  );
  return result.users[0] || null;
}

/**
 * Delete a user by ID (for cleanup).
 */
async function deleteUser(userId) {
  return appwriteRequest(`/users/${userId}`, "DELETE");
}

/**
 * Delete all documents in a collection matching a query.
 */
async function deleteDocuments(collectionId, queries) {
  const result = await listDocuments(collectionId, queries);
  for (const doc of result.documents) {
    await appwriteRequest(
      `/databases/${DB_ID}/collections/${collectionId}/documents/${doc.$id}`,
      "DELETE"
    );
  }
  return result.documents.length;
}

/**
 * Clean up all test data created by the full-flow test.
 */
async function cleanupTestUsers(emails) {
  for (const email of emails) {
    try {
      const user = await findUserByEmail(email);
      if (!user) continue;

      // Delete profile
      await deleteDocuments("profiles", [
        { method: "equal", attribute: "userId", values: [user.$id] },
      ]).catch(() => {});

      // Delete memberships
      await deleteDocuments("league_members", [
        { method: "equal", attribute: "userId", values: [user.$id] },
      ]).catch(() => {});

      // Delete leagues created by user
      const leagues = await listDocuments("leagues", [
        { method: "equal", attribute: "createdBy", values: [user.$id] },
      ]);
      for (const league of leagues.documents) {
        // Delete matches in this league
        await deleteDocuments("matches", [
          { method: "equal", attribute: "leagueId", values: [league.$id] },
        ]).catch(() => {});
        // Delete other memberships
        await deleteDocuments("league_members", [
          { method: "equal", attribute: "leagueId", values: [league.$id] },
        ]).catch(() => {});
        // Delete league
        await appwriteRequest(
          `/databases/${DB_ID}/collections/leagues/documents/${league.$id}`,
          "DELETE"
        ).catch(() => {});
      }

      // Delete the user
      await deleteUser(user.$id).catch(() => {});
    } catch (e) {
      console.warn(`Cleanup failed for ${email}:`, e.message);
    }
  }
}

module.exports = {
  appwriteRequest,
  listDocuments,
  getInviteCodeForUser,
  findUserByEmail,
  deleteUser,
  deleteDocuments,
  cleanupTestUsers,
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  DB_ID,
};
