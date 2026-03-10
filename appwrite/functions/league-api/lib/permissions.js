// Mirror of mobile/src/lib/members.js RBAC matrix
// Keep in sync with client-side definitions

const ROLES = {
  player: 1,
  mod: 2,
  admin: 3,
  owner: 4,
};

const ACTIONS = {
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

const hasPermission = (role, action) => {
  const allowedRoles = PERMISSIONS[action];
  return allowedRoles?.includes(role) ?? false;
};

module.exports = { ROLES, ACTIONS, PERMISSIONS, hasPermission };
