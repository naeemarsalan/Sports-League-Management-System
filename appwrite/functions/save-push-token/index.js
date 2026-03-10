const fetch = require("node-fetch");

/**
 * Saves or updates a user's push notification token as an Appwrite user target.
 *
 * Expected body: { userId, token, platform }
 */
module.exports = async ({ req, res, log, error }) => {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const providerId = process.env.PUSH_PROVIDER_ID || "apns-push";

  if (!endpoint || !projectId || !apiKey) {
    error("Missing required environment variables");
    return res.json({ success: false, error: "Server configuration error" }, 500);
  }

  let body = {};
  try {
    body = JSON.parse(req.body || "{}");
  } catch (e) {
    body = req.body || {};
  }

  const { userId, token, platform } = body;

  if (!userId || !token) {
    return res.json({ success: false, error: "userId and token are required" }, 400);
  }

  // Verify the caller is the same user they claim to be
  const authenticatedUserId = req.headers["x-appwrite-user-id"];
  if (!authenticatedUserId) {
    error("Missing x-appwrite-user-id header — unauthenticated request");
    return res.json({ success: false, error: "Authentication required" }, 401);
  }
  if (authenticatedUserId !== userId) {
    error(`userId mismatch: authenticated as ${authenticatedUserId}, but requested ${userId}`);
    return res.json({ success: false, error: "userId does not match authenticated user" }, 403);
  }

  const headers = {
    "X-Appwrite-Project": projectId,
    "X-Appwrite-Key": apiKey,
    "Content-Type": "application/json",
  };

  try {
    // First, get existing targets for this user
    const listUrl = `${endpoint}/users/${userId}/targets`;
    const listRes = await fetch(listUrl, { headers });

    if (!listRes.ok) {
      const errText = await listRes.text();
      error(`Failed to list user targets: ${errText}`);
      return res.json({ success: false, error: "Failed to list user targets" }, 500);
    }

    const targetsData = await listRes.json();
    const targets = targetsData.targets || [];

    // Check if this token already exists
    const existingTarget = targets.find(
      (t) => t.identifier === token && t.providerType === "push"
    );

    if (existingTarget) {
      log(`Token already exists for user ${userId}, target: ${existingTarget.$id}`);
      return res.json({ success: true, targetId: existingTarget.$id, existed: true });
    }

    // Create new target
    const crypto = require("crypto");
    const targetId = `target_${Date.now()}_${crypto.randomUUID().replace(/-/g, "").substr(0, 9)}`;
    const createUrl = `${endpoint}/users/${userId}/targets`;
    const createRes = await fetch(createUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        targetId,
        providerType: "push",
        providerId,
        identifier: token,
        name: `${platform || "mobile"}_push_${Date.now()}`,
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      error(`Failed to create target: ${errText}`);
      return res.json({ success: false, error: "Failed to create push target" }, 500);
    }

    const target = await createRes.json();
    log(`Created push target ${target.$id} for user ${userId}`);

    return res.json({ success: true, targetId: target.$id, created: true });

  } catch (err) {
    error(`Error saving push token: ${err.message}`);
    return res.json({ success: false, error: "Internal server error" }, 500);
  }
};
