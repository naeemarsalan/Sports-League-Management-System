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
