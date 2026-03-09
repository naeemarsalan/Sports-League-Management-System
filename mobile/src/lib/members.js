import { databases, ID, Query, appwriteConfig } from "./appwrite";
import { updateMemberCount } from "./leagues";
import { listProfiles } from "./profiles";
import { sendPushNotification } from "./notifications";

// Role hierarchy (higher number = more permissions)
export const ROLES = {
  player: 1,
  mod: 2,
  admin: 3,
  owner: 4,
};

// Permission actions
export const ACTIONS = {
  VIEW_LEAGUE: "view_league",
  EDIT_OWN_MATCH: "edit_own_match",
  CREATE_MATCH: "create_match",
  EDIT_ANY_MATCH: "edit_any_match",
  APPROVE_MEMBERS: "approve_members",
  PROMOTE_TO_MOD: "promote_to_mod",
  PROMOTE_TO_ADMIN: "promote_to_admin",
  EDIT_LEAGUE_SETTINGS: "edit_league_settings",
  DELETE_LEAGUE: "delete_league",
};

// Role-action permissions matrix
const PERMISSIONS = {
  [ACTIONS.VIEW_LEAGUE]: ["player", "mod", "admin", "owner"],
  [ACTIONS.EDIT_OWN_MATCH]: ["player", "mod", "admin", "owner"],
  [ACTIONS.CREATE_MATCH]: ["mod", "admin", "owner"],
  [ACTIONS.EDIT_ANY_MATCH]: ["mod", "admin", "owner"],
  [ACTIONS.APPROVE_MEMBERS]: ["admin", "owner"],
  [ACTIONS.PROMOTE_TO_MOD]: ["admin", "owner"],
  [ACTIONS.PROMOTE_TO_ADMIN]: ["owner"],
  [ACTIONS.EDIT_LEAGUE_SETTINGS]: ["admin", "owner"],
  [ACTIONS.DELETE_LEAGUE]: ["owner"],
};

/**
 * Check if a role has permission for an action
 */
export const hasPermission = (role, action) => {
  const allowedRoles = PERMISSIONS[action];
  return allowedRoles?.includes(role) ?? false;
};

/**
 * Check if user can perform action in a league
 */
export const checkPermission = async (userId, leagueId, action) => {
  const membership = await getMembership(leagueId, userId);
  if (!membership || membership.status !== "approved") {
    return false;
  }
  return hasPermission(membership.role, action);
};

/**
 * Get user's membership in a league
 */
export const getMembership = async (leagueId, userId) => {
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.leagueMembersCollectionId,
    [Query.equal("leagueId", leagueId), Query.equal("userId", userId)]
  );
  return response.documents[0] ?? null;
};

/**
 * Get all of a user's league memberships
 */
export const getUserLeagues = async (userId) => {
  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.leagueMembersCollectionId,
    [Query.equal("userId", userId), Query.equal("status", "approved")]
  );
  return response.documents;
};

/**
 * Get all members of a league
 */
export const getLeagueMembers = async (leagueId, status = null) => {
  const queries = [Query.equal("leagueId", leagueId)];
  if (status) {
    queries.push(Query.equal("status", status));
  }
  queries.push(Query.limit(500));

  const response = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.leagueMembersCollectionId,
    queries
  );
  return response.documents;
};

/**
 * Get profiles of all approved members in a league
 * Returns profiles with their membership info attached
 */
export const getLeagueMemberProfiles = async (leagueId) => {
  // Get approved league members
  const members = await getLeagueMembers(leagueId, "approved");

  if (members.length === 0) {
    return [];
  }

  // Get all profiles
  const profiles = await listProfiles();

  // Create a map of userId -> membership for quick lookup
  const membershipMap = new Map(members.map((m) => [m.userId, m]));

  // Filter profiles to only include league members and attach membership info
  return profiles
    .filter((profile) => membershipMap.has(profile.userId))
    .map((profile) => ({
      ...profile,
      membership: membershipMap.get(profile.userId),
    }));
};

