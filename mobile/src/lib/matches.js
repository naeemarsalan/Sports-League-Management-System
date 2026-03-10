import { databases, Query, appwriteConfig, callLeagueApi } from "./appwrite";

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
 * Create a new match via server-side function (RBAC enforced)
 */
export const createMatch = async (payload, challengerName = null) => {
  if (!payload.leagueId) {
    throw new Error("leagueId is required when creating a match");
  }

  return callLeagueApi("createMatch", {
    leagueId: payload.leagueId,
    matchData: payload,
    challengerName,
  });
};

/**
 * Update match via server-side function (RBAC enforced)
 */
export const updateMatch = async (matchId, payload, notifyOptions = null) => {
  return callLeagueApi("updateMatch", {
    matchId,
    matchData: payload,
    leagueId: payload.leagueId,
    notifyOptions,
  });
};

export const getMatch = async (matchId) => {
  return databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.matchesCollectionId,
    matchId
  );
};

/**
 * Delete match via server-side function (RBAC enforced)
 */
export const deleteMatch = async (matchId, leagueId = null) => {
  return callLeagueApi("deleteMatch", { matchId, leagueId });
};
