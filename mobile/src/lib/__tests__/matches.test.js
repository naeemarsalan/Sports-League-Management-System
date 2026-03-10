// ---- Mocks ----
const mockCreateDocument = jest.fn();
const mockListDocuments = jest.fn();
const mockUpdateDocument = jest.fn();
const mockGetDocument = jest.fn();
const mockDeleteDocument = jest.fn();
const mockCreateExecution = jest.fn();

jest.mock("../appwrite", () => {
  const appwrite = jest.requireActual("appwrite");
  return {
    databases: {
      createDocument: (...args) => mockCreateDocument(...args),
      listDocuments: (...args) => mockListDocuments(...args),
      updateDocument: (...args) => mockUpdateDocument(...args),
      getDocument: (...args) => mockGetDocument(...args),
      deleteDocument: (...args) => mockDeleteDocument(...args),
    },
    functions: {
      createExecution: (...args) => mockCreateExecution(...args),
    },
    appwriteConfig: {
      databaseId: "test-db",
      matchesCollectionId: "matches",
    },
    ID: { unique: () => "unique-id" },
    Permission: appwrite.Permission,
    Query: appwrite.Query,
    Role: appwrite.Role,
  };
});

const { Permission, Role } = require("appwrite");
const { createMatch, listMatches, updateMatch, deleteMatch } = require("../matches");

// ---- Helpers ----
beforeEach(() => {
  jest.clearAllMocks();
});

// ---- createMatch ----
describe("createMatch", () => {
  const validPayload = {
    player1Id: "p1",
    player2Id: "p2",
    leagueId: "league-1",
    weekCommencing: "2026-03-09T00:00:00.000Z",
  };

  it("passes Permission array to createDocument", async () => {
    mockCreateDocument.mockResolvedValue({ $id: "m1", ...validPayload });

    await createMatch(validPayload, "Alice");

    expect(mockCreateDocument).toHaveBeenCalledTimes(1);
    const [dbId, colId, docId, data, permissions] = mockCreateDocument.mock.calls[0];
    expect(dbId).toBe("test-db");
    expect(colId).toBe("matches");
    expect(docId).toBe("unique-id");
    expect(data).toEqual(validPayload);
    expect(permissions).toEqual([
      Permission.read(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ]);
  });

  it("throws without leagueId", async () => {
    const { leagueId, ...noLeague } = validPayload;
    await expect(createMatch(noLeague)).rejects.toThrow("leagueId is required");
  });

  it("sends push notification to player2", async () => {
    mockCreateDocument.mockResolvedValue({ $id: "m1", ...validPayload });
    mockCreateExecution.mockResolvedValue({});

    await createMatch(validPayload, "Alice");

    // Give the fire-and-forget promise a tick to resolve
    await new Promise((r) => setTimeout(r, 0));

    expect(mockCreateExecution).toHaveBeenCalledWith(
      "send-push",
      JSON.stringify({
        type: "challenge_received",
        userId: "p2",
        data: { matchId: "m1", challengerName: "Alice" },
      }),
      false
    );
  });
});

// ---- listMatches ----
describe("listMatches", () => {
  it("includes Query.equal filter when leagueId is valid", async () => {
    mockListDocuments.mockResolvedValue({ documents: [{ $id: "m1", leagueId: "lg1" }] });

    const docs = await listMatches({ leagueId: "lg1" });

    expect(docs).toHaveLength(1);
    const queries = mockListDocuments.mock.calls[0][2];
    const hasLeagueFilter = queries.some(
      (q) => typeof q === "string" && q.includes("leagueId")
    );
    expect(hasLeagueFilter).toBe(true);
  });

  it("skips leagueId filter when leagueId is empty", async () => {
    mockListDocuments.mockResolvedValue({ documents: [{ $id: "m1" }] });

    await listMatches({ leagueId: "" });

    const queries = mockListDocuments.mock.calls[0][2];
    const hasLeagueFilter = queries.some(
      (q) => typeof q === "string" && q.includes("leagueId")
    );
    expect(hasLeagueFilter).toBe(false);
  });

  it("falls back to client-side filtering on query error", async () => {
    mockListDocuments
      .mockRejectedValueOnce(new Error("index not found"))
      .mockResolvedValueOnce({
        documents: [
          { $id: "m1", leagueId: "lg1" },
          { $id: "m2", leagueId: "lg2" },
          { $id: "m3" }, // legacy match without leagueId
        ],
      });

    const docs = await listMatches({ leagueId: "lg1" });

    expect(mockListDocuments).toHaveBeenCalledTimes(2);
    expect(docs.map((d) => d.$id)).toEqual(["m1", "m3"]);
  });
});

// ---- updateMatch ----
describe("updateMatch", () => {
  it("calls updateDocument with correct args", async () => {
    mockUpdateDocument.mockResolvedValue({ $id: "m1", isCompleted: true });

    const result = await updateMatch("m1", { isCompleted: true });

    expect(mockUpdateDocument).toHaveBeenCalledWith("test-db", "matches", "m1", {
      isCompleted: true,
    });
    expect(result.$id).toBe("m1");
  });

  it("sends notifications when notifyOptions provided", async () => {
    mockUpdateDocument.mockResolvedValue({ $id: "m1" });
    mockCreateExecution.mockResolvedValue({});

    await updateMatch("m1", { isCompleted: true }, {
      playerIds: ["p1", "p2"],
      type: "score_submitted",
      data: { score: "3-2" },
    });

    // Give fire-and-forget promises a tick
    await new Promise((r) => setTimeout(r, 0));

    expect(mockCreateExecution).toHaveBeenCalledTimes(2);
  });
});

// ---- deleteMatch ----
describe("deleteMatch", () => {
  it("calls deleteDocument with correct args", async () => {
    mockDeleteDocument.mockResolvedValue({});

    await deleteMatch("m1");

    expect(mockDeleteDocument).toHaveBeenCalledWith("test-db", "matches", "m1");
  });

  it("throws when deleteDocument fails", async () => {
    mockDeleteDocument.mockRejectedValue(new Error("Not authorized"));

    await expect(deleteMatch("m1")).rejects.toThrow("Not authorized");
  });
});
