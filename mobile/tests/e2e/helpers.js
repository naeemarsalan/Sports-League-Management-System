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
  notificationLogsCollectionId: "notification_logs",
  leagueApiFunctionId: "league-api",
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
    functions: new Functions(client),
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

/**
 * Call the league-api function as a specific user.
 *
 * Uses the Functions.createExecution method with the user's authenticated
 * Functions client (session auth), which means the function receives
 * the x-appwrite-user-id header automatically from Appwrite.
 *
 * @param {object} userCtx - The user context from createTestUser()
 * @param {string} action - The action name (e.g., "createLeague")
 * @param {object} payload - Additional payload fields
 * @returns {{ success: boolean, data?: any, error?: string }}
 */
async function callLeagueApi(userCtx, action, payload = {}) {
  const result = await userCtx.functions.createExecution(
    CONFIG.leagueApiFunctionId,
    JSON.stringify({ action, ...payload }),
    false // synchronous
  );

  let parsed;
  try {
    parsed = JSON.parse(result.responseBody);
  } catch (e) {
    throw new Error(
      `Failed to parse league-api response (status ${result.statusCode}): ${result.responseBody}`
    );
  }

  return {
    success: parsed.success,
    data: parsed.data,
    error: parsed.error,
    statusCode: result.statusCode,
  };
}

/**
 * Call league-api and expect success. Throws on failure.
 */
async function callLeagueApiOk(userCtx, action, payload = {}) {
  const res = await callLeagueApi(userCtx, action, payload);
  if (!res.success) {
    throw new Error(`league-api ${action} failed: ${res.error}`);
  }
  return res.data;
}

/**
 * Pure-function leaderboard computation.
 * Ported from mobile/src/lib/leaderboard.js:79-188
 *
 * @param {Array} matches - Completed match documents
 * @param {Array} profiles - Profile documents
 * @param {Set|Array} memberUserIds - Set of userId strings for league members
 * @param {object} scoringConfig - { pointsPerWin, pointsPerDraw, pointsPerLoss, includeFramePoints }
 * @returns {Array} Sorted leaderboard entries
 */
function computeLeaderboard(matches, profiles, memberUserIds, scoringConfig) {
  const memberSet = memberUserIds instanceof Set ? memberUserIds : new Set(memberUserIds);

  // Build profile maps by both $id and userId
  const profileByDocId = new Map();
  const profileByUserId = new Map();
  profiles.forEach((p) => {
    profileByDocId.set(p.$id, p);
    if (p.userId) {
      profileByUserId.set(p.userId, p);
    }
  });

  const findProfile = (id) => profileByDocId.get(id) || profileByUserId.get(id);

  // Initialize standings only for league members
  const standings = {};
  const relevantProfiles = profiles.filter((p) => memberSet.has(p.userId));

  relevantProfiles.forEach((profile) => {
    standings[profile.$id] = {
      playerId: profile.$id,
      userId: profile.userId,
      name: profile.displayName,
      gamesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      framesWon: 0,
    };
  });

  // Process completed matches
  matches.forEach((match) => {
    const { player1Id, player2Id, scorePlayer1, scorePlayer2 } = match;

    if (scorePlayer1 === null || scorePlayer1 === undefined ||
        scorePlayer2 === null || scorePlayer2 === undefined) {
      return;
    }

    const player1Profile = findProfile(player1Id);
    const player2Profile = findProfile(player2Id);

    if (!player1Profile || !player2Profile) return;

    const key1 = player1Profile.$id;
    const key2 = player2Profile.$id;

    if (!standings[key1] || !standings[key2]) return;

    standings[key1].gamesPlayed += 1;
    standings[key2].gamesPlayed += 1;

    standings[key1].framesWon += scorePlayer1;
    standings[key2].framesWon += scorePlayer2;

    if (scorePlayer1 > scorePlayer2) {
      standings[key1].wins += 1;
      standings[key1].points += scoringConfig.pointsPerWin;
      standings[key2].losses += 1;
      standings[key2].points += scoringConfig.pointsPerLoss;
    } else if (scorePlayer2 > scorePlayer1) {
      standings[key2].wins += 1;
      standings[key2].points += scoringConfig.pointsPerWin;
      standings[key1].losses += 1;
      standings[key1].points += scoringConfig.pointsPerLoss;
    } else {
      standings[key1].draws += 1;
      standings[key1].points += scoringConfig.pointsPerDraw;
      standings[key2].draws += 1;
      standings[key2].points += scoringConfig.pointsPerDraw;
    }

    if (scoringConfig.includeFramePoints) {
      standings[key1].points += scorePlayer1;
      standings[key2].points += scorePlayer2;
    }
  });

  // Sort: points DESC → wins DESC → name ASC
  return Object.values(standings)
    .filter((entry) => entry.name)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.name.localeCompare(b.name);
    });
}

module.exports = {
  CONFIG,
  getAdminClient,
  createTestUser,
  adminDeleteDoc,
  adminCreateProfile,
  callLeagueApi,
  callLeagueApiOk,
  computeLeaderboard,
  ID,
  Permission,
  Query,
  Role,
};
