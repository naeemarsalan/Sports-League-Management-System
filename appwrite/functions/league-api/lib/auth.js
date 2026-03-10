const { listDocuments, getDocument } = require("./db");
const { hasPermission } = require("./permissions");

const MEMBERS_COLLECTION = "league_members";
const PROFILES_COLLECTION = "profiles";

const getCallerUserId = (req) => {
  const userId = req.headers["x-appwrite-user-id"];
  if (!userId) {
    const err = new Error("Authentication required");
    err.status = 401;
    throw err;
  }
  return userId;
};

const getCallerMembership = async (userId, leagueId) => {
  const result = await listDocuments(MEMBERS_COLLECTION, [
    `equal("userId", ["${userId}"])`,
    `equal("leagueId", ["${leagueId}"])`,
  ]);
  return result.documents[0] || null;
};

const requireRole = async (userId, leagueId, action) => {
  const membership = await getCallerMembership(userId, leagueId);
  if (!membership || membership.status !== "approved") {
    const err = new Error("Not a member of this league");
    err.status = 403;
    throw err;
  }
  if (!hasPermission(membership.role, action)) {
    const err = new Error(`Permission denied: requires ${action}`);
    err.status = 403;
    throw err;
  }
  return membership;
};

const requireApprovedMember = async (userId, leagueId) => {
  const membership = await getCallerMembership(userId, leagueId);
  if (!membership || membership.status !== "approved") {
    const err = new Error("Not an approved member of this league");
    err.status = 403;
    throw err;
  }
  return membership;
};

const getProfileByAuthId = async (userId) => {
  const result = await listDocuments(PROFILES_COLLECTION, [
    `equal("userId", ["${userId}"])`,
  ]);
  return result.documents[0] || null;
};

module.exports = {
  getCallerUserId,
  getCallerMembership,
  requireRole,
  requireApprovedMember,
  getProfileByAuthId,
};
