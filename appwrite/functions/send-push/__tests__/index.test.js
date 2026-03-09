const mockFetch = jest.fn();
jest.mock("node-fetch", () => mockFetch);

const handler = require("../index");

// ---- Helpers ----
const ENV = {
  APPWRITE_ENDPOINT: "https://appwrite.test.io/v1",
  APPWRITE_PROJECT_ID: "test-project",
  APPWRITE_API_KEY: "test-key",
  APPWRITE_DATABASE_ID: "pool-league",
  APPWRITE_PROFILES_COLLECTION_ID: "profiles",
};

function makeContext(body, headers = {}) {
  return {
    req: {
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: { "x-appwrite-user-id": "caller-1", ...headers },
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

// ---- Environment validation ----
describe("environment validation", () => {
  it("returns 500 when env vars are missing", async () => {
    delete process.env.APPWRITE_API_KEY;
    const ctx = makeContext({ type: "challenge_received", userId: "u1" });

    await handler(ctx);

    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "Server configuration error" },
      500
    );
  });
});

// ---- Input validation ----
describe("input validation", () => {
  it("returns 400 when type is missing", async () => {
    const ctx = makeContext({ userId: "u1" });
    await handler(ctx);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "type and userId are required" },
      400
    );
  });

  it("returns 400 when userId is missing", async () => {
    const ctx = makeContext({ type: "challenge_received" });
    await handler(ctx);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "type and userId are required" },
      400
    );
  });
});

// ---- Authentication ----
describe("authentication", () => {
  it("returns 401 when x-appwrite-user-id header is missing", async () => {
    const ctx = makeContext(
      { type: "challenge_received", userId: "u1" },
      { "x-appwrite-user-id": undefined }
    );
    delete ctx.req.headers["x-appwrite-user-id"];

    await handler(ctx);

    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "Authentication required" },
      401
    );
  });
});

// ---- Profile → auth user resolution ----
describe("profile resolution", () => {
  function setupProfileLookup(profileData, ok = true) {
    mockFetch.mockImplementationOnce(() => jsonResponse(profileData, ok));
  }

  it("resolves profile ID to auth user ID for targets lookup", async () => {
    // 1) profile lookup → returns auth userId
    setupProfileLookup({ userId: "auth-user-99" });
    // 2) targets → push target
    mockFetch.mockImplementationOnce(() =>
      jsonResponse({
        targets: [{ $id: "t0", providerType: "push", identifier: "device-token-abc" }],
      })
    );
    // 3) Appwrite Messaging → ok
    mockFetch.mockImplementationOnce(() =>
      jsonResponse({ $id: "msg-1", status: "sent" })
    );

    const ctx = makeContext({
      type: "challenge_received",
      userId: "profile-doc-1",
      data: { matchId: "m1", challengerName: "Alice" },
    });

    await handler(ctx);

    // Profile lookup URL
    expect(mockFetch.mock.calls[0][0]).toContain(
      "/databases/pool-league/collections/profiles/documents/profile-doc-1"
    );
    // Targets URL should use the resolved auth user ID
    expect(mockFetch.mock.calls[1][0]).toContain("/users/auth-user-99/targets");

    expect(ctx.res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, sentTo: 1 })
    );
    expect(ctx.log).toHaveBeenCalledWith(
      "Resolved profile profile-doc-1 to auth user auth-user-99"
    );
  });

  it("falls back to original userId when profile lookup fails", async () => {
    // profile lookup 404
    setupProfileLookup({}, false);
    // targets
    mockFetch.mockImplementationOnce(() =>
      jsonResponse({
        targets: [{ $id: "t0", providerType: "push", identifier: "device-token-yyy" }],
      })
    );
    // Appwrite Messaging
    mockFetch.mockImplementationOnce(() =>
      jsonResponse({ $id: "msg-2", status: "sent" })
    );

    const ctx = makeContext({
      type: "challenge_received",
      userId: "raw-user-id",
      data: { matchId: "m2" },
    });

    await handler(ctx);

    // Should fall back and use original userId for targets
    expect(mockFetch.mock.calls[1][0]).toContain("/users/raw-user-id/targets");
    expect(ctx.log).toHaveBeenCalledWith(
      "Profile lookup failed for raw-user-id, trying as auth user ID"
    );
    expect(ctx.res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  it("falls back when profile has no userId field", async () => {
    setupProfileLookup({ name: "Test User" }); // no userId field
    mockFetch.mockImplementationOnce(() =>
      jsonResponse({
        targets: [{ $id: "t0", providerType: "push", identifier: "device-token-zzz" }],
      })
    );
    mockFetch.mockImplementationOnce(() =>
      jsonResponse({ $id: "msg-3", status: "sent" })
    );

    const ctx = makeContext({
      type: "challenge_received",
      userId: "profile-no-uid",
      data: {},
    });

    await handler(ctx);

    // Without userId in profile, should keep original
    expect(mockFetch.mock.calls[1][0]).toContain("/users/profile-no-uid/targets");
  });
});

// ---- No push targets ----
describe("no push targets", () => {
  it("returns message when user has no push targets", async () => {
    // profile lookup
    mockFetch.mockResolvedValueOnce(jsonResponse({ userId: "auth-1" }));
    // targets: empty
    mockFetch.mockResolvedValueOnce(jsonResponse({ targets: [] }));

    const ctx = makeContext({ type: "challenge_received", userId: "u1" });
    await handler(ctx);

    expect(ctx.res.json).toHaveBeenCalledWith({
      success: false,
      message: "No push targets for user",
    });
    expect(ctx.log).toHaveBeenCalledWith(
      expect.stringContaining("No push targets")
    );
  });

  it("filters out non-push targets", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ userId: "auth-1" }));
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        targets: [{ $id: "t1", identifier: "email@test.com", providerType: "email" }],
      })
    );

    const ctx = makeContext({ type: "challenge_received", userId: "u1" });
    await handler(ctx);

    expect(ctx.res.json).toHaveBeenCalledWith({
      success: false,
      message: "No push targets for user",
    });
  });
});

