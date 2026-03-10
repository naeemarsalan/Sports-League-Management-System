const { init: initDb, getDocument, createDocument, updateDocument, deleteDocument, listDocuments } = require("./lib/db");
const { init: initNotify, sendNotification } = require("./lib/notify");
const { getCallerUserId, getCallerMembership, requireRole, requireApprovedMember, getProfileByAuthId } = require("./lib/auth");
const { ROLES, ACTIONS, hasPermission } = require("./lib/permissions");
const crypto = require("crypto");

const LEAGUES = "leagues";
const MEMBERS = "league_members";
const MATCHES = "matches";
const PROFILES = "profiles";

module.exports = async ({ req, res, log, error }) => {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID;

  if (!endpoint || !projectId || !apiKey || !databaseId) {
    error("Missing required environment variables");
    return res.json({ success: false, error: "Server configuration error" }, 500);
  }

  initDb(endpoint, projectId, apiKey, databaseId);
  initNotify(endpoint, projectId, apiKey);

  let body = {};
  try {
    body = JSON.parse(req.body || "{}");
  } catch (e) {
    body = req.body || {};
  }

  const { action, ...payload } = body;

  if (!action) {
    return res.json({ success: false, error: "action is required" }, 400);
  }

  try {
    const userId = getCallerUserId(req);
    let result;

    switch (action) {
      case "createMatch":
        result = await handleCreateMatch(userId, payload, log);
        break;
      case "updateMatch":
        result = await handleUpdateMatch(userId, payload, log);
        break;
      case "deleteMatch":
        result = await handleDeleteMatch(userId, payload, log);
        break;
      case "approveMember":
        result = await handleApproveMember(userId, payload, log);
        break;
      case "rejectMember":
        result = await handleRejectMember(userId, payload, log);
        break;
      case "updateMemberRole":
        result = await handleUpdateMemberRole(userId, payload, log);
        break;
      case "transferOwnership":
        result = await handleTransferOwnership(userId, payload, log);
        break;
      case "removeMember":
        result = await handleRemoveMember(userId, payload, log);
        break;
      case "requestToJoinLeague":
        result = await handleRequestToJoin(userId, payload, log);
        break;
      case "leaveLeague":
        result = await handleLeaveLeague(userId, payload, log);
        break;
      case "createLeague":
        result = await handleCreateLeague(userId, payload, log);
        break;
      case "updateLeague":
        result = await handleUpdateLeague(userId, payload, log);
        break;
      case "deleteLeague":
        result = await handleDeleteLeague(userId, payload, log);
        break;
      case "regenerateInviteCode":
        result = await handleRegenerateInviteCode(userId, payload, log);
        break;
      case "createProfile":
        result = await handleCreateProfile(userId, payload, log);
        break;
      case "updateProfile":
        result = await handleUpdateProfile(userId, payload, log);
        break;
      default:
        return res.json({ success: false, error: `Unknown action: ${action}` }, 400);
    }

    return res.json({ success: true, data: result });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) {
      error(`[${action}] ${err.message}`);
    } else {
      log(`[${action}] ${status}: ${err.message}`);
    }
    return res.json({ success: false, error: err.message }, status);
  }
};

// --- Action handlers ---

async function handleCreateMatch(userId, { leagueId, matchData, challengerName }, log) {
  if (!leagueId || !matchData) throw badRequest("leagueId and matchData are required");

  await requireRole(userId, leagueId, ACTIONS.CREATE_MATCH);

  // Validate both players are approved members.
  // Player IDs may be profile doc IDs (from mobile app) or auth user IDs.
  // Resolve to auth userId before checking membership.
  if (matchData.player1Id) {
    const userId1 = await resolveToUserId(matchData.player1Id);
    const p1 = await getCallerMembership(userId1, leagueId);
    if (!p1 || p1.status !== "approved") throw badRequest("Player 1 is not an approved member");
  }
  if (matchData.player2Id) {
    const userId2 = await resolveToUserId(matchData.player2Id);
    const p2 = await getCallerMembership(userId2, leagueId);
    if (!p2 || p2.status !== "approved") throw badRequest("Player 2 is not an approved member");
  }

  const match = await createDocument(MATCHES, { ...matchData, leagueId });
  log(`Match ${match.$id} created by ${userId}`);

  // Notify opponent
  if (matchData.player2Id) {
    sendNotification("challenge_received", matchData.player2Id, {
      matchId: match.$id,
      challengerName,
    }, leagueId);
  }

  return match;
}