/**
 * Get pending join requests for a league
 */
export const getPendingRequests = async (leagueId) => {
  return getLeagueMembers(leagueId, "pending");
};

/**
 * Request to join a league
 */
export const requestToJoinLeague = async (leagueId, userId, requesterName = null) => {
  // Check if already a member
  const existing = await getMembership(leagueId, userId);
  if (existing) {
    throw new Error(
      existing.status === "approved"
        ? "Already a member of this league"
        : "Join request already pending"
    );
  }

  const doc = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leagueMembersCollectionId,
    ID.unique(),
    {
      leagueId,
      userId,
      role: "player",
      status: "pending",
      requestedAt: new Date().toISOString(),
    }
  );

  // Notify admins/owners about the join request (fire-and-forget)
  try {
    const members = await getLeagueMembers(leagueId, "approved");
    const admins = members.filter((m) => m.role === "admin" || m.role === "owner");
    for (const admin of admins) {
      sendPushNotification("join_request", admin.userId, { requesterName }, leagueId);
    }
  } catch (err) {
    console.warn("Failed to notify admins of join request:", err.message);
  }

  return doc;
};

/**
 * Approve a member's join request
 */
export const approveMember = async (membershipId, leagueName = null) => {
  const membership = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leagueMembersCollectionId,
    membershipId
  );

  const updated = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leagueMembersCollectionId,
    membershipId,
    {
      status: "approved",
      joinedAt: new Date().toISOString(),
    }
  );

  // Update league member count
  await updateMemberCount(membership.leagueId, 1);

  // Notify the approved user (fire-and-forget)
  sendPushNotification("join_approved", membership.userId, { leagueName }, membership.leagueId);

  return updated;
};

/**
 * Reject a member's join request
 */
export const rejectMember = async (membershipId, leagueName = null) => {
  const membership = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leagueMembersCollectionId,
    membershipId
  );

  const updated = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leagueMembersCollectionId,
    membershipId,
    {
      status: "rejected",
    }
  );

  // Notify the rejected user (fire-and-forget)
  sendPushNotification("join_rejected", membership.userId, { leagueName }, membership.leagueId);

  return updated;
};

/**
 * Update a member's role
 */
export const updateMemberRole = async (membershipId, newRole) => {
  // Validate role
  if (!ROLES[newRole]) {
    throw new Error("Invalid role");
  }

  return databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leagueMembersCollectionId,
    membershipId,
    {
      role: newRole,
    }
  );
};

/**
 * Leave a league (remove membership)
 */
export const leaveLeague = async (membershipId) => {
  const membership = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leagueMembersCollectionId,
    membershipId
  );

  // Owner cannot leave their own league
  if (membership.role === "owner") {
    throw new Error("Owner cannot leave the league. Transfer ownership or delete the league.");
  }

  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leagueMembersCollectionId,
    membershipId
  );

  // Update league member count
  if (membership.status === "approved") {
    await updateMemberCount(membership.leagueId, -1);
  }

  return true;
};

/**
 * Remove a member from a league (admin action)
 */
export const removeMember = async (membershipId) => {
  const membership = await databases.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leagueMembersCollectionId,
    membershipId
  );

  // Cannot remove owner
  if (membership.role === "owner") {
    throw new Error("Cannot remove the owner");
  }

  await databases.deleteDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leagueMembersCollectionId,
    membershipId
  );

  // Update league member count
  if (membership.status === "approved") {
    await updateMemberCount(membership.leagueId, -1);
  }

  return true;
};

/**
 * Transfer ownership of a league
 */
export const transferOwnership = async (currentOwnerMembershipId, newOwnerMembershipId) => {
  // Demote current owner to admin
  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leagueMembersCollectionId,
    currentOwnerMembershipId,
    { role: "admin" }
  );

  // Promote new owner
  await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.leagueMembersCollectionId,
    newOwnerMembershipId,
    { role: "owner" }
  );

  return true;
};