// ---- Notification types ----
describe("notification types", () => {
  function setupProfileAndTargets(targetIds = ["t0"]) {
    // profile lookup
    mockFetch.mockResolvedValueOnce(jsonResponse({ userId: "auth-1" }));
    // targets
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        targets: targetIds.map((id) => ({
          $id: id,
          identifier: `device-token-${id}`,
          providerType: "push",
        })),
      })
    );
  }

  function setupMessagingSuccess() {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ $id: "msg-1", status: "sent" })
    );
  }

  it("sends challenge_received with challenger name", async () => {
    setupProfileAndTargets();
    setupMessagingSuccess();

    const ctx = makeContext({
      type: "challenge_received",
      userId: "u1",
      data: { challengerName: "Alice", matchId: "m1" },
    });
    await handler(ctx);

    const [msgUrl, msgOpts] = mockFetch.mock.calls[2];
    expect(msgUrl).toBe("https://appwrite.test.io/v1/messaging/messages/push");
    const payload = JSON.parse(msgOpts.body);
    expect(payload.title).toBe("New Challenge!");
    expect(payload.body).toBe("Alice has challenged you to a match");
    expect(payload.data).toEqual({
      type: "challenge_received",
      matchId: "m1",
    });
    expect(payload.targets).toEqual(["t0"]);
    expect(payload.badge).toBe(1);
    expect(payload.sound).toBe("default");
    expect(payload.messageId).toBeDefined();

    expect(ctx.res.json).toHaveBeenCalledWith({
      success: true,
      sentTo: 1,
      result: { $id: "msg-1", status: "sent" },
    });
  });

  it("sends challenge_received without challenger name", async () => {
    setupProfileAndTargets();
    setupMessagingSuccess();

    const ctx = makeContext({
      type: "challenge_received",
      userId: "u1",
      data: {},
    });
    await handler(ctx);

    const payload = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(payload.body).toBe("You have received a new match challenge");
  });

  it("sends match_scheduled with opponent and date", async () => {
    setupProfileAndTargets();
    setupMessagingSuccess();

    const ctx = makeContext({
      type: "match_scheduled",
      userId: "u1",
      data: { opponentName: "Bob", date: "March 10", matchId: "m2" },
    });
    await handler(ctx);

    const payload = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(payload.title).toBe("Match Scheduled");
    expect(payload.body).toBe(
      "Your match against Bob is scheduled for March 10"
    );
  });

  it("sends match_scheduled without opponent name", async () => {
    setupProfileAndTargets();
    setupMessagingSuccess();

    const ctx = makeContext({
      type: "match_scheduled",
      userId: "u1",
      data: {},
    });
    await handler(ctx);

    const payload = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(payload.body).toBe("A match has been scheduled");
  });

  it("sends score_submitted with score", async () => {
    setupProfileAndTargets();
    setupMessagingSuccess();

    const ctx = makeContext({
      type: "score_submitted",
      userId: "u1",
      data: { score: "3-2", matchId: "m3" },
    });
    await handler(ctx);

    const payload = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(payload.title).toBe("Match Complete");
    expect(payload.body).toBe("Match result: 3-2");
  });

  it("sends score_submitted without score", async () => {
    setupProfileAndTargets();
    setupMessagingSuccess();

    const ctx = makeContext({
      type: "score_submitted",
      userId: "u1",
      data: {},
    });
    await handler(ctx);

    const payload = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(payload.body).toBe("A match result has been submitted");
  });

  it("handles unknown notification type with default message", async () => {
    setupProfileAndTargets();
    setupMessagingSuccess();

    const ctx = makeContext({
      type: "custom_type",
      userId: "u1",
      data: { message: "Custom message" },
    });
    await handler(ctx);

    const payload = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(payload.title).toBe("Pool League");
    expect(payload.body).toBe("Custom message");
  });

  it("handles unknown type without data.message", async () => {
    setupProfileAndTargets();
    setupMessagingSuccess();

    const ctx = makeContext({ type: "other", userId: "u1" });
    await handler(ctx);

    const payload = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(payload.body).toBe("You have a new notification");
  });

  it("sends to multiple push targets", async () => {
    setupProfileAndTargets(["t0", "t1"]);
    setupMessagingSuccess();

    const ctx = makeContext({
      type: "challenge_received",
      userId: "u1",
      data: { challengerName: "Alice" },
    });
    await handler(ctx);

    const payload = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(payload.targets).toEqual(["t0", "t1"]);

    expect(ctx.res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, sentTo: 2 })
    );
  });
});