async function handleUpdateMatch(userId, { matchId, matchData, leagueId, notifyOptions }, log) {
  if (!matchId || !matchData) throw badRequest("matchId and matchData are required");

  const match = await getDocument(MATCHES, matchId);
  const effectiveLeagueId = leagueId || match.leagueId;

  if (!effectiveLeagueId) throw badRequest("Could not determine leagueId");

  // Check: player can edit own match, mod+ can edit any
  const membership = await requireApprovedMember(userId, effectiveLeagueId);
  const isOwnMatch = match.player1Id === userId || match.player2Id === userId;

  // Also check by profile — userId in match fields might be profile doc IDs
  let isOwnByProfile = false;
  if (!isOwnMatch) {
    const profile = await getProfileByAuthId(userId);
    if (profile) {
      isOwnByProfile = match.player1Id === profile.$id || match.player2Id === profile.$id;
    }
  }

  if (isOwnMatch || isOwnByProfile) {
    if (!hasPermission(membership.role, ACTIONS.EDIT_OWN_MATCH)) {
      throw forbidden("Cannot edit matches");
    }
  } else {
    if (!hasPermission(membership.role, ACTIONS.EDIT_ANY_MATCH)) {
      throw forbidden("Cannot edit other players' matches");
    }
  }

  const updated = await updateDocument(MATCHES, matchId, matchData);
  log(`Match ${matchId} updated by ${userId}`);

  // Send notifications if requested
  if (notifyOptions?.playerIds?.length > 0 && notifyOptions.type) {
    for (const playerId of notifyOptions.playerIds) {
      sendNotification(notifyOptions.type, playerId, {
        matchId,
        ...notifyOptions.data,
      }, effectiveLeagueId);
    }
  }

  return updated;
}

async function handleDeleteMatch(userId, { matchId, leagueId }, log) {
  if (!matchId) throw badRequest("matchId is required");

  const match = await getDocument(MATCHES, matchId);
  const effectiveLeagueId = leagueId || match.leagueId;

  if (!effectiveLeagueId) throw badRequest("Could not determine leagueId");

  await requireRole(userId, effectiveLeagueId, ACTIONS.EDIT_ANY_MATCH);

  await deleteDocument(MATCHES, matchId);
  log(`Match ${matchId} deleted by ${userId}`);
  return { deleted: true };
}

async function handleApproveMember(userId, { membershipId, leagueName }, log) {
  if (!membershipId) throw badRequest("membershipId is required");

  const membership = await getDocument(MEMBERS, membershipId);
  await requireRole(userId, membership.leagueId, ACTIONS.APPROVE_MEMBERS);

  const updated = await updateDocument(MEMBERS, membershipId, {
    status: "approved",
    joinedAt: new Date().toISOString(),
  });

  // Increment member count
  await incrementMemberCount(membership.leagueId, 1);
  log(`Member ${membershipId} approved by ${userId}`);

  // Notify the approved user
  sendNotification("join_approved", membership.userId, { leagueName }, membership.leagueId);

  return updated;
}

async function handleRejectMember(userId, { membershipId, leagueName }, log) {
  if (!membershipId) throw badRequest("membershipId is required");

  const membership = await getDocument(MEMBERS, membershipId);
  await requireRole(userId, membership.leagueId, ACTIONS.APPROVE_MEMBERS);

  const updated = await updateDocument(MEMBERS, membershipId, {
    status: "rejected",
  });
  log(`Member ${membershipId} rejected by ${userId}`);

  sendNotification("join_rejected", membership.userId, { leagueName }, membership.leagueId);

  return updated;
}

async function handleUpdateMemberRole(userId, { membershipId, newRole, leagueId }, log) {
  if (!membershipId || !newRole) throw badRequest("membershipId and newRole are required");
  if (!ROLES[newRole]) throw badRequest("Invalid role");
  if (newRole === "owner") throw forbidden("Cannot promote to owner — use transferOwnership");

  const membership = await getDocument(MEMBERS, membershipId);
  const effectiveLeagueId = leagueId || membership.leagueId;

  // Determine required permission based on target role
  if (newRole === "admin") {
    await requireRole(userId, effectiveLeagueId, ACTIONS.PROMOTE_TO_ADMIN);
  } else if (newRole === "mod") {
    await requireRole(userId, effectiveLeagueId, ACTIONS.PROMOTE_TO_MOD);
  } else {
    // Demoting to player requires at least admin
    await requireRole(userId, effectiveLeagueId, ACTIONS.PROMOTE_TO_MOD);
  }

  // Cannot modify the owner's role
  if (membership.role === "owner") throw forbidden("Cannot change owner's role");

  const updated = await updateDocument(MEMBERS, membershipId, { role: newRole });
  log(`Member ${membershipId} role changed to ${newRole} by ${userId}`);
  return updated;
}

