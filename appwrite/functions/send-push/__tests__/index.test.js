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
      headers: { "x-appwrite-user-id": "caller-1", "x-appwrite-key": "fn-key", ...headers },
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
  jest.resetAllMocks();
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
      { "x-appwrite-user-id": undefined, "x-appwrite-key": undefined }
    );
    delete ctx.req.headers["x-appwrite-user-id"];
    delete ctx.req.headers["x-appwrite-key"];

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

  it("sends join_request with requesterName", async () => {
    setupProfileAndTargets();
    setupMessagingSuccess();

    const ctx = makeContext({
      type: "join_request",
      userId: "u1",
      data: { requesterName: "Charlie" },
    });
    await handler(ctx);

    const payload = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(payload.title).toBe("New Join Request");
    expect(payload.body).toBe("Charlie wants to join your league");
    expect(payload.data).toEqual({ type: "join_request" });
  });

  it("sends join_request without requesterName", async () => {
    setupProfileAndTargets();
    setupMessagingSuccess();

    const ctx = makeContext({
      type: "join_request",
      userId: "u1",
      data: {},
    });
    await handler(ctx);

    const payload = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(payload.body).toBe("Someone wants to join your league");
  });

  it("sends join_approved with leagueName", async () => {
    setupProfileAndTargets();
    setupMessagingSuccess();

    const ctx = makeContext({
      type: "join_approved",
      userId: "u1",
      data: { leagueName: "City League" },
    });
    await handler(ctx);

    const payload = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(payload.title).toBe("Request Approved");
    expect(payload.body).toBe("You've been accepted into City League");
    expect(payload.data).toEqual({ type: "join_approved" });
  });

  it("sends join_rejected with leagueName", async () => {
    setupProfileAndTargets();
    setupMessagingSuccess();

    const ctx = makeContext({
      type: "join_rejected",
      userId: "u1",
      data: { leagueName: "City League" },
    });
    await handler(ctx);

    const payload = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(payload.title).toBe("Request Declined");
    expect(payload.body).toBe("Your request to join City League was declined");
    expect(payload.data).toEqual({ type: "join_rejected" });
  });

  it("sends position_overtaken with overtakerName", async () => {
    setupProfileAndTargets();
    setupMessagingSuccess();

    const ctx = makeContext({
      type: "position_overtaken",
      userId: "u1",
      data: { overtakerName: "Dave", oldPosition: 3, newPosition: 4 },
    });
    await handler(ctx);

    const payload = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(payload.title).toBe("Leaderboard Update");
    expect(payload.body).toBe(
      "Dave has overtaken you! You dropped from #3 to #4"
    );
    expect(payload.data).toEqual({
      type: "position_overtaken",
      oldPosition: 3,
      newPosition: 4,
    });
  });

  it("sends position_overtaken without data", async () => {
    setupProfileAndTargets();
    setupMessagingSuccess();

    const ctx = makeContext({
      type: "position_overtaken",
      userId: "u1",
      data: {},
    });
    await handler(ctx);

    const payload = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(payload.body).toBe("Your leaderboard position has changed");
  });

  it("sends admin_broadcast with title and message", async () => {
    setupProfileAndTargets();
    setupMessagingSuccess();

    const ctx = makeContext({
      type: "admin_broadcast",
      userId: "u1",
      data: { title: "Important Update", message: "Tournaments start Monday" },
    });
    await handler(ctx);

    const payload = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(payload.title).toBe("Important Update");
    expect(payload.body).toBe("Tournaments start Monday");
    expect(payload.data).toEqual({
      type: "admin_broadcast",
      leagueName: undefined,
    });
  });

  it("sends admin_broadcast without title", async () => {
    setupProfileAndTargets();
    setupMessagingSuccess();

    const ctx = makeContext({
      type: "admin_broadcast",
      userId: "u1",
      data: { message: "Season ends Friday" },
    });
    await handler(ctx);

    const payload = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(payload.title).toBe("League Announcement");
    expect(payload.body).toBe("Season ends Friday");
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
      { success: false, error: "Internal server error" },
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

// ---- Rate limiting ----
describe("rate limiting", () => {
  function setupProfileAndTargets() {
    // profile lookup
    mockFetch.mockResolvedValueOnce(jsonResponse({ userId: "auth-1" }));
    // targets
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        targets: [
          { $id: "t0", identifier: "device-token-t0", providerType: "push" },
        ],
      })
    );
  }

  function setupMessagingSuccess() {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ $id: "msg-1", status: "sent" })
    );
  }

  it("skips rate limiting when no leagueId", async () => {
    setupProfileAndTargets();
    setupMessagingSuccess();

    const ctx = makeContext({
      type: "challenge_received",
      userId: "u1",
      data: { challengerName: "Alice" },
    });
    await handler(ctx);

    // Without leagueId, call 0 is profile lookup (no rate limit calls)
    expect(mockFetch.mock.calls[0][0]).toContain(
      "/databases/pool-league/collections/profiles/documents/u1"
    );
    expect(ctx.res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, sentTo: 1 })
    );
  });

  it("allows notification when under daily limit", async () => {
    // call 0: league doc fetch (per-league limit)
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ notificationLimit: 50 })
    );
    // call 1: rate limit logs query — returns existing doc with count=5
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        documents: [{ $id: "log-1", count: 5 }],
      })
    );
    // call 2: profile lookup
    // call 3: targets
    setupProfileAndTargets();
    // call 4: messaging
    setupMessagingSuccess();
    // call 5: logs query (re-query for increment)
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        documents: [{ $id: "log-1", count: 5 }],
      })
    );
    // call 6: PATCH counter
    mockFetch.mockResolvedValueOnce(jsonResponse({ $id: "log-1" }));

    const ctx = makeContext({
      type: "challenge_received",
      userId: "u1",
      data: { challengerName: "Alice" },
      leagueId: "league-1",
    });
    await handler(ctx);

    // call 0: league doc fetch
    expect(mockFetch.mock.calls[0][0]).toContain(
      "/databases/pool-league/collections/leagues/documents/league-1"
    );
    // call 1: logs query
    expect(mockFetch.mock.calls[1][0]).toContain(
      "/databases/pool-league/collections/notification_logs/documents"
    );
    // call 2: profile lookup
    expect(mockFetch.mock.calls[2][0]).toContain(
      "/databases/pool-league/collections/profiles/documents/u1"
    );
    // call 5+6: rate limit counter increment after send
    expect(mockFetch.mock.calls[5][0]).toContain(
      "/databases/pool-league/collections/notification_logs/documents"
    );
    expect(mockFetch.mock.calls[6][0]).toContain(
      "/databases/pool-league/collections/notification_logs/documents/log-1"
    );
    expect(mockFetch.mock.calls[6][1].method).toBe("PATCH");

    expect(ctx.res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, sentTo: 1 })
    );
  });

  it("blocks notification when daily limit reached", async () => {
    // call 0: league doc fetch
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ notificationLimit: 50 })
    );
    // call 1: rate limit logs query — returns doc with count=50 (at limit)
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        documents: [{ $id: "log-1", count: 50 }],
      })
    );

    const ctx = makeContext({
      type: "challenge_received",
      userId: "u1",
      data: { challengerName: "Alice" },
      leagueId: "league-1",
    });
    await handler(ctx);

    // Should have made 2 fetch calls (league doc + logs query) — rate limited before profile lookup
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(ctx.res.json).toHaveBeenCalledWith({
      success: false,
      rateLimited: true,
      error: "Daily notification limit reached for this league",
      count: 50,
      limit: 50,
    });
  });

  it("creates new log document when none exists", async () => {
    // call 0: league doc fetch
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ notificationLimit: 50 })
    );
    // call 1: rate limit logs query — returns empty documents
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ documents: [] })
    );
    // call 2: profile lookup
    // call 3: targets
    setupProfileAndTargets();
    // call 4: messaging
    setupMessagingSuccess();
    // call 5: logs query (re-query for increment)
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ documents: [] })
    );
    // call 6: POST new log doc
    mockFetch.mockResolvedValueOnce(jsonResponse({ $id: "log-new" }));

    const ctx = makeContext({
      type: "challenge_received",
      userId: "u1",
      data: { challengerName: "Alice" },
      leagueId: "league-2",
    });
    await handler(ctx);

    // call 6: POST to create new doc
    expect(mockFetch.mock.calls[6][0]).toContain(
      "/databases/pool-league/collections/notification_logs/documents"
    );
    expect(mockFetch.mock.calls[6][1].method).toBe("POST");
    const postBody = JSON.parse(mockFetch.mock.calls[6][1].body);
    expect(postBody.data.leagueId).toBe("league-2");
    expect(postBody.data.count).toBe(1);

    expect(ctx.res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, sentTo: 1 })
    );
  });

  it("uses per-league notificationLimit from league document", async () => {
    // call 0: league doc fetch — custom limit of 10
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ notificationLimit: 10 })
    );
    // call 1: rate limit logs query — count=10, at custom limit
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        documents: [{ $id: "log-1", count: 10 }],
      })
    );

    const ctx = makeContext({
      type: "challenge_received",
      userId: "u1",
      data: {},
      leagueId: "league-custom",
    });
    await handler(ctx);

    expect(ctx.res.json).toHaveBeenCalledWith({
      success: false,
      rateLimited: true,
      error: "Daily notification limit reached for this league",
      count: 10,
      limit: 10,
    });
  });
});
