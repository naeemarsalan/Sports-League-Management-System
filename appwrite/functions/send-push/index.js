const fetch = require("node-fetch");
const crypto = require("crypto");

/**
 * Sends push notifications to users via Appwrite Messaging (APNs).
 *
 * Expected body: { type, userId, data, leagueId? }
 *
 * Types:
 * - challenge_received: When someone challenges you to a match
 * - match_scheduled: When a match time is confirmed
 * - score_submitted: When match results are recorded
 * - join_request / join_approved / join_rejected: Membership events
 * - position_overtaken: Leaderboard position change
 * - admin_broadcast: Admin announcement
 *
 * Rate limiting:
 * - When leagueId is provided, enforces a daily notification cap per league.
 * - Default: 50 notifications/league/day (override with NOTIFICATION_DAILY_LIMIT env var).
 * - Returns { rateLimited: true } when the cap is exceeded.
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

  const { type, userId, data, leagueId, _internalKey } = body;

  if (!type || !userId) {
    return res.json({ success: false, error: "type and userId are required" }, 400);
  }

  // Verify the caller is authenticated (user session, API key header, or internal key from server functions)
  const authenticatedUserId = req.headers["x-appwrite-user-id"];
  const isApiKeyCall = !!req.headers["x-appwrite-key"];
  const isInternalCall = _internalKey && _internalKey === apiKey;
  if (!authenticatedUserId && !isApiKeyCall && !isInternalCall) {
    error("Unauthenticated request — no x-appwrite-user-id, x-appwrite-key header, or internal key");
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
  const notificationLogsCollection = "notification_logs";
  const dailyLimit = parseInt(process.env.NOTIFICATION_DAILY_LIMIT, 10) || 50;

  try {
    // Fetch per-league notification limit if available
    let effectiveLimit = dailyLimit;
    if (leagueId) {
      try {
        const leagueUrl = `${endpoint}/databases/${databaseId}/collections/leagues/documents/${leagueId}`;
        const leagueRes = await fetch(leagueUrl, { headers });
        if (leagueRes.ok) {
          const league = await leagueRes.json();
          if (league.notificationLimit != null) {
            effectiveLimit = league.notificationLimit;
          }
        }
      } catch (e) {
        log(`Could not fetch league limit, using default: ${dailyLimit}`);
      }
    }

    // --- Rate limiting per league ---
    if (leagueId) {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const logsQuery = encodeURIComponent(JSON.stringify([
        { method: "equal", attribute: "leagueId", values: [leagueId] },
        { method: "equal", attribute: "date", values: [today] },
      ]));
      const logsUrl = `${endpoint}/databases/${databaseId}/collections/${notificationLogsCollection}/documents?queries=${logsQuery}`;
      const logsRes = await fetch(logsUrl, { headers });

      let currentCount = 0;
      let logDocId = null;

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.documents && logsData.documents.length > 0) {
          const logDoc = logsData.documents[0];
          currentCount = logDoc.count || 0;
          logDocId = logDoc.$id;
        }
      }

      if (currentCount >= effectiveLimit) {
        log(`Rate limited: league ${leagueId} has sent ${currentCount}/${effectiveLimit} notifications today`);
        return res.json({
          success: false,
          rateLimited: true,
          error: "Daily notification limit reached for this league",
          count: currentCount,
          limit: effectiveLimit,
        });
      }

      // Counter will be incremented after successful send (see below)
    }
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

    // Recipient authorization: user-session callers can only send to themselves.
    // Checked after profile lookup so we compare Auth IDs (not profile doc ID vs Auth ID).
    // API-key / internal calls (function-to-function) skip this check.
    if (authenticatedUserId && !isApiKeyCall && !isInternalCall && authenticatedUserId !== authUserId) {
      error(`User ${authenticatedUserId} attempted to send notification to ${userId}`);
      return res.json({ success: false, error: "Not authorized to send to this user" }, 403);
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

      case "match_scheduled": {
        title = "Match Scheduled";
        const schedDate = data?.formattedDate || data?.date ||
          (data?.scheduledAt ? new Date(data.scheduledAt).toLocaleDateString("en-GB", { month: "long", day: "numeric" }) : null);
        body = data?.opponentName
          ? `Your match against ${sanitize(data.opponentName)} is scheduled${schedDate ? ` for ${sanitize(schedDate, 50)}` : ""}`
          : schedDate
            ? `A match has been scheduled for ${sanitize(schedDate, 50)}`
            : "A match has been scheduled";
        notificationData = {
          type: "match_scheduled",
          matchId: data?.matchId,
        };
        break;
      }

      case "score_submitted": {
        title = "Match Complete";
        let scoreBody = null;
        if (data?.player1Name && data?.scorePlayer1 != null && data?.scorePlayer2 != null) {
          scoreBody = `${sanitize(data.player1Name)} ${data.scorePlayer1} - ${data.scorePlayer2} ${sanitize(data.player2Name || "Opponent")}`;
        } else if (data?.score) {
          scoreBody = sanitize(data.score, 50);
        }
        body = scoreBody
          ? `Match result: ${scoreBody}`
          : "A match result has been submitted";
        notificationData = {
          type: "score_submitted",
          matchId: data?.matchId,
        };
        break;
      }

      case "join_request":
        title = "New Join Request";
        body = data?.requesterName
          ? `${sanitize(data.requesterName)} wants to join your league`
          : "Someone wants to join your league";
        notificationData = {
          type: "join_request",
          membershipId: data?.membershipId,
          leagueId: data?.leagueId,
          requesterName: data?.requesterName,
        };
        break;

      case "join_approved":
        title = "Request Approved";
        body = data?.leagueName
          ? `You've been accepted into ${sanitize(data.leagueName)}`
          : "Your league join request was approved";
        notificationData = { type: "join_approved" };
        break;

      case "join_rejected":
        title = "Request Declined";
        body = data?.leagueName
          ? `Your request to join ${sanitize(data.leagueName)} was declined`
          : "Your league join request was declined";
        notificationData = { type: "join_rejected" };
        break;

      case "position_overtaken":
        title = "Leaderboard Update";
        body = data?.overtakerName
          ? `${sanitize(data.overtakerName)} has overtaken you! You dropped from #${data.oldPosition} to #${data.newPosition}`
          : "Your leaderboard position has changed";
        notificationData = {
          type: "position_overtaken",
          oldPosition: data?.oldPosition,
          newPosition: data?.newPosition,
        };
        break;

      case "admin_broadcast":
        title = sanitize(data?.title, 100) || "League Announcement";
        body = sanitize(data?.message) || "You have a new announcement";
        notificationData = {
          type: "admin_broadcast",
          leagueName: data?.leagueName,
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

    // Increment rate limit counter after successful send
    if (leagueId) {
      const today = new Date().toISOString().slice(0, 10);
      const logsQuery = encodeURIComponent(JSON.stringify([
        { method: "equal", attribute: "leagueId", values: [leagueId] },
        { method: "equal", attribute: "date", values: [today] },
      ]));
      const logsUrl = `${endpoint}/databases/${databaseId}/collections/${notificationLogsCollection}/documents?queries=${logsQuery}`;
      const logsRes = await fetch(logsUrl, { headers });

      let currentCount = 0;
      let logDocId = null;

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.documents && logsData.documents.length > 0) {
          currentCount = logsData.documents[0].count || 0;
          logDocId = logsData.documents[0].$id;
        }
      }

      if (logDocId) {
        await fetch(
          `${endpoint}/databases/${databaseId}/collections/${notificationLogsCollection}/documents/${logDocId}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ data: { count: currentCount + 1 } }),
          }
        );
      } else {
        const newDocId = crypto.randomUUID();
        await fetch(
          `${endpoint}/databases/${databaseId}/collections/${notificationLogsCollection}/documents`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              documentId: newDocId,
              data: { leagueId, date: today, count: 1 },
              permissions: [
                `read("users")`,
                `update("users")`,
              ],
            }),
          }
        );
      }
      log(`Rate limit: league ${leagueId} at ${currentCount + 1}/${effectiveLimit} today`);
    }

    return res.json({
      success: true,
      sentTo: pushTargets.length,
      result: pushResult,
    });

  } catch (err) {
    error(`Error sending push notification: ${err.message}`);
    return res.json({ success: false, error: "Internal server error" }, 500);
  }
};