async function handleTransferOwnership(userId, { currentOwnerMembershipId, newOwnerMembershipId, leagueId }, log) {
  if (!currentOwnerMembershipId || !newOwnerMembershipId) {
    throw badRequest("currentOwnerMembershipId and newOwnerMembershipId are required");
  }

  const currentOwner = await getDocument(MEMBERS, currentOwnerMembershipId);
  const newOwner = await getDocument(MEMBERS, newOwnerMembershipId);

  // Verify caller is the current owner
  if (currentOwner.userId !== userId) throw forbidden("Only the owner can transfer ownership");
  if (currentOwner.role !== "owner") throw forbidden("Current membership is not owner");
  if (currentOwner.leagueId !== newOwner.leagueId) throw badRequest("Members must be in the same league");

  await updateDocument(MEMBERS, currentOwnerMembershipId, { role: "admin" });
  try {
    await updateDocument(MEMBERS, newOwnerMembershipId, { role: "owner" });
  } catch (err) {
    // Rollback: restore the original owner's role
    await updateDocument(MEMBERS, currentOwnerMembershipId, { role: "owner" });
    throw err;
  }
  log(`Ownership transferred from ${currentOwnerMembershipId} to ${newOwnerMembershipId} by ${userId}`);

  return { transferred: true };
}

async function handleRemoveMember(userId, { membershipId, leagueId }, log) {
  if (!membershipId) throw badRequest("membershipId is required");

  const membership = await getDocument(MEMBERS, membershipId);
  const effectiveLeagueId = leagueId || membership.leagueId;

  await requireRole(userId, effectiveLeagueId, ACTIONS.APPROVE_MEMBERS);

  if (membership.role === "owner") throw forbidden("Cannot remove the owner");

  await deleteDocument(MEMBERS, membershipId);

  if (membership.status === "approved") {
    await incrementMemberCount(effectiveLeagueId, -1);
  }
  log(`Member ${membershipId} removed by ${userId}`);
  return { removed: true };
}

async function handleRequestToJoin(userId, { leagueId, requesterName }, log) {
  if (!leagueId) throw badRequest("leagueId is required");

  // Check not already a member
  const existing = await getCallerMembership(userId, leagueId);
  if (existing) {
    if (existing.status === "approved") throw badRequest("Already a member of this league");
    if (existing.status === "rejected") {
      // Allow re-requesting by deleting the old rejected record
      await deleteDocument(MEMBERS, existing.$id);
      log(`Deleted rejected membership ${existing.$id} so user ${userId} can re-request`);
    } else {
      throw badRequest("Join request already pending");
    }
  }

  const doc = await createDocument(MEMBERS, {
    leagueId,
    userId,
    role: "player",
    status: "pending",
    requestedAt: new Date().toISOString(),
  });
  log(`Join request from ${userId} for league ${leagueId}`);

  // Notify admins/owners
  try {
    const members = await listDocuments(MEMBERS, [
      `equal("leagueId", ["${leagueId}"])`,
      `equal("status", ["approved"])`,
    ]);
    const admins = (members.documents || []).filter(
      (m) => m.role === "admin" || m.role === "owner"
    );
    for (const admin of admins) {
      sendNotification("join_request", admin.userId, { requesterName }, leagueId);
    }
  } catch (err) {
    log(`Failed to notify admins: ${err.message}`);
  }

  return doc;
}

async function handleLeaveLeague(userId, { membershipId }, log) {
  if (!membershipId) throw badRequest("membershipId is required");

  const membership = await getDocument(MEMBERS, membershipId);

  // Verify the caller owns this membership
  if (membership.userId !== userId) throw forbidden("Can only leave your own membership");
  if (membership.role === "owner") {
    throw badRequest("Owner cannot leave the league. Transfer ownership or delete the league.");
  }

  await deleteDocument(MEMBERS, membershipId);

  if (membership.status === "approved") {
    await incrementMemberCount(membership.leagueId, -1);
  }
  log(`User ${userId} left league via membership ${membershipId}`);
  return { left: true };
}

