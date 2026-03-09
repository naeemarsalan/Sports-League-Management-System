jest.mock("node-fetch", () => jest.fn());

const { computeLeaderboard, SCORING_DEFAULTS } = require("../index");

// ---- Test Data Helpers ----
const makeProfile = (id, name) => ({ $id: id, displayName: name });

const makeMatch = (player1Id, player2Id, score1, score2, completed = true) => ({
  player1Id,
  player2Id,
  scorePlayer1: score1,
  scorePlayer2: score2,
  isCompleted: completed,
});

const profiles = [
  makeProfile("p1", "Alice"),
  makeProfile("p2", "Bob"),
  makeProfile("p3", "Charlie"),
];

// ---- SCORING_DEFAULTS ----
describe("SCORING_DEFAULTS", () => {
  it("has expected default values", () => {
    expect(SCORING_DEFAULTS).toEqual({
      pointsPerWin: 3,
      pointsPerDraw: 1,
      pointsPerLoss: 0,
      includeFramePoints: false,
    });
  });
});

// ---- computeLeaderboard (basic) ----
describe("computeLeaderboard", () => {
  it("returns empty array when no matches", () => {
    const result = computeLeaderboard([], profiles);
    expect(result).toEqual([]);
  });

  it("calculates win/loss correctly with default scoring", () => {
    const matches = [makeMatch("p1", "p2", 4, 2)];
    const result = computeLeaderboard(matches, profiles);

    const alice = result.find((e) => e.playerId === "p1");
    const bob = result.find((e) => e.playerId === "p2");

    expect(alice.wins).toBe(1);
    expect(alice.losses).toBe(0);
    expect(alice.points).toBe(3);
    expect(bob.wins).toBe(0);
    expect(bob.losses).toBe(1);
    expect(bob.points).toBe(0);
  });

  it("calculates draw correctly", () => {
    const matches = [makeMatch("p1", "p2", 3, 3)];
    const result = computeLeaderboard(matches, profiles);

    const alice = result.find((e) => e.playerId === "p1");
    const bob = result.find((e) => e.playerId === "p2");

    expect(alice.draws).toBe(1);
    expect(alice.points).toBe(1);
    expect(bob.draws).toBe(1);
    expect(bob.points).toBe(1);
  });

  it("skips incomplete matches", () => {
    const matches = [makeMatch("p1", "p2", 4, 2, false)];
    const result = computeLeaderboard(matches, profiles);
    expect(result).toEqual([]);
  });

  it("skips matches with null scores", () => {
    const matches = [makeMatch("p1", "p2", null, null)];
    const result = computeLeaderboard(matches, profiles);
    expect(result).toEqual([]);
  });

  it("skips matches with unknown players", () => {
    const matches = [makeMatch("p1", "unknown", 4, 2)];
    const result = computeLeaderboard(matches, profiles);
    expect(result).toEqual([]);
  });

  it("sorts by points desc, then wins desc, then name asc", () => {
    const matches = [
      makeMatch("p1", "p2", 4, 2), // Alice wins
      makeMatch("p1", "p3", 4, 1), // Alice wins
      makeMatch("p2", "p3", 3, 3), // Draw
    ];
    const result = computeLeaderboard(matches, profiles);

    expect(result[0].playerId).toBe("p1"); // 6 pts
    expect(result[1].playerId).toBe("p2"); // 1 pt (draw)
    expect(result[2].playerId).toBe("p3"); // 1 pt (draw), name after Bob
  });

  it("handles custom scoring config", () => {
    const matches = [makeMatch("p1", "p2", 4, 2)];
    const scoring = { pointsPerWin: 5, pointsPerDraw: 2, pointsPerLoss: 1, includeFramePoints: false };
    const result = computeLeaderboard(matches, profiles, scoring);

    expect(result.find((e) => e.playerId === "p1").points).toBe(5);
    expect(result.find((e) => e.playerId === "p2").points).toBe(1);
  });
});

