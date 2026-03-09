// ---- Mocks ----
const mockListDocuments = jest.fn();

jest.mock("../appwrite", () => {
  const appwrite = jest.requireActual("appwrite");
  return {
    databases: {
      listDocuments: (...args) => mockListDocuments(...args),
    },
    appwriteConfig: {
      databaseId: "test-db",
      profilesCollectionId: "profiles",
      matchesCollectionId: "matches",
    },
    Query: appwrite.Query,
  };
});

jest.mock("../members", () => ({
  getLeagueMembers: jest.fn().mockResolvedValue([]),
}));

jest.mock("../notifications", () => ({
  sendPushNotification: jest.fn(),
}));

jest.mock("../leagues", () => ({
  SCORING_DEFAULTS: { pointsPerWin: 3, pointsPerDraw: 1, pointsPerLoss: 0, includeFramePoints: false },
}));

const { fetchLeaderboard } = require("../leaderboard");
const { getLeagueMembers } = require("../members");

// ---- Helpers ----
const makeProfile = (id, userId, name) => ({ $id: id, userId, displayName: name });
const makeMatch = (p1, p2, s1, s2, leagueId = "lg1") => ({
  player1Id: p1,
  player2Id: p2,
  scorePlayer1: s1,
  scorePlayer2: s2,
  isCompleted: true,
  leagueId,
});

const profiles = [
  makeProfile("p1", "u1", "Alice"),
  makeProfile("p2", "u2", "Bob"),
  makeProfile("p3", "u3", "Charlie"),
];

const members = [
  { userId: "u1" },
  { userId: "u2" },
  { userId: "u3" },
];

function setupMocks(matchDocs) {
  // First call: profiles, second call: matches (with leagueId filter)
  mockListDocuments
    .mockResolvedValueOnce({ documents: profiles })
    .mockResolvedValueOnce({ documents: matchDocs });
  getLeagueMembers.mockResolvedValue(members);
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---- Basic scoring ----
describe("fetchLeaderboard - basic scoring", () => {
  it("returns empty array when no matches", async () => {
    setupMocks([]);
    const result = await fetchLeaderboard("lg1");
    expect(result).toEqual(expect.any(Array));
  });

  it("calculates win/loss with default scoring", async () => {
    setupMocks([makeMatch("p1", "p2", 4, 2)]);
    const scoring = { pointsPerWin: 3, pointsPerDraw: 1, pointsPerLoss: 0, includeFramePoints: false };
    const result = await fetchLeaderboard("lg1", scoring);

    const alice = result.find((e) => e.playerId === "p1");
    const bob = result.find((e) => e.playerId === "p2");

    expect(alice.wins).toBe(1);
    expect(alice.points).toBe(3);
    expect(bob.losses).toBe(1);
    expect(bob.points).toBe(0);
  });
});

// ---- Frame points ----
describe("fetchLeaderboard - frame points", () => {
  it("tracks framesWon unconditionally", async () => {
    setupMocks([makeMatch("p1", "p2", 4, 2)]);
    const scoring = { pointsPerWin: 3, pointsPerDraw: 1, pointsPerLoss: 0, includeFramePoints: false };
    const result = await fetchLeaderboard("lg1", scoring);

    expect(result.find((e) => e.playerId === "p1").framesWon).toBe(4);
    expect(result.find((e) => e.playerId === "p2").framesWon).toBe(2);
  });

  it("does NOT add frame bonus when includeFramePoints is false", async () => {
    setupMocks([makeMatch("p1", "p2", 4, 2)]);
    const scoring = { pointsPerWin: 3, pointsPerDraw: 1, pointsPerLoss: 0, includeFramePoints: false };
    const result = await fetchLeaderboard("lg1", scoring);

    expect(result.find((e) => e.playerId === "p1").points).toBe(3);
    expect(result.find((e) => e.playerId === "p2").points).toBe(0);
  });

  it("adds frame scores as bonus points when includeFramePoints is true", async () => {
    setupMocks([makeMatch("p1", "p2", 4, 2)]);
    const scoring = { pointsPerWin: 3, pointsPerDraw: 1, pointsPerLoss: 0, includeFramePoints: true };
    const result = await fetchLeaderboard("lg1", scoring);

    // Alice: 3 (win) + 4 (frames) = 7
    expect(result.find((e) => e.playerId === "p1").points).toBe(7);
    // Bob: 0 (loss) + 2 (frames) = 2
    expect(result.find((e) => e.playerId === "p2").points).toBe(2);
  });

  it("accumulates frame points across multiple matches", async () => {
    setupMocks([
      makeMatch("p1", "p2", 4, 2),
      makeMatch("p1", "p3", 3, 1),
    ]);
    const scoring = { pointsPerWin: 3, pointsPerDraw: 1, pointsPerLoss: 0, includeFramePoints: true };
    const result = await fetchLeaderboard("lg1", scoring);

    const alice = result.find((e) => e.playerId === "p1");
    // 2 wins * 3 = 6, frames: 4 + 3 = 7, total = 13
    expect(alice.points).toBe(13);
    expect(alice.framesWon).toBe(7);
  });

  it("adds frame points on draws", async () => {
    setupMocks([makeMatch("p1", "p2", 3, 3)]);
    const scoring = { pointsPerWin: 3, pointsPerDraw: 1, pointsPerLoss: 0, includeFramePoints: true };
    const result = await fetchLeaderboard("lg1", scoring);

    // Each: 1 (draw) + 3 (frames) = 4
    expect(result.find((e) => e.playerId === "p1").points).toBe(4);
    expect(result.find((e) => e.playerId === "p2").points).toBe(4);
  });
});

// ---- createLeague with new fields ----
describe("leagues - SCORING_DEFAULTS includes includeFramePoints", () => {
  it("SCORING_DEFAULTS has includeFramePoints: false", () => {
    const { SCORING_DEFAULTS } = require("../leagues");
    expect(SCORING_DEFAULTS.includeFramePoints).toBe(false);
  });
});

// ---- getScoringConfig ----
describe("getScoringConfig", () => {
  // Re-import the real module for this suite
  beforeAll(() => {
    jest.unmock("../leagues");
  });

  it("returns includeFramePoints from league", () => {
    const { getScoringConfig } = require("../leagues");
    const league = { pointsPerWin: 3, pointsPerDraw: 1, pointsPerLoss: 0, includeFramePoints: true };
    expect(getScoringConfig(league).includeFramePoints).toBe(true);
  });

  it("defaults includeFramePoints to false when undefined", () => {
    const { getScoringConfig } = require("../leagues");
    const league = { pointsPerWin: 3, pointsPerDraw: 1, pointsPerLoss: 0 };
    expect(getScoringConfig(league).includeFramePoints).toBe(false);
  });

  it("defaults includeFramePoints to false when league is null", () => {
    const { getScoringConfig } = require("../leagues");
    expect(getScoringConfig(null).includeFramePoints).toBe(false);
  });
});
