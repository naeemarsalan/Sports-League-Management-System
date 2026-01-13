import { databases, ID, Query, appwriteConfig } from "./appwrite";

export const listMatches = async ({ leagueId, status, playerId, weekCommencing } = {}) => {
  const queries = [];

  // Filter by league (required for multi-league)
  if (leagueId) {
    queries.push(Query.equal("leagueId", leagueId));
  }

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

  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.matchesCollectionId,
    queries
  );
  return response.documents;
};

export const createMatch = async (payload) => {
  // Ensure leagueId is provided
  if (!payload.leagueId) {
    throw new Error("leagueId is required when creating a match");
  }

  return databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.matchesCollectionId,
    ID.unique(),
    payload
  );
};

export const updateMatch = async (matchId, payload) => {
  return databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.matchesCollectionId,
    matchId,
    payload
  );
};

export const getMatch = async (matchId) => {
  return databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.matchesCollectionId,
    matchId
  );
};