async function handleCreateLeague(userId, { leagueData }, log) {
  if (!leagueData || !leagueData.name) throw badRequest("leagueData with name is required");

  const inviteCode = generateInviteCode();
  const league = await createDocument(LEAGUES, {
    name: leagueData.name,
    description: leagueData.description || "",
    inviteCode,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    isActive: true,
    memberCount: 1,
    pointsPerWin: leagueData.pointsPerWin ?? 3,
    pointsPerDraw: leagueData.pointsPerDraw ?? 1,
    pointsPerLoss: leagueData.pointsPerLoss ?? 0,
    includeFramePoints: leagueData.includeFramePoints ?? false,
    sportType: leagueData.sportType ?? "pool",
  });

  // Create owner membership atomically
  await createDocument(MEMBERS, {
    leagueId: league.$id,
    userId,
    role: "owner",
    status: "approved",
    joinedAt: new Date().toISOString(),
    requestedAt: new Date().toISOString(),
  });

  log(`League ${league.$id} created by ${userId}`);
  return league;
}

async function handleUpdateLeague(userId, { leagueId, leagueData }, log) {
  if (!leagueId || !leagueData) throw badRequest("leagueId and leagueData are required");

  await requireRole(userId, leagueId, ACTIONS.EDIT_LEAGUE_SETTINGS);

  // Only allow updating safe fields
  const allowed = [
    "name", "description", "pointsPerWin", "pointsPerDraw",
    "pointsPerLoss", "includeFramePoints", "sportType", "notificationLimit",
  ];
  const sanitized = {};
  for (const key of allowed) {
    if (leagueData[key] !== undefined) sanitized[key] = leagueData[key];
  }

  const updated = await updateDocument(LEAGUES, leagueId, sanitized);
  log(`League ${leagueId} updated by ${userId}`);
  return updated;
}

async function handleDeleteLeague(userId, { leagueId }, log) {
  if (!leagueId) throw badRequest("leagueId is required");

  await requireRole(userId, leagueId, ACTIONS.DELETE_LEAGUE);

  const updated = await updateDocument(LEAGUES, leagueId, { isActive: false });
  log(`League ${leagueId} soft-deleted by ${userId}`);
  return updated;
}

async function handleRegenerateInviteCode(userId, { leagueId }, log) {
  if (!leagueId) throw badRequest("leagueId is required");

  await requireRole(userId, leagueId, ACTIONS.EDIT_LEAGUE_SETTINGS);

  const newCode = generateInviteCode();
  const updated = await updateDocument(LEAGUES, leagueId, { inviteCode: newCode });
  log(`Invite code regenerated for league ${leagueId} by ${userId}`);
  return updated;
}

async function handleCreateProfile(userId, { profileData }, log) {
  if (!profileData || !profileData.displayName) throw badRequest("profileData with displayName is required");

  const profile = await createDocument(PROFILES, {
    userId,
    displayName: profileData.displayName,
    role: profileData.role || "player",
  });
  log(`Profile ${profile.$id} created for user ${userId}`);
  return profile;
}

async function handleUpdateProfile(userId, { profileId, profileData }, log) {
  if (!profileId || !profileData) throw badRequest("profileId and profileData are required");

  const profile = await getDocument(PROFILES, profileId);
  if (profile.userId !== userId) throw forbidden("Can only update your own profile");

  // Only allow safe fields
  const allowed = ["displayName", "avatarUrl", "bio"];
  const sanitized = {};
  for (const key of allowed) {
    if (profileData[key] !== undefined) sanitized[key] = profileData[key];
  }

  const updated = await updateDocument(PROFILES, profileId, sanitized);
  log(`Profile ${profileId} updated by ${userId}`);
  return updated;
}

// --- Helpers ---

/**
 * Resolve a player ID to an auth userId.
 * The mobile app sends profile document $id as player IDs, but league_members
 * stores the auth userId. This looks up the profile doc and returns its userId.
 * If the ID is already an auth userId (no matching profile doc), returns it as-is.
 */
async function resolveToUserId(playerId) {
  try {
    const profile = await getDocument(PROFILES, playerId);
    return profile.userId || playerId;
  } catch (e) {
    // Not a profile doc ID — assume it's already an auth userId
    return playerId;
  }
}

async function incrementMemberCount(leagueId, delta) {
  try {
    const league = await getDocument(LEAGUES, leagueId);
    const newCount = Math.max(0, (league.memberCount || 0) + delta);
    await updateDocument(LEAGUES, leagueId, { memberCount: newCount });
  } catch (err) {
    console.warn(`Failed to update member count: ${err.message}`);
  }
}

function generateInviteCode() {
  const crypto = require("crypto");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(bytes[i] % chars.length);
  }
  return code;
}

function badRequest(msg) {
  const err = new Error(msg);
  err.status = 400;
  return err;
}

function forbidden(msg) {
  const err = new Error(msg);
  err.status = 403;
  return err;
}
