import { databases, ID, Permission, Query, Role, appwriteConfig } from "./appwrite";
import { sendPushNotification } from "./notifications";

export const listMatches = async ({ leagueId, status, playerId, weekCommencing } = {}) => {
  const queries = [];

  if (status === "completed") {
    queries.push(Query.equal("isCompleted", true));
  }
  if (status === "upcoming") {
    queries.push(Query.equal("isCompleted", false));
  }
  if (playerId) {
    queries.push(Query.or([Query.equal("player1Id", playerId), Query.equal("player2Id", playerId)]));
  }
  if (weekCommencing) {
    queries.push(Query.equal("weekCommencing", weekCommencing));
  }

  queries.push(Query.limit(500));
  queries.push(Query.orderDesc("weekCommencing"));

  let documents;

  // Try to filter by leagueId if provided
  if (leagueId && typeof leagueId === "string" && leagueId.trim().length > 0) {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.matchesCollectionId,
        [...queries, Query.equal("leagueId", leagueId)]
      );
      documents = response.documents;
    } catch (error) {
      // Fallback: fetch all and filter client-side (for legacy matches without leagueId)
      console.warn("Falling back to client-side league filtering:", error.message);
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.matchesCollectionId,
        queries
      );
      documents = response.documents.filter((m) => m.leagueId === leagueId || !m.leagueId);
    }
  } else {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.matchesCollectionId,
      queries
    );
    documents = response.documents;
  }

  return documents;
};

/**
 * Create a new match and notify the opponent
 * @param {Object} payload - Match data
 * @param {string} challengerName - Display name of the challenger (for notification)
 */
export const createMatch = async (payload, challengerName = null) => {
  // Ensure leagueId is provided
  if (!payload.leagueId) {
    throw new Error("leagueId is required when creating a match");
  }

  const match = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.matchesCollectionId,
    ID.unique(),
    payload,
    [
      Permission.read(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ]
  );

  // Send push notification to opponent (player2)
  if (payload.player2Id) {
    sendPushNotification("challenge_received", payload.player2Id, {
      matchId: match.$id,
      challengerName,
    }, payload.leagueId);
  }

  return match;
};

/**
 * Update match and optionally send notifications
 * @param {string} matchId - The match ID to update
 * @param {Object} payload - Update data
 * @param {Object} notifyOptions - Notification options
 * @param {string[]} notifyOptions.playerIds - Player IDs to notify
 * @param {string} notifyOptions.type - Notification type (match_scheduled, score_submitted)
 * @param {Object} notifyOptions.data - Additional notification data
 * @param {string} [notifyOptions.leagueId] - League ID for rate limiting
 */
export const updateMatch = async (matchId, payload, notifyOptions = null) => {
  const updated = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.matchesCollectionId,
    matchId,
    payload
  );

  // Send notifications if requested
  if (notifyOptions?.playerIds?.length > 0 && notifyOptions.type) {
    for (const playerId of notifyOptions.playerIds) {
      sendPushNotification(notifyOptions.type, playerId, {
        matchId,
        ...notifyOptions.data,
      }, notifyOptions.leagueId);
    }
  }

  return updated;
};

export const getMatch = async (matchId) => {
  return databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.matchesCollectionId,
    matchId
  );
};

export const deleteMatch = async (matchId) => {
  return databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.matchesCollectionId,
    matchId
  );
};
