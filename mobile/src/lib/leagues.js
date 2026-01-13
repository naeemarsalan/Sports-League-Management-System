import { databases, ID, Query, appwriteConfig } from "./appwrite";

/**
 * Generate a random 6-character invite code
 */
export const generateInviteCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Create a new league
 */
export const createLeague = async ({ name, description, createdBy }) => {
  const inviteCode = generateInviteCode();

  const league = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leaguesCollectionId,
    ID.unique(),
    {
      name,
      description: description || "",
      inviteCode,
      createdBy,
      createdAt: new Date().toISOString(),
      isActive: true,
      memberCount: 1,
    }
  );

  // Automatically add creator as owner
  await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leagueMembersCollectionId,
    ID.unique(),
    {
      leagueId: league.$id,
      userId: createdBy,
      role: "owner",
      status: "approved",
      joinedAt: new Date().toISOString(),
      requestedAt: new Date().toISOString(),
    }
  );

  return league;
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
 * Update league settings
 */
export const updateLeague = async (leagueId, payload) => {
  return databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leaguesCollectionId,
    leagueId,
    payload
  );
};

/**
 * Regenerate invite code for a league
 */
export const regenerateInviteCode = async (leagueId) => {
  const newCode = generateInviteCode();
  return databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leaguesCollectionId,
    leagueId,
    { inviteCode: newCode }
  );
};

/**
 * Soft delete a league (set isActive to false)
 */
export const deleteLeague = async (leagueId) => {
  return databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leaguesCollectionId,
    leagueId,
    { isActive: false }
  );
};

/**
 * Update member count for a league
 */
export const updateMemberCount = async (leagueId, delta) => {
  const league = await getLeague(leagueId);
  const newCount = Math.max(0, (league.memberCount || 0) + delta);
  return databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leaguesCollectionId,
    leagueId,
    { memberCount: newCount }
  );
};
