const mockFetch = jest.fn();
jest.mock("node-fetch", () => mockFetch);

const handler = require("../index");

// ---- Helpers ----
const ENV = {
  APPWRITE_ENDPOINT: "https://appwrite.test.io/v1",
  APPWRITE_PROJECT_ID: "test-project",
  APPWRITE_API_KEY: "test-key",
};

function makeContext(body) {
  return {
    req: { body: typeof body === "string" ? body : JSON.stringify(body) },
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

// ---- No push targets ----
describe("no push targets", () => {
  it("returns message when user has no push targets", async () => {
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
  function setupPushTargets(tokens = ["ExponentPushToken[abc]"]) {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        targets: tokens.map((t, i) => ({
          $id: `t${i}`,
          identifier: t,
          providerType: "push",
        })),
      })
    );
  }

  function setupExpoPushSuccess() {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: [{ status: "ok" }] })
    );
  }

  it("sends challenge_received with challenger name", async () => {
    setupPushTargets();
    setupExpoPushSuccess();

    const ctx = makeContext({
      type: "challenge_received",
      userId: "u1",
      data: { challengerName: "Alice", matchId: "m1" },
    });
    await handler(ctx);

    const [expoUrl, expoOpts] = mockFetch.mock.calls[1];
    expect(expoUrl).toBe("https://exp.host/--/api/v2/push/send");
    const messages = JSON.parse(expoOpts.body);
    expect(messages[0].title).toBe("New Challenge!");
    expect(messages[0].body).toBe("Alice has challenged you to a match");
    expect(messages[0].data).toEqual({
      type: "challenge_received",
      matchId: "m1",
    });
    expect(messages[0].to).toBe("ExponentPushToken[abc]");
    expect(messages[0].sound).toBe("default");
    expect(messages[0].channelId).toBe("matches");

    expect(ctx.res.json).toHaveBeenCalledWith({
      success: true,
      sentTo: 1,
      result: { data: [{ status: "ok" }] },
    });
  });

  it("sends challenge_received without challenger name", async () => {
    setupPushTargets();
    setupExpoPushSuccess();

    const ctx = makeContext({
      type: "challenge_received",
      userId: "u1",
      data: {},
    });
    await handler(ctx);

    const messages = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(messages[0].body).toBe("You have received a new match challenge");
  });

  it("sends match_scheduled with opponent and date", async () => {
    setupPushTargets();
    setupExpoPushSuccess();

    const ctx = makeContext({
      type: "match_scheduled",
      userId: "u1",
      data: { opponentName: "Bob", date: "March 10", matchId: "m2" },
    });
    await handler(ctx);

    const messages = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(messages[0].title).toBe("Match Scheduled");
    expect(messages[0].body).toBe(
      "Your match against Bob is scheduled for March 10"
    );
  });

  it("sends match_scheduled without opponent name", async () => {
    setupPushTargets();
    setupExpoPushSuccess();

    const ctx = makeContext({
      type: "match_scheduled",
      userId: "u1",
      data: {},
    });
    await handler(ctx);

    const messages = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(messages[0].body).toBe("A match has been scheduled");
  });

  it("sends score_submitted with score", async () => {
    setupPushTargets();
    setupExpoPushSuccess();

    const ctx = makeContext({
      type: "score_submitted",
      userId: "u1",
      data: { score: "3-2", matchId: "m3" },
    });
    await handler(ctx);

    const messages = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(messages[0].title).toBe("Match Complete");
    expect(messages[0].body).toBe("Match result: 3-2");
  });

  it("sends score_submitted without score", async () => {
    setupPushTargets();
    setupExpoPushSuccess();

    const ctx = makeContext({
      type: "score_submitted",
      userId: "u1",
      data: {},
    });
    await handler(ctx);

    const messages = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(messages[0].body).toBe("A match result has been submitted");
  });

  it("handles unknown notification type with default message", async () => {
    setupPushTargets();
    setupExpoPushSuccess();

    const ctx = makeContext({
      type: "custom_type",
      userId: "u1",
      data: { message: "Custom message" },
    });
    await handler(ctx);

    const messages = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(messages[0].title).toBe("Pool League");
    expect(messages[0].body).toBe("Custom message");
  });

  it("handles unknown type without data.message", async () => {
    setupPushTargets();
    setupExpoPushSuccess();

    const ctx = makeContext({ type: "other", userId: "u1" });
    await handler(ctx);

    const messages = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(messages[0].body).toBe("You have a new notification");
  });

  it("sends to multiple push targets", async () => {
    setupPushTargets(["ExponentPushToken[aaa]", "ExponentPushToken[bbb]"]);
    setupExpoPushSuccess();

    const ctx = makeContext({
      type: "challenge_received",
      userId: "u1",
      data: { challengerName: "Alice" },
    });
    await handler(ctx);

    const messages = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(messages).toHaveLength(2);
    expect(messages[0].to).toBe("ExponentPushToken[aaa]");
    expect(messages[1].to).toBe("ExponentPushToken[bbb]");

    expect(ctx.res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, sentTo: 2 })
    );
  });
});

// ---- Error handling ----
describe("error handling", () => {
  it("returns 500 when fetching targets fails", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: "error" }, false, 500));

    const ctx = makeContext({ type: "challenge_received", userId: "u1" });
    await handler(ctx);

    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "Failed to fetch user targets" },
      500
    );
  });

  it("returns 500 when Expo push fails", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        targets: [{ $id: "t1", identifier: "tok", providerType: "push" }],
      })
    );
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
});
