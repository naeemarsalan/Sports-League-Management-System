const mockFetch = jest.fn();
jest.mock("node-fetch", () => mockFetch);

const handler = require("../index");

// ---- Helpers ----
const ENV = {
  APPWRITE_ENDPOINT: "https://appwrite.test.io/v1",
  APPWRITE_PROJECT_ID: "test-project",
  APPWRITE_API_KEY: "test-key",
  PUSH_PROVIDER_ID: "expo-push",
};

function makeContext(body, headers = {}) {
  const parsed = typeof body === "object" ? body : {};
  return {
    req: {
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: { "x-appwrite-user-id": parsed.userId || "", ...headers },
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

// ---- Missing env vars ----
describe("environment validation", () => {
  it("returns 500 when APPWRITE_ENDPOINT is missing", async () => {
    delete process.env.APPWRITE_ENDPOINT;
    const ctx = makeContext({ userId: "u1", token: "tok" });

    await handler(ctx);

    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "Server configuration error" },
      500
    );
    expect(ctx.error).toHaveBeenCalled();
  });
});

// ---- Input validation ----
describe("input validation", () => {
  it("returns 400 when userId is missing", async () => {
    const ctx = makeContext({ token: "tok" });
    await handler(ctx);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "userId and token are required" },
      400
    );
  });

  it("returns 400 when token is missing", async () => {
    const ctx = makeContext({ userId: "u1" });
    await handler(ctx);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "userId and token are required" },
      400
    );
  });

  it("returns 400 when body is empty", async () => {
    const ctx = makeContext({});
    await handler(ctx);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "userId and token are required" },
      400
    );
  });

  it("handles non-JSON body gracefully", async () => {
    const ctx = makeContext("not json");
    // body is already a string, the function tries JSON.parse then falls back
    ctx.req.body = "not json";
    await handler(ctx);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "userId and token are required" },
      400
    );
  });
});

// ---- Token already exists ----
describe("existing token", () => {
  it("returns existed:true when token already saved", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        targets: [
          { $id: "existing-target", identifier: "ExponentPushToken[abc]", providerType: "push" },
        ],
      })
    );

    const ctx = makeContext({ userId: "u1", token: "ExponentPushToken[abc]" });
    await handler(ctx);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(ctx.res.json).toHaveBeenCalledWith({
      success: true,
      targetId: "existing-target",
      existed: true,
    });
    expect(ctx.log).toHaveBeenCalledWith(
      expect.stringContaining("Token already exists")
    );
  });
});

// ---- New token creation ----
describe("new token", () => {
  it("creates a new push target with providerId", async () => {
    // First call: list targets (empty)
    mockFetch.mockResolvedValueOnce(jsonResponse({ targets: [] }));
    // Second call: create target
    mockFetch.mockResolvedValueOnce(jsonResponse({ $id: "new-target-123" }));

    const ctx = makeContext({ userId: "u1", token: "ExponentPushToken[xyz]", platform: "ios" });
    await handler(ctx);

    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Verify list call
    const [listUrl, listOpts] = mockFetch.mock.calls[0];
    expect(listUrl).toBe("https://appwrite.test.io/v1/users/u1/targets");
    expect(listOpts.headers["X-Appwrite-Project"]).toBe("test-project");

    // Verify create call includes providerId
    const [createUrl, createOpts] = mockFetch.mock.calls[1];
    expect(createUrl).toBe("https://appwrite.test.io/v1/users/u1/targets");
    expect(createOpts.method).toBe("POST");
    const createBody = JSON.parse(createOpts.body);
    expect(createBody.providerType).toBe("push");
    expect(createBody.providerId).toBe("expo-push");
    expect(createBody.identifier).toBe("ExponentPushToken[xyz]");
    expect(createBody.name).toMatch(/^ios_push_/);

    // Verify response
    expect(ctx.res.json).toHaveBeenCalledWith({
      success: true,
      targetId: "new-target-123",
      created: true,
    });
  });

  it("uses 'mobile' as default platform", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ targets: [] }));
    mockFetch.mockResolvedValueOnce(jsonResponse({ $id: "t1" }));

    const ctx = makeContext({ userId: "u1", token: "tok" });
    await handler(ctx);

    const createBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(createBody.name).toMatch(/^mobile_push_/);
  });
});

// ---- Error handling ----
describe("error handling", () => {
  it("returns 500 when listing targets fails", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: "not found" }, false, 404));

    const ctx = makeContext({ userId: "u1", token: "tok" });
    await handler(ctx);

    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "Failed to list user targets" },
      500
    );
    expect(ctx.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to list user targets")
    );
  });

  it("returns 500 when creating target fails", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ targets: [] }));
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: "bad request" }, false, 400));

    const ctx = makeContext({ userId: "u1", token: "tok" });
    await handler(ctx);

    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "Failed to create push target" },
      500
    );
  });

  it("returns 500 when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const ctx = makeContext({ userId: "u1", token: "tok" });
    await handler(ctx);

    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "Internal server error" },
      500
    );
    expect(ctx.error).toHaveBeenCalledWith(
      expect.stringContaining("Network error")
    );
  });

  it("ignores non-push targets when checking duplicates", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        targets: [
          { $id: "t-email", identifier: "tok", providerType: "email" },
        ],
      })
    );
    mockFetch.mockResolvedValueOnce(jsonResponse({ $id: "new-t" }));

    const ctx = makeContext({ userId: "u1", token: "tok" });
    await handler(ctx);

    // Should create new target since existing is email, not push
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(ctx.res.json).toHaveBeenCalledWith({
      success: true,
      targetId: "new-t",
      created: true,
    });
  });
});
