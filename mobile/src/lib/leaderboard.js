import { databases, Query, appwriteConfig } from "./appwrite";
import { getLeagueMembers } from "./members";

/**
 * Compute leaderboard standings from matches and profiles locally
 * This avoids dependency on the serverless function
 * @param {string} leagueId - The league ID to compute standings for (optional for backwards compatibility)
 */
export const fetchLeaderboard = async (leagueId = null) => {
  try {
    // Build queries for matches
    const matchQueries = [Query.equal("isCompleted", true), Query.limit(500)];
    if (leagueId) {
      matchQueries.push(Query.equal("leagueId", leagueId));
    }

    // Fetch profiles, completed matches, and league members
    const [profilesRes, matchesRes, members] = await Promise.all([
      databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.profilesCollectionId,
        [Query.limit(500)]
      ),
      databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.matchesCollectionId,
        matchQueries
      ),
      leagueId ? getLeagueMembers(leagueId, "approved") : Promise.resolve([]),
    ]);

    const profiles = profilesRes.documents;
    const matches = matchesRes.documents;

    // Create a set of member userIds if filtering by league
    const leagueMemberUserIds = leagueId
      ? new Set(members.map((m) => m.userId))
      : null;

    console.log(
      `Leaderboard: Found ${profiles.length} profiles, ${matches.length} completed matches` +
        (leagueId ? `, ${members.length} league members` : "")
    );

    // Build profile map by BOTH $id and userId (matches may use either)
    const profileByDocId = new Map();
    const profileByUserId = new Map();

    profiles.forEach((p) => {
      profileByDocId.set(p.$id, p);
      if (p.userId) {
        profileByUserId.set(p.userId, p);
      }
    });

    // Helper to find profile by either doc $id or userId field
    const findProfile = (id) => profileByDocId.get(id) || profileByUserId.get(id);

    // Initialize standings only for league members (if leagueId provided)
    const standings = {};

    // Filter profiles to only include league members
    const relevantProfiles = leagueMemberUserIds
      ? profiles.filter((p) => leagueMemberUserIds.has(p.userId))
      : profiles;

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
      };
    });

    // Process completed matches
    matches.forEach((match) => {
      const { player1Id, player2Id, scorePlayer1, scorePlayer2 } = match;

      // Skip if scores are missing
      if (
        scorePlayer1 === null ||
        scorePlayer1 === undefined ||
        scorePlayer2 === null ||
        scorePlayer2 === undefined
      ) {
        return;
      }

      // Find profiles (could be by doc $id or userId)
      const player1Profile = findProfile(player1Id);
      const player2Profile = findProfile(player2Id);

      if (!player1Profile || !player2Profile) {
        console.log(
          `Leaderboard: Skipping match, player not found: ${player1Id} or ${player2Id}`
        );
        return;
      }

      // Use the profile's document $id as the key
      const key1 = player1Profile.$id;
      const key2 = player2Profile.$id;

      // Skip if either player is not in the standings (not a league member)
      if (!standings[key1] || !standings[key2]) {
        return;
      }

      // Update games played
      standings[key1].gamesPlayed += 1;
      standings[key2].gamesPlayed += 1;

      // Determine winner and update stats
      if (scorePlayer1 > scorePlayer2) {
        standings[key1].wins += 1;
        standings[key1].points += 3;
        standings[key2].losses += 1;
      } else if (scorePlayer2 > scorePlayer1) {
        standings[key2].wins += 1;
        standings[key2].points += 3;
        standings[key1].losses += 1;
      } else {
        standings[key1].draws += 1;
        standings[key1].points += 1;
        standings[key2].draws += 1;
        standings[key2].points += 1;
      }
    });

    // Convert to array and sort
    const leaderboard = Object.values(standings)
      .filter((entry) => entry.name)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.name.localeCompare(b.name);
      });

    console.log(`Leaderboard: Returning ${leaderboard.length} entries`);
    return leaderboard;
  } catch (error) {
    console.error("Error computing leaderboard:", error.message, error);
    return [];
  }
};
