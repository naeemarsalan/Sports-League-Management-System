// ---- Mocks ----
const mockCreateDocument = jest.fn();
const mockListDocuments = jest.fn();
const mockUpdateDocument = jest.fn();
const mockGetDocument = jest.fn();

jest.mock("../appwrite", () => {
  const appwrite = jest.requireActual("appwrite");
  return {
    databases: {
      createDocument: (...args) => mockCreateDocument(...args),
      listDocuments: (...args) => mockListDocuments(...args),
      updateDocument: (...args) => mockUpdateDocument(...args),
      getDocument: (...args) => mockGetDocument(...args),
    },
    appwriteConfig: {
      databaseId: "test-db",
      leaguesCollectionId: "leagues",
      leagueMembersCollectionId: "league-members",
    },
    ID: { unique: () => "unique-id" },
    Query: appwrite.Query,
  };
});

const {
  generateInviteCode,
  createLeague,
  getLeague,
  getLeagueByInviteCode,
  listLeagues,
  updateLeague,
  regenerateInviteCode,
  deleteLeague,
  updateMemberCount,
} = require("../leagues");

// ---- Helpers ----
beforeEach(() => {
  jest.clearAllMocks();
});

// ---- generateInviteCode ----
describe("generateInviteCode", () => {
  it("returns a 6-character string", () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(6);
  });

  it("only contains valid characters", () => {
    const validChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
    for (let i = 0; i < 20; i++) {
      expect(generateInviteCode()).toMatch(validChars);
    }
  });

  it("generates different codes on multiple calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateInviteCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

// ---- createLeague ----
describe("createLeague", () => {
  const payload = { name: "Test League", description: "A league", createdBy: "user-1" };

  it("passes correct args to createDocument", async () => {
    mockCreateDocument.mockResolvedValue({ $id: "lg1", ...payload });

    await createLeague(payload);

    expect(mockCreateDocument).toHaveBeenCalledTimes(2);
    const [dbId, colId, docId, data] = mockCreateDocument.mock.calls[0];
    expect(dbId).toBe("test-db");
    expect(colId).toBe("leagues");
    expect(docId).toBe("unique-id");
    expect(data.name).toBe("Test League");
    expect(data.description).toBe("A league");
    expect(data.createdBy).toBe("user-1");
    expect(data.isActive).toBe(true);
    expect(data.memberCount).toBe(1);
    expect(data.inviteCode).toHaveLength(6);
  });

  it("auto-adds creator as owner member", async () => {
    mockCreateDocument.mockResolvedValue({ $id: "lg1" });

    await createLeague(payload);

    const [dbId, colId, docId, data] = mockCreateDocument.mock.calls[1];
    expect(dbId).toBe("test-db");
    expect(colId).toBe("league-members");
    expect(data.leagueId).toBe("lg1");
    expect(data.userId).toBe("user-1");
    expect(data.role).toBe("owner");
    expect(data.status).toBe("approved");
  });

  it("defaults description to empty string", async () => {
    mockCreateDocument.mockResolvedValue({ $id: "lg1" });

    await createLeague({ name: "No Desc", createdBy: "user-1" });

    const [, , , data] = mockCreateDocument.mock.calls[0];
    expect(data.description).toBe("");
  });
});

// ---- getLeague ----
describe("getLeague", () => {
  it("calls getDocument with correct args", async () => {
    mockGetDocument.mockResolvedValue({ $id: "lg1" });

    const result = await getLeague("lg1");

    expect(mockGetDocument).toHaveBeenCalledWith("test-db", "leagues", "lg1");
    expect(result.$id).toBe("lg1");
  });
});

// ---- getLeagueByInviteCode ----
describe("getLeagueByInviteCode", () => {
  it("queries with uppercase code", async () => {
    mockListDocuments.mockResolvedValue({ documents: [{ $id: "lg1" }] });

    await getLeagueByInviteCode("abc123");

    const queries = mockListDocuments.mock.calls[0][2];
    const hasCodeFilter = queries.some((q) => typeof q === "string" && q.includes("ABC123"));
    expect(hasCodeFilter).toBe(true);
  });

  it("returns null when not found", async () => {
    mockListDocuments.mockResolvedValue({ documents: [] });

    const result = await getLeagueByInviteCode("ZZZZZZ");

    expect(result).toBeNull();
  });
});

// ---- listLeagues ----
describe("listLeagues", () => {
  it("queries active leagues ordered by memberCount", async () => {
    mockListDocuments.mockResolvedValue({ documents: [{ $id: "lg1" }, { $id: "lg2" }] });

    const docs = await listLeagues();

    expect(docs).toHaveLength(2);
    const queries = mockListDocuments.mock.calls[0][2];
    const hasActiveFilter = queries.some((q) => typeof q === "string" && q.includes("isActive"));
    const hasMemberOrder = queries.some((q) => typeof q === "string" && q.includes("memberCount"));
    expect(hasActiveFilter).toBe(true);
    expect(hasMemberOrder).toBe(true);
  });
});

// ---- updateLeague ----
describe("updateLeague", () => {
  it("passes payload correctly", async () => {
    mockUpdateDocument.mockResolvedValue({ $id: "lg1", name: "Updated" });

    const result = await updateLeague("lg1", { name: "Updated" });

    expect(mockUpdateDocument).toHaveBeenCalledWith("test-db", "leagues", "lg1", { name: "Updated" });
    expect(result.name).toBe("Updated");
  });
});

// ---- regenerateInviteCode ----
describe("regenerateInviteCode", () => {
  it("generates new code and updates document", async () => {
    mockUpdateDocument.mockResolvedValue({ $id: "lg1" });

    await regenerateInviteCode("lg1");

    expect(mockUpdateDocument).toHaveBeenCalledTimes(1);
    const [dbId, colId, docId, data] = mockUpdateDocument.mock.calls[0];
    expect(dbId).toBe("test-db");
    expect(colId).toBe("leagues");
    expect(docId).toBe("lg1");
    expect(data.inviteCode).toHaveLength(6);
  });
});

// ---- deleteLeague ----
describe("deleteLeague", () => {
  it("sets isActive to false", async () => {
    mockUpdateDocument.mockResolvedValue({ $id: "lg1", isActive: false });

    await deleteLeague("lg1");

    expect(mockUpdateDocument).toHaveBeenCalledWith("test-db", "leagues", "lg1", { isActive: false });
  });
});

// ---- updateMemberCount ----
describe("updateMemberCount", () => {
  it("fetches league and computes new count with delta", async () => {
    mockGetDocument.mockResolvedValue({ $id: "lg1", memberCount: 5 });
    mockUpdateDocument.mockResolvedValue({ $id: "lg1", memberCount: 6 });

    await updateMemberCount("lg1", 1);

    expect(mockGetDocument).toHaveBeenCalledWith("test-db", "leagues", "lg1");
    expect(mockUpdateDocument).toHaveBeenCalledWith("test-db", "leagues", "lg1", { memberCount: 6 });
  });

  it("floors count at 0", async () => {
    mockGetDocument.mockResolvedValue({ $id: "lg1", memberCount: 0 });
    mockUpdateDocument.mockResolvedValue({ $id: "lg1", memberCount: 0 });

    await updateMemberCount("lg1", -5);

    expect(mockUpdateDocument).toHaveBeenCalledWith("test-db", "leagues", "lg1", { memberCount: 0 });
  });
});
