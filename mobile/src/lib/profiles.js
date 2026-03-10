import { databases, ID, Query, appwriteConfig, callLeagueApi } from "./appwrite";

export const getProfileByUserId = async (userId) => {
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.profilesCollectionId,
    [Query.equal("userId", userId)]
  );
  return response.documents[0] ?? null;
};

export const listProfiles = async () => {
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.profilesCollectionId
  );
  return response.documents;
};

export const createProfile = async ({ userId, displayName, role }) => {
  return databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.profilesCollectionId,
    ID.unique(),
    { userId, displayName, role }
  );
};

/**
 * Update profile via server-side function (self-only enforcement)
 */
export const updateProfile = async (documentId, payload) => {
  return callLeagueApi("updateProfile", { profileId: documentId, profileData: payload });
};
