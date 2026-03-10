const fetch = require("node-fetch");
const DEFAULT_LIMIT = 100;

function buildUrl(endpoint, path, params = {}) {
  const base = endpoint.replace(/\/$/, "");
  const url = new URL(base.endsWith("/v1") ? `${base}${path}` : `${base}/v1${path}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}

async function requestJson(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Appwrite error ${response.status}: ${text}`);
  }
  return response.json();
}

async function fetchAllDocuments(endpoint, headers, databaseId, collectionId) {
  const documents = [];
  let offset = 0;

  while (true) {
    const url = buildUrl(endpoint, `/databases/${databaseId}/collections/${collectionId}/documents`, {
      limit: String(DEFAULT_LIMIT),
      offset: String(offset),
    });
    const payload = await requestJson(url, headers);
    documents.push(...payload.documents);
    if (payload.documents.length < DEFAULT_LIMIT) {
      break;
    }
    offset += DEFAULT_LIMIT;
  }

  return documents;
}

function ensureStanding(state, playerId, name) {
  if (!state[playerId]) {
    state[playerId] = {
      playerId,
      name,
      gamesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      framesWon: 0,
    };
  }
  return state[playerId];
}

const SCORING_DEFAULTS = { pointsPerWin: 3, pointsPerDraw: 1, pointsPerLoss: 0, includeFramePoints: false };

function computeLeaderboard(matches, profiles, scoring = SCORING_DEFAULTS) {
  // Build dual map: by $id AND by userId field, so matches using either ID format work
  const profileMap = new Map();
  profiles.forEach((profile) => {
    profileMap.set(profile.$id, profile);
    if (profile.userId) {
      profileMap.set(profile.userId, profile);
    }
  });
  const standings = {};

  matches
    .filter((match) => match.isCompleted)
    .forEach((match) => {
      const player1 = profileMap.get(match.player1Id);
      const player2 = profileMap.get(match.player2Id);
      if (!player1 || !player2) {
        return;
      }

      const score1 = match.scorePlayer1;
      const score2 = match.scorePlayer2;
      if (score1 === null || score1 === undefined || score2 === null || score2 === undefined) {
        return;
      }

      const entry1 = ensureStanding(standings, match.player1Id, player1.displayName);
      const entry2 = ensureStanding(standings, match.player2Id, player2.displayName);

      entry1.gamesPlayed += 1;
      entry2.gamesPlayed += 1;

      entry1.framesWon += score1;
      entry2.framesWon += score2;

      if (score1 > score2) {
        entry1.wins += 1;
        entry2.losses += 1;
        entry1.points += scoring.pointsPerWin;
        entry2.points += scoring.pointsPerLoss;
      } else if (score2 > score1) {
        entry2.wins += 1;
        entry1.losses += 1;
        entry2.points += scoring.pointsPerWin;
        entry1.points += scoring.pointsPerLoss;
      } else {
        entry1.draws += 1;
        entry2.draws += 1;
        entry1.points += scoring.pointsPerDraw;
        entry2.points += scoring.pointsPerDraw;
      }

      if (scoring.includeFramePoints) {
        entry1.points += score1;
        entry2.points += score2;
      }
    });

  return Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    return (a.name || "").localeCompare(b.name || "");
  });
}

module.exports = async function handler({ req, res, log, error }) {
  try {
    const endpoint = process.env.APPWRITE_ENDPOINT;
    const projectId = process.env.APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const profilesCollection = process.env.APPWRITE_PROFILES_COLLECTION_ID;
    const matchesCollection = process.env.APPWRITE_MATCHES_COLLECTION_ID;

    if (!endpoint || !projectId || !apiKey || !databaseId || !profilesCollection || !matchesCollection) {
      return res.json({
        error: "Missing required Appwrite environment variables.",
      }, 500);
    }

    // Parse request body for leagueId
    let body = {};
    try {
      body = JSON.parse(req.body || "{}");
    } catch (e) {
      body = req.body || {};
    }
    const leagueId = body.leagueId || (req.query && req.query.leagueId);

    const headers = {
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
      "Content-Type": "application/json",
    };

    const [profiles, allMatches] = await Promise.all([
      fetchAllDocuments(endpoint, headers, databaseId, profilesCollection),
      fetchAllDocuments(endpoint, headers, databaseId, matchesCollection),
    ]);

    // Filter matches by leagueId if provided
    const matches = leagueId
      ? allMatches.filter((m) => m.leagueId === leagueId)
      : allMatches;

    // Use league-specific scoring config if available
    let scoring = SCORING_DEFAULTS;
    if (leagueId) {
      try {
        const leagueUrl = buildUrl(endpoint, `/databases/${databaseId}/collections/leagues/documents/${leagueId}`);
        const league = await requestJson(leagueUrl, headers);
        if (league.pointsPerWin != null) {
          scoring = {
            pointsPerWin: league.pointsPerWin ?? SCORING_DEFAULTS.pointsPerWin,
            pointsPerDraw: league.pointsPerDraw ?? SCORING_DEFAULTS.pointsPerDraw,
            pointsPerLoss: league.pointsPerLoss ?? SCORING_DEFAULTS.pointsPerLoss,
            includeFramePoints: league.includeFramePoints ?? SCORING_DEFAULTS.includeFramePoints,
          };
        }
      } catch (e) {
        if (log) log(`Could not fetch league scoring config, using defaults: ${e.message}`);
      }
    }

    const leaderboard = computeLeaderboard(matches, profiles, scoring);
    return res.json({ leaderboard }, 200);
  } catch (err) {
    if (error) {
      error(err);
    } else if (log) {
      log(err);
    }
    return res.json({ error: "Internal server error" }, 500);
  }
};

module.exports.computeLeaderboard = computeLeaderboard;
module.exports.SCORING_DEFAULTS = SCORING_DEFAULTS;
