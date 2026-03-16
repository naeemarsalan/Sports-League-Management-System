const mockFetch = jest.fn();
jest.mock("node-fetch", () => mockFetch);

const handler = require("../index");

const ENV = {
  APPWRITE_ENDPOINT: "https://appwrite.test.io/v1",
  APPWRITE_PROJECT_ID: "test-project",
  APPWRITE_API_KEY: "test-key",
  APPWRITE_DATABASE_ID: "test-db",
  APPWRITE_PROFILES_COLLECTION_ID: "profiles",
  APPWRITE_LEAGUE_MEMBERS_COLLECTION_ID: "league_members",
  APPWRITE_LEAGUES_COLLECTION_ID: "leagues",
};

function makeContext(headers = {}) {
  return {
    req: {
      body: "{}",
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

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(process.env, ENV);
});

afterEach(() => {
  for (const key of Object.keys(ENV)) delete process.env[key];
});

describe("environment validation", () => {
  it.each(["APPWRITE_ENDPOINT", "APPWRITE_PROJECT_ID", "APPWRITE_API_KEY", "APPWRITE_DATABASE_ID"])(
    "returns 500 when %s is missing",
    async (key) => {
      delete process.env[key];
      const ctx = makeContext();
      await handler(ctx);
      expect(ctx.res.json).toHaveBeenCalledWith(
        { success: false, error: "Server configuration error" },
        500
      );
    }
  );
});

describe("authentication", () => {
  it("returns 401 when x-appwrite-user-id header is missing", async () => {
    const ctx = makeContext();
    delete ctx.req.headers["x-appwrite-user-id"];
    await handler(ctx);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "Authentication required" },
      401
    );
  });
});

describe("happy path - full account deletion", () => {
  it("deletes profile, memberships, and user account", async () => {
    // 1. List profiles → one profile doc
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ documents: [{ $id: "prof-1" }] })
    );
    // 2. Delete profile doc
    mockFetch.mockResolvedValueOnce(jsonResponse({}, true));
    // 3. List memberships (page 1, no more pages)
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        documents: [
          { $id: "mem-1", status: "approved", leagueId: "league-1" },
        ],
      })
    );
    // 4. Get league for member count
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ $id: "league-1", memberCount: 5 })
    );
    // 5. Patch league member count
    mockFetch.mockResolvedValueOnce(jsonResponse({}, true));
    // 6. Delete membership doc
    mockFetch.mockResolvedValueOnce(jsonResponse({}, true));
    // 7. Delete user account
    mockFetch.mockResolvedValueOnce(jsonResponse({}, true));

    const ctx = makeContext();
    await handler(ctx);

    expect(ctx.res.json).toHaveBeenCalledWith({ success: true, errors: undefined });
    expect(mockFetch).toHaveBeenCalledTimes(7);
  });
});

describe("user account deletion failure", () => {
  it("returns 500 when user deletion fails", async () => {
    // List profiles → empty
    mockFetch.mockResolvedValueOnce(jsonResponse({ documents: [] }));
    // List memberships → empty
    mockFetch.mockResolvedValueOnce(jsonResponse({ documents: [] }));
    // Delete user → fails
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: "not found" }, false, 404));

    const ctx = makeContext();
    await handler(ctx);

    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "Failed to delete account" },
      500
    );
  });
});

describe("partial failure resilience", () => {
  it("continues deletion even when profile delete fails", async () => {
    // List profiles → one doc
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ documents: [{ $id: "prof-1" }] })
    );
    // Delete profile → fails
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: "err" }, false, 500));
    // List memberships → empty
    mockFetch.mockResolvedValueOnce(jsonResponse({ documents: [] }));
    // Delete user → succeeds
    mockFetch.mockResolvedValueOnce(jsonResponse({}, true));

    const ctx = makeContext();
    await handler(ctx);

    const [[result]] = ctx.res.json.mock.calls;
    expect(result.success).toBe(true);
    expect(result.errors).toContain("profile:prof-1");
  });
});

describe("no memberships", () => {
  it("handles user with no profiles or memberships", async () => {
    // List profiles → empty
    mockFetch.mockResolvedValueOnce(jsonResponse({ documents: [] }));
    // List memberships → empty
    mockFetch.mockResolvedValueOnce(jsonResponse({ documents: [] }));
    // Delete user → success
    mockFetch.mockResolvedValueOnce(jsonResponse({}, true));

    const ctx = makeContext();
    await handler(ctx);

    expect(ctx.res.json).toHaveBeenCalledWith({ success: true, errors: undefined });
  });
});

describe("pending membership - no count decrement", () => {
  it("does not decrement league member count for pending memberships", async () => {
    // List profiles → empty
    mockFetch.mockResolvedValueOnce(jsonResponse({ documents: [] }));
    // List memberships → one pending
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        documents: [{ $id: "mem-1", status: "pending", leagueId: "league-1" }],
      })
    );
    // Delete membership
    mockFetch.mockResolvedValueOnce(jsonResponse({}, true));
    // Delete user
    mockFetch.mockResolvedValueOnce(jsonResponse({}, true));

    const ctx = makeContext();
    await handler(ctx);

    // Should be 4 calls: list profiles, list members, delete membership, delete user
    // NOT 6 (no league GET + PATCH for count)
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(ctx.res.json).toHaveBeenCalledWith({ success: true, errors: undefined });
  });
});
