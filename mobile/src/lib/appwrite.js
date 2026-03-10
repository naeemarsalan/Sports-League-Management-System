import Constants from "expo-constants";
import { Account, Client, Databases, Functions, ID, Permission, Query, Role } from "appwrite";

const extra = Constants.expoConfig?.extra ?? {};

export const appwriteConfig = {
  endpoint: extra.appwriteEndpoint,
  projectId: extra.appwriteProjectId,
  databaseId: extra.appwriteDatabaseId,
  profilesCollectionId: extra.appwriteProfilesCollectionId,
  matchesCollectionId: extra.appwriteMatchesCollectionId,
  leaguesCollectionId: extra.appwriteLeaguesCollectionId,
  leagueMembersCollectionId: extra.appwriteLeagueMembersCollectionId,
  leaderboardFunctionId: extra.appwriteLeaderboardFunctionId,
};

const client = new Client();
client.setEndpoint(appwriteConfig.endpoint).setProject(appwriteConfig.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);
export { ID, Permission, Query, Role };

/**
 * Call the league-api server function for write operations.
 * All writes go through this function for server-side RBAC enforcement.
 */
export const callLeagueApi = async (action, payload = {}) => {
  const result = await functions.createExecution(
    "league-api",
    JSON.stringify({ action, ...payload }),
    false // synchronous — wait for response
  );
  const response = JSON.parse(result.responseBody);
  if (!response.success) {
    throw new Error(response.error || "Unknown server error");
  }
  return response.data;
};
