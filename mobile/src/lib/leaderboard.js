import { databases, Query, appwriteConfig } from "./appwrite";
import { getLeagueMembers } from "./members";
import { sendPushNotification } from "./notifications";
import { SCORING_DEFAULTS } from "./leagues";

/**
 * Compute leaderboard standings from matches and profiles locally
 * This avoids dependency on the serverless function
 * @param {string} leagueId - The league ID to compute standings for (optional for backwards compatibility)
 */
export const fetchLeaderboard = async (leagueId = null, scoringConfig = null) => {
  try {
    const scoring = scoringConfig ?? SCORING_DEFAULTS;
    const PAGE_SIZE = 500;

    // Paginated fetch helper
    const fetchAll = async (collectionId, extraQueries = []) => {
      const allDocs = [];
      let offset = 0;
      while (true) {
        const res = await databases.listDocuments(
          appwriteConfig.databaseId,
          collectionId,
          [...extraQueries, Query.limit(PAGE_SIZE), Query.offset(offset)]
        );
        allDocs.push(...res.documents);
        if (res.documents.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }
      return allDocs;
    };

    // Fetch profiles (paginated)
    const profiles = await fetchAll(appwriteConfig.profilesCollectionId);

    // Fetch matches - try with leagueId filter, fall back to all matches if it fails
    let matches;
    let members = [];

    if (leagueId && typeof leagueId === "string" && leagueId.trim().length > 0) {
      try {
        matches = await fetchAll(appwriteConfig.matchesCollectionId, [
          Query.equal("isCompleted", true),
          Query.equal("leagueId", leagueId),
        ]);
        members = await getLeagueMembers(leagueId, "approved");
      } catch (queryError) {
        // If leagueId query fails (e.g., old matches without leagueId), fetch all and filter
        console.warn("Falling back to fetching all matches:", queryError.message);
        try {
          const allMatches = await fetchAll(appwriteConfig.matchesCollectionId, [
            Query.equal("isCompleted", true),
          ]);
          matches = allMatches.filter((m) => m.leagueId === leagueId);
          members = await getLeagueMembers(leagueId, "approved");
        } catch (fallbackError) {
          console.warn("Fallback query also failed:", fallbackError.message);
          return [];
        }
      }
    } else {
      matches = await fetchAll(appwriteConfig.matchesCollectionId, [
        Query.equal("isCompleted", true),
      ]);
    }

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
        framesWon: 0,
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

      // Track frames won unconditionally
      standings[key1].framesWon += scorePlayer1;
      standings[key2].framesWon += scorePlayer2;

      // Determine winner and update stats
      if (scorePlayer1 > scorePlayer2) {
        standings[key1].wins += 1;
        standings[key1].points += scoring.pointsPerWin;
        standings[key2].losses += 1;
        standings[key2].points += scoring.pointsPerLoss;
      } else if (scorePlayer2 > scorePlayer1) {
        standings[key2].wins += 1;
        standings[key2].points += scoring.pointsPerWin;
        standings[key1].losses += 1;
        standings[key1].points += scoring.pointsPerLoss;
      } else {
        standings[key1].draws += 1;
        standings[key1].points += scoring.pointsPerDraw;
        standings[key2].draws += 1;
        standings[key2].points += scoring.pointsPerDraw;
      }

      // Add frame scores as bonus points if enabled
      if (scoring.includeFramePoints) {
        standings[key1].points += scorePlayer1;
        standings[key2].points += scorePlayer2;
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

/**
 * Compare leaderboard before and after a score submission, and notify
 * players whose position dropped (were overtaken).
 * @param {Array} before - Leaderboard array before score submission
 * @param {Array} after - Leaderboard array after score submission
 * @param {string} [leagueId] - League ID for rate limiting
 */
export const notifyOvertakenPlayers = (before, after, leagueId = null) => {
  try {
    // Build position maps: playerId -> 1-based rank
    const posBefore = new Map();
    before.forEach((entry, i) => posBefore.set(entry.playerId, i + 1));

    const posAfter = new Map();
    after.forEach((entry, i) => posAfter.set(entry.playerId, i + 1));

    for (const [playerId, newPos] of posAfter) {
      const oldPos = posBefore.get(playerId);
      if (oldPos == null) continue; // new player, skip

      if (newPos > oldPos) {
        // Player dropped — try to identify who overtook them
        // Only identify overtaker for single-position drops where we can be confident
        const overtaker = (newPos - oldPos === 1) ? after[oldPos - 1] : null;
        sendPushNotification("position_overtaken", playerId, {
          overtakerName: overtaker?.name,
          oldPosition: oldPos,
          newPosition: newPos,
        }, leagueId);
      }
    }
  } catch (err) {
    console.warn("Failed to send position overtaken notifications:", err.message);
  }
};
