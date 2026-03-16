// Mock node-fetch before requiring anything
const mockFetch = jest.fn();
jest.mock("node-fetch", () => mockFetch);

const handler = require("../index");

// ---- Helpers ----
const ENV = {
  APPWRITE_ENDPOINT: "https://appwrite.test.io/v1",
  APPWRITE_PROJECT_ID: "test-project",
  APPWRITE_API_KEY: "test-key",
  APPWRITE_DATABASE_ID: "test-db",
};

const BASE_URL =
  "https://appwrite.test.io/v1/databases/test-db/collections";

function makeContext(body, headers = {}) {
  return {
    req: {
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: { "x-appwrite-user-id": "user-1", ...headers },
    },
    res: { json: jest.fn((data, status) => ({ data, status })) },
    log: jest.fn(),
    error: jest.fn(),
  };
}

function jsonResponse(data, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

/** Helper: build a mock membership document */
function membership(overrides = {}) {
  return {
    $id: "mem-1",
    userId: "user-1",
    leagueId: "league-1",
    role: "owner",
    status: "approved",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(process.env, ENV);
});

afterEach(() => {
  for (const key of Object.keys(ENV)) delete process.env[key];
});

// ---- Environment validation ----
describe("environment validation", () => {
  it.each(["APPWRITE_ENDPOINT", "APPWRITE_PROJECT_ID", "APPWRITE_API_KEY", "APPWRITE_DATABASE_ID"])(
    "returns 500 when %s is missing",
    async (key) => {
      delete process.env[key];
      const ctx = makeContext({ action: "createProfile", profileData: { displayName: "A" } });
      await handler(ctx);
      expect(ctx.res.json).toHaveBeenCalledWith(
        { success: false, error: "Server configuration error" },
        500
      );
    }
  );
});

// ---- Action routing ----
describe("action routing", () => {
  it("returns 400 when action is missing", async () => {
    const ctx = makeContext({});
    await handler(ctx);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "action is required" },
      400
    );
  });

  it("returns 400 for unknown action", async () => {
    const ctx = makeContext({ action: "nonExistentAction" });
    await handler(ctx);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "Unknown action: nonExistentAction" },
      400
    );
  });

  it("returns 401 when x-appwrite-user-id header is missing", async () => {
    const ctx = makeContext({ action: "createProfile", profileData: { displayName: "A" } });
    delete ctx.req.headers["x-appwrite-user-id"];
    await handler(ctx);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "Authentication required" },
      401
    );
  });

  // Verify every supported action is routable (doesn't return "Unknown action")
  const SUPPORTED_ACTIONS = [
    "createMatch",
    "updateMatch",
    "deleteMatch",
    "approveMember",
    "rejectMember",
    "updateMemberRole",
    "transferOwnership",
    "removeMember",
    "requestToJoinLeague",
    "leaveLeague",
    "createLeague",
    "updateLeague",
    "deleteLeague",
    "regenerateInviteCode",
    "createProfile",
    "updateProfile",
  ];

  it.each(SUPPORTED_ACTIONS)(
    "routes '%s' without returning Unknown action",
    async (action) => {
      // We don't care about downstream errors — just that the switch matched
      // Mock fetch to return something for any DB call
      mockFetch.mockResolvedValue(
        jsonResponse({ documents: [], $id: "doc-1", userId: "user-1", leagueId: "league-1", role: "owner", status: "approved", memberCount: 1 })
      );
      const ctx = makeContext({ action });
      await handler(ctx);

      // The response should NOT be "Unknown action: ..."
      const [[responseBody]] = ctx.res.json.mock.calls;
      expect(responseBody.error).not.toMatch(/^Unknown action/);
    }
  );
});

// ---- createProfile ----
describe("createProfile", () => {
  it("returns 400 when profileData is missing", async () => {
    const ctx = makeContext({ action: "createProfile" });
    await handler(ctx);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "profileData with displayName is required" },
      400
    );
  });

  it("returns 400 when displayName is missing", async () => {
    const ctx = makeContext({ action: "createProfile", profileData: {} });
    await handler(ctx);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "profileData with displayName is required" },
      400
    );
  });

  it("creates a profile on happy path", async () => {
    const created = { $id: "profile-1", userId: "user-1", displayName: "Alice", role: "player" };
    // createDocument POST call
    mockFetch.mockResolvedValueOnce(jsonResponse(created));

    const ctx = makeContext({
      action: "createProfile",
      profileData: { displayName: "Alice" },
    });
    await handler(ctx);

    // Verify the POST was made to the profiles collection
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/profiles/documents`);
    expect(opts.method).toBe("POST");

    const body = JSON.parse(opts.body);
    expect(body.data.userId).toBe("user-1");
    expect(body.data.displayName).toBe("Alice");
    expect(body.data.role).toBe("player");

    expect(ctx.res.json).toHaveBeenCalledWith({ success: true, data: created });
  });
});

// ---- updateProfile ----
describe("updateProfile", () => {
  it("returns 400 when profileId is missing", async () => {
    const ctx = makeContext({ action: "updateProfile", profileData: { displayName: "B" } });
    await handler(ctx);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "profileId and profileData are required" },
      400
    );
  });

  it("returns 403 when updating another user's profile", async () => {
    // getDocument returns a profile owned by a different user
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ $id: "profile-2", userId: "other-user", displayName: "Bob" })
    );

    const ctx = makeContext({
      action: "updateProfile",
      profileId: "profile-2",
      profileData: { displayName: "Hacked" },
    });
    await handler(ctx);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "Can only update your own profile" },
      403
    );
  });
});

// ---- createLeague ----
describe("createLeague", () => {
  it("creates a league and owner membership", async () => {
    const league = { $id: "league-new", name: "Test League", memberCount: 1 };
    // createDocument for league
    mockFetch.mockResolvedValueOnce(jsonResponse(league));
    // createDocument for owner membership
    mockFetch.mockResolvedValueOnce(jsonResponse(membership()));

    const ctx = makeContext({
      action: "createLeague",
      leagueData: { name: "Test League" },
    });
    await handler(ctx);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(ctx.res.json).toHaveBeenCalledWith({ success: true, data: league });
  });

  it("returns 400 when leagueData.name is missing", async () => {
    const ctx = makeContext({ action: "createLeague", leagueData: {} });
    await handler(ctx);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "leagueData with name is required" },
      400
    );
  });
});

// ---- Body parsing ----
describe("body parsing", () => {
  it("handles non-JSON body gracefully", async () => {
    const ctx = makeContext("not json");
    ctx.req.body = "not json";
    await handler(ctx);
    // Falls back to the raw body object, action won't be present
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "action is required" },
      400
    );
  });
});
