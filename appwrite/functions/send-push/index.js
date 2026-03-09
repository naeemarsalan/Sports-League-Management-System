const fetch = require("node-fetch");
const crypto = require("crypto");

/**
 * Sends push notifications to users via Appwrite Messaging (APNs).
 *
 * Expected body: { type, userId, data }
 *
 * Types:
 * - challenge_received: When someone challenges you to a match
 * - match_scheduled: When a match time is confirmed
 * - score_submitted: When match results are recorded
 */
module.exports = async ({ req, res, log, error }) => {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

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

  const { type, userId, data } = body;

  if (!type || !userId) {
    return res.json({ success: false, error: "type and userId are required" }, 400);
  }

  // Verify the caller is authenticated
  const authenticatedUserId = req.headers["x-appwrite-user-id"];
  if (!authenticatedUserId) {
    error("Unauthenticated request — no x-appwrite-user-id header");
    return res.json({ success: false, error: "Authentication required" }, 401);
  }

  // Sanitize user-provided strings to prevent injection
  const sanitize = (str, maxLength = 200) => {
    if (typeof str !== "string") return str;
    return str.replace(/<[^>]*>/g, "").trim().slice(0, maxLength);
  };

  const headers = {
    "X-Appwrite-Project": projectId,
    "X-Appwrite-Key": apiKey,
    "Content-Type": "application/json",
  };

  const databaseId = process.env.APPWRITE_DATABASE_ID || "pool-league";
  const profilesCollection = process.env.APPWRITE_PROFILES_COLLECTION_ID || "profiles";

  try {
    // userId from the caller is a profile document ID, not an Auth user ID.
    // Look up the profile to get the actual Auth user ID.
    const profileUrl = `${endpoint}/databases/${databaseId}/collections/${profilesCollection}/documents/${userId}`;
    const profileRes = await fetch(profileUrl, { headers });

    let authUserId = userId; // fallback to original value
    if (profileRes.ok) {
      const profile = await profileRes.json();
      if (profile.userId) {
        authUserId = profile.userId;
        log(`Resolved profile ${userId} to auth user ${authUserId}`);
      }
    } else {
      // Maybe it's already an auth user ID — try it directly
      log(`Profile lookup failed for ${userId}, trying as auth user ID`);
    }

    // Get user's push targets
    const targetsUrl = `${endpoint}/users/${authUserId}/targets`;
    const targetsRes = await fetch(targetsUrl, { headers });

    if (!targetsRes.ok) {
      const errText = await targetsRes.text();
      error(`Failed to fetch user targets: ${errText}`);
      return res.json({ success: false, error: "Failed to fetch user targets" }, 500);
    }

    const targetsData = await targetsRes.json();
    const pushTargets = (targetsData.targets || []).filter(
      (t) => t.providerType === "push"
    );

    if (pushTargets.length === 0) {
      log(`No push targets found for user ${userId}`);
      return res.json({ success: false, message: "No push targets for user" });
    }

    // Build notification content based on type
    let title, body, notificationData;

    switch (type) {
      case "challenge_received":
        title = "New Challenge!";
        body = data?.challengerName
          ? `${sanitize(data.challengerName)} has challenged you to a match`
          : "You have received a new match challenge";
        notificationData = {
          type: "challenge_received",
          matchId: data?.matchId,
        };
        break;

      case "match_scheduled":
        title = "Match Scheduled";
        body = data?.opponentName
          ? `Your match against ${sanitize(data.opponentName)} is scheduled${data.date ? ` for ${sanitize(data.date, 50)}` : ""}`
          : "A match has been scheduled";
        notificationData = {
          type: "match_scheduled",
          matchId: data?.matchId,
        };
        break;

      case "score_submitted":
        title = "Match Complete";
        body = data?.score
          ? `Match result: ${sanitize(data.score, 50)}`
          : "A match result has been submitted";
        notificationData = {
          type: "score_submitted",
          matchId: data?.matchId,
        };
        break;

      default:
        title = "Pool League";
        body = sanitize(data?.message) || "You have a new notification";
        notificationData = { type, ...data };
    }

    // Send via Appwrite Messaging API
    const targetIds = pushTargets.map((t) => t.$id);
    log(`Sending to targets: ${targetIds.join(", ")}`);

    const messageId = crypto.randomUUID();
    const messagingUrl = `${endpoint}/messaging/messages/push`;
    const messagingRes = await fetch(messagingUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messageId,
        title,
        body,
        data: notificationData,
        targets: targetIds,
        badge: 1,
        sound: "default",
      }),
    });

    if (!messagingRes.ok) {
      const errText = await messagingRes.text();
      error(`Appwrite Messaging failed: ${errText}`);
      return res.json({ success: false, error: "Failed to send push notification" }, 500);
    }

    const pushResult = await messagingRes.json();
    log(`Appwrite Messaging result: ${JSON.stringify(pushResult)}`);
    log(`Push notification sent to ${pushTargets.length} targets for user ${userId}`);

    return res.json({
      success: true,
      sentTo: pushTargets.length,
      result: pushResult,
    });

  } catch (err) {
    error(`Error sending push notification: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
