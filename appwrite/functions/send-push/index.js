const fetch = require("node-fetch");

/**
 * Sends push notifications to users via Expo Push Notification service.
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

  const headers = {
    "X-Appwrite-Project": projectId,
    "X-Appwrite-Key": apiKey,
    "Content-Type": "application/json",
  };

  try {
    // Get user's push targets
    const targetsUrl = `${endpoint}/users/${userId}/targets`;
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
          ? `${data.challengerName} has challenged you to a match`
          : "You have received a new match challenge";
        notificationData = {
          type: "challenge_received",
          matchId: data?.matchId,
        };
        break;

      case "match_scheduled":
        title = "Match Scheduled";
        body = data?.opponentName
          ? `Your match against ${data.opponentName} is scheduled${data.date ? ` for ${data.date}` : ""}`
          : "A match has been scheduled";
        notificationData = {
          type: "match_scheduled",
          matchId: data?.matchId,
        };
        break;

      case "score_submitted":
        title = "Match Complete";
        body = data?.score
          ? `Match result: ${data.score}`
          : "A match result has been submitted";
        notificationData = {
          type: "score_submitted",
          matchId: data?.matchId,
        };
        break;

      default:
        title = "Pool League";
        body = data?.message || "You have a new notification";
        notificationData = { type, ...data };
    }

    // Send to Expo Push Notification service
    const expoPushUrl = "https://exp.host/--/api/v2/push/send";
    const messages = pushTargets.map((target) => ({
      to: target.identifier,
      title,
      body,
      data: notificationData,
      sound: "default",
      badge: 1,
      channelId: "matches",
    }));

    const expoPushRes = await fetch(expoPushUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!expoPushRes.ok) {
      const errText = await expoPushRes.text();
      error(`Expo push failed: ${errText}`);
      return res.json({ success: false, error: "Failed to send push notification" }, 500);
    }

    const pushResult = await expoPushRes.json();
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
