import { databases, Query, appwriteConfig, callLeagueApi } from "./appwrite";

export const SCORING_DEFAULTS = { pointsPerWin: 3, pointsPerDraw: 1, pointsPerLoss: 0, includeFramePoints: false };

/**
 * Read scoring config from a league document, falling back to defaults
 */
export const getScoringConfig = (league) => ({
  pointsPerWin: league?.pointsPerWin ?? SCORING_DEFAULTS.pointsPerWin,
  pointsPerDraw: league?.pointsPerDraw ?? SCORING_DEFAULTS.pointsPerDraw,
  pointsPerLoss: league?.pointsPerLoss ?? SCORING_DEFAULTS.pointsPerLoss,
  includeFramePoints: league?.includeFramePoints ?? SCORING_DEFAULTS.includeFramePoints,
});

/**
 * Generate a random 6-character invite code
 */
export const generateInviteCode = () => {
  const array = new Uint8Array(6);
  globalThis.crypto.getRandomValues(array);
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(array[i] % chars.length);
  }
  return code;
};

/**
 * Create a new league (server-side RBAC enforced, creates owner membership atomically)
 */
export const createLeague = async ({ name, description, createdBy, pointsPerWin, pointsPerDraw, pointsPerLoss, includeFramePoints, sportType }) => {
  return callLeagueApi("createLeague", {
    leagueData: {
      name,
      description,
      pointsPerWin,
      pointsPerDraw,
      pointsPerLoss,
      includeFramePoints,
      sportType,
    },
  });
};

/**
 * Get a league by ID
 */
export const getLeague = async (leagueId) => {
  return databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leaguesCollectionId,
    leagueId
  );
};

/**
 * Get a league by invite code
 */
export const getLeagueByInviteCode = async (inviteCode) => {
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.leaguesCollectionId,
    [Query.equal("inviteCode", inviteCode.toUpperCase()), Query.equal("isActive", true)]
  );
  return response.documents[0] ?? null;
};

/**
 * List all active leagues (for browsing)
 */
export const listLeagues = async () => {
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.leaguesCollectionId,
    [Query.equal("isActive", true), Query.orderDesc("memberCount"), Query.limit(100)]
  );
  return response.documents;
};

/**
 * Update league settings (server-side RBAC enforced)
 */
export const updateLeague = async (leagueId, payload) => {
  return callLeagueApi("updateLeague", { leagueId, leagueData: payload });
};

/**
 * Regenerate invite code for a league (server-side RBAC enforced)
 */
export const regenerateInviteCode = async (leagueId) => {
  return callLeagueApi("regenerateInviteCode", { leagueId });
};

/**
 * Soft delete a league (server-side RBAC enforced)
 */
export const deleteLeague = async (leagueId) => {
  return callLeagueApi("deleteLeague", { leagueId });
};