// ---- Frame Points ----
describe("computeLeaderboard - frame points", () => {
  it("tracks framesWon regardless of includeFramePoints setting", () => {
    const matches = [makeMatch("p1", "p2", 4, 2)];
    const result = computeLeaderboard(matches, profiles);

    expect(result.find((e) => e.playerId === "p1").framesWon).toBe(4);
    expect(result.find((e) => e.playerId === "p2").framesWon).toBe(2);
  });

  it("does NOT add frame points when includeFramePoints is false", () => {
    const matches = [makeMatch("p1", "p2", 4, 2)];
    const scoring = { ...SCORING_DEFAULTS, includeFramePoints: false };
    const result = computeLeaderboard(matches, profiles, scoring);

    // Alice: 3 (win) + 0 (no frame bonus) = 3
    expect(result.find((e) => e.playerId === "p1").points).toBe(3);
    // Bob: 0 (loss) + 0 (no frame bonus) = 0
    expect(result.find((e) => e.playerId === "p2").points).toBe(0);
  });

  it("adds frame scores as bonus points when includeFramePoints is true", () => {
    const matches = [makeMatch("p1", "p2", 4, 2)];
    const scoring = { ...SCORING_DEFAULTS, includeFramePoints: true };
    const result = computeLeaderboard(matches, profiles, scoring);

    // Alice: 3 (win) + 4 (frames) = 7
    expect(result.find((e) => e.playerId === "p1").points).toBe(7);
    // Bob: 0 (loss) + 2 (frames) = 2
    expect(result.find((e) => e.playerId === "p2").points).toBe(2);
  });

  it("accumulates frame points across multiple matches", () => {
    const matches = [
      makeMatch("p1", "p2", 4, 2),
      makeMatch("p1", "p3", 3, 1),
    ];
    const scoring = { ...SCORING_DEFAULTS, includeFramePoints: true };
    const result = computeLeaderboard(matches, profiles, scoring);

    const alice = result.find((e) => e.playerId === "p1");
    // 2 wins * 3 = 6, frames: 4 + 3 = 7, total = 13
    expect(alice.points).toBe(13);
    expect(alice.framesWon).toBe(7);
  });

  it("adds frame points on draws too", () => {
    const matches = [makeMatch("p1", "p2", 3, 3)];
    const scoring = { ...SCORING_DEFAULTS, includeFramePoints: true };
    const result = computeLeaderboard(matches, profiles, scoring);

    // Alice: 1 (draw) + 3 (frames) = 4
    expect(result.find((e) => e.playerId === "p1").points).toBe(4);
    // Bob: 1 (draw) + 3 (frames) = 4
    expect(result.find((e) => e.playerId === "p2").points).toBe(4);
  });

  it("frame points can change ranking order", () => {
    // Without frame points: Alice wins (3 pts), Bob loses (0 pts)
    // With frame points: Alice 3+1=4, Bob 0+5=5 → Bob leads
    const matches = [makeMatch("p1", "p2", 1, 5)]; // Bob wins 5-1
    // Wait — Bob wins here (score2 > score1)
    const scoring = { ...SCORING_DEFAULTS, includeFramePoints: true };
    const result = computeLeaderboard(matches, profiles, scoring);

    // Bob: 3 (win) + 5 (frames) = 8
    expect(result.find((e) => e.playerId === "p2").points).toBe(8);
    // Alice: 0 (loss) + 1 (frames) = 1
    expect(result.find((e) => e.playerId === "p1").points).toBe(1);
    expect(result[0].playerId).toBe("p2");
  });

  it("defaults to no frame points when scoring config omits includeFramePoints", () => {
    const matches = [makeMatch("p1", "p2", 4, 2)];
    const scoring = { pointsPerWin: 3, pointsPerDraw: 1, pointsPerLoss: 0 };
    const result = computeLeaderboard(matches, profiles, scoring);

    // Should not add frame points (undefined is falsy)
    expect(result.find((e) => e.playerId === "p1").points).toBe(3);
  });
});
