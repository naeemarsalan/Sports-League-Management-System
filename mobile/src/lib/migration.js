import { databases, ID, Query, appwriteConfig } from "./appwrite";

/**
 * Generate a random 6-character invite code
 */
const generateInviteCode = () => {
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
 * Migration script to convert existing single-league data to multi-league structure.
 *
 * This script:
 * 1. Creates a default league from existing data
 * 2. Adds all existing profiles as league members
 * 3. Updates all existing matches with the default league ID
 *
 * Should be run ONCE after creating the new collections in Appwrite.
 */
export const migrateToMultiLeague = async (adminUserId) => {
  console.log("Starting multi-league migration...");

  try {
    // Step 1: Check if default league already exists
    const existingLeagues = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.leaguesCollectionId,
      [Query.limit(1)]
    );

    let defaultLeague;

    if (existingLeagues.documents.length > 0) {
      console.log("Default league already exists, skipping creation.");
      defaultLeague = existingLeagues.documents[0];
    } else {
      // Create default league
      console.log("Creating default league...");
      defaultLeague = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.leaguesCollectionId,
        ID.unique(),
        {
          name: "Snooker Pool League",
          description: "Original league - migrated from single-league setup",
          inviteCode: generateInviteCode(),
          createdBy: adminUserId,
          createdAt: new Date().toISOString(),
          isActive: true,
          memberCount: 0,
        }
      );
      console.log(`Created default league: ${defaultLeague.$id}`);
    }

    // Step 2: Get all profiles (paginated)
    const allProfiles = [];
    const PAGE_SIZE = 500;
    let profileOffset = 0;
    while (true) {
      const profilesRes = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.profilesCollectionId,
        [Query.limit(PAGE_SIZE), Query.offset(profileOffset)]
      );
      allProfiles.push(...profilesRes.documents);
      if (profilesRes.documents.length < PAGE_SIZE) break;
      profileOffset += PAGE_SIZE;
    }
    const profilesRes = { documents: allProfiles, total: allProfiles.length };
    console.log(`Found ${profilesRes.documents.length} profiles to migrate...`);

    // Step 3: Add each profile as a league member
    let membersCreated = 0;
    for (const profile of profilesRes.documents) {
      // Check if member already exists
      const existingMember = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.leagueMembersCollectionId,
        [
          Query.equal("leagueId", defaultLeague.$id),
          Query.equal("userId", profile.userId),
        ]
      );

      if (existingMember.documents.length > 0) {
        console.log(`Member ${profile.displayName} already exists, skipping.`);
        continue;
      }

      // Determine role based on existing profile role
      let role = "player";
      if (profile.role === "admin") {
        role = profile.userId === adminUserId ? "owner" : "admin";
      }

      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.leagueMembersCollectionId,
        ID.unique(),
        {
          leagueId: defaultLeague.$id,
          userId: profile.userId,
          role,
          status: "approved",
          joinedAt: new Date().toISOString(),
          requestedAt: new Date().toISOString(),
        }
      );

      membersCreated++;
      console.log(`Added member: ${profile.displayName} (${role})`);
    }

    console.log(`Created ${membersCreated} league members.`);

    // Step 4: Update league member count
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.leaguesCollectionId,
      defaultLeague.$id,
      {
        memberCount: profilesRes.total,
      }
    );

    // Step 5: Update all matches with leagueId (paginated)
    const allMatches = [];
    let matchOffset = 0;
    const MATCH_PAGE_SIZE = 500;
    while (true) {
      const page = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.matchesCollectionId,
        [Query.limit(MATCH_PAGE_SIZE), Query.offset(matchOffset)]
      );
      allMatches.push(...page.documents);
      if (page.documents.length < MATCH_PAGE_SIZE) break;
      matchOffset += MATCH_PAGE_SIZE;
    }
    const matchesRes = { documents: allMatches, total: allMatches.length };
    console.log(`Found ${matchesRes.documents.length} matches to update...`);

    let matchesUpdated = 0;
    for (const match of matchesRes.documents) {
      // Skip if already has leagueId
      if (match.leagueId) {
        console.log(`Match ${match.$id} already has leagueId, skipping.`);
        continue;
      }

      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.matchesCollectionId,
        match.$id,
        {
          leagueId: defaultLeague.$id,
        }
      );

      matchesUpdated++;
    }

    console.log(`Updated ${matchesUpdated} matches with leagueId.`);

    console.log("Migration completed successfully!");
    return {
      success: true,
      defaultLeagueId: defaultLeague.$id,
      membersCreated,
      matchesUpdated,
    };
  } catch (error) {
    console.error("Migration failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