// ---- Error handling ----
describe("error handling", () => {
  it("returns 500 when fetching targets fails", async () => {
    // profile lookup ok
    mockFetch.mockResolvedValueOnce(jsonResponse({ userId: "auth-1" }));
    // targets fail
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: "error" }, false, 500));

    const ctx = makeContext({ type: "challenge_received", userId: "u1" });
    await handler(ctx);

    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "Failed to fetch user targets" },
      500
    );
  });

  it("returns 500 when Appwrite Messaging fails", async () => {
    // profile lookup ok
    mockFetch.mockResolvedValueOnce(jsonResponse({ userId: "auth-1" }));
    // targets ok
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        targets: [{ $id: "t1", identifier: "tok", providerType: "push" }],
      })
    );
    // messaging fail
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: "invalid" }, false, 400));

    const ctx = makeContext({ type: "challenge_received", userId: "u1" });
    await handler(ctx);

    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "Failed to send push notification" },
      500
    );
  });

  it("returns 500 when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network failure"));

    const ctx = makeContext({ type: "challenge_received", userId: "u1" });
    await handler(ctx);

    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "Network failure" },
      500
    );
  });

  it("sanitizes HTML in user-provided strings", async () => {
    // profile lookup
    mockFetch.mockResolvedValueOnce(jsonResponse({ userId: "auth-1" }));
    // targets
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        targets: [{ $id: "t0", providerType: "push", identifier: "device-token-xxx" }],
      })
    );
    // messaging
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ $id: "msg-1", status: "sent" })
    );

    const ctx = makeContext({
      type: "challenge_received",
      userId: "u1",
      data: { matchId: "m1", challengerName: '<script>alert("xss")</script>Bob' },
    });

    await handler(ctx);

    const payload = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(payload.body).not.toContain("<script>");
    expect(payload.body).toContain("Bob");
  });
});
