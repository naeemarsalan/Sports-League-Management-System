import { create } from "zustand";
import { getLeague, listLeagues } from "../lib/leagues";
import { getUserLeagues, getMembership, hasPermission, ACTIONS } from "../lib/members";

export const useLeagueStore = create((set, get) => ({
  // Current selected league
  currentLeagueId: null,
  currentLeague: null,
  currentMembership: null,

  // User's leagues (where they are approved members)
  userLeagues: [],
  userMemberships: [],

  // All leagues for browsing
  allLeagues: [],

  loading: false,
  error: null,

  /**
   * Fetch all leagues the user is a member of
   */
  fetchUserLeagues: async (userId) => {
    set({ loading: true, error: null });
    try {
      const memberships = await getUserLeagues(userId);
      const userMemberships = memberships;

      // Fetch full league details for each membership
      const leaguePromises = memberships.map((m) => getLeague(m.leagueId));
      const userLeagues = await Promise.all(leaguePromises);

      set({
        userLeagues,
        userMemberships,
        loading: false,
      });

      // Auto-select first league if none selected
      const state = get();
      if (!state.currentLeagueId && userLeagues.length > 0) {
        await get().setCurrentLeague(userLeagues[0].$id);
      }

      return userLeagues;
    } catch (error) {
      console.error("Error fetching user leagues:", error);
      set({ error: error.message, loading: false });
      return [];
    }
  },

  /**
   * Fetch all leagues for browsing
   */
  fetchAllLeagues: async () => {
    try {
      const allLeagues = await listLeagues();
      set({ allLeagues });
      return allLeagues;
    } catch (error) {
      console.error("Error fetching all leagues:", error);
      return [];
    }
  },

  /**
   * Set the currently active league
   */
  setCurrentLeague: async (leagueId) => {
    if (!leagueId) {
      set({
        currentLeagueId: null,
        currentLeague: null,
        currentMembership: null,
      });
      return;
    }

    try {
      const currentLeague = await getLeague(leagueId);

      // Find membership from cached data
      const state = get();
      const currentMembership = state.userMemberships.find(
        (m) => m.leagueId === leagueId
      );

      set({
        currentLeagueId: leagueId,
        currentLeague,
        currentMembership,
      });
    } catch (error) {
      console.error("Error setting current league:", error);
    }
  },

  /**
   * Switch to a different league
   */
  switchLeague: async (leagueId) => {
    await get().setCurrentLeague(leagueId);
  },

  /**
   * Check if current user has permission for an action in current league
   */
  canPerform: (action) => {
    const { currentMembership } = get();
    if (!currentMembership) return false;
    return hasPermission(currentMembership.role, action);
  },

  /**
   * Get current user's role in current league
   */
  getCurrentRole: () => {
    const { currentMembership } = get();
    return currentMembership?.role ?? null;
  },

  /**
   * Check if user is admin or higher in current league
   */
  isAdminOrHigher: () => {
    const role = get().getCurrentRole();
    return role === "admin" || role === "owner";
  },

  /**
   * Check if user is owner of current league
   */
  isOwner: () => {
    return get().getCurrentRole() === "owner";
  },

  /**
   * Refresh current league data
   */
  refreshCurrentLeague: async () => {
    const { currentLeagueId } = get();
    if (currentLeagueId) {
      await get().setCurrentLeague(currentLeagueId);
    }
  },

  /**
   * Add a league to user's list (after joining)
   */
  addUserLeague: async (leagueId, userId) => {
    const league = await getLeague(leagueId);
    const membership = await getMembership(leagueId, userId);

    set((state) => ({
      userLeagues: [...state.userLeagues, league],
      userMemberships: [...state.userMemberships, membership],
    }));

    // Auto-select if this is the first league
    const state = get();
    if (!state.currentLeagueId) {
      await get().setCurrentLeague(leagueId);
    }
  },

  /**
   * Remove a league from user's list (after leaving)
   */
  removeUserLeague: (leagueId) => {
    set((state) => {
      const userLeagues = state.userLeagues.filter((l) => l.$id !== leagueId);
      const userMemberships = state.userMemberships.filter(
        (m) => m.leagueId !== leagueId
      );

      // If we removed the current league, switch to another
      let currentLeagueId = state.currentLeagueId;
      let currentLeague = state.currentLeague;
      let currentMembership = state.currentMembership;

      if (state.currentLeagueId === leagueId) {
        if (userLeagues.length > 0) {
          currentLeagueId = userLeagues[0].$id;
          currentLeague = userLeagues[0];
          currentMembership = userMemberships.find(
            (m) => m.leagueId === currentLeagueId
          );
        } else {
          currentLeagueId = null;
          currentLeague = null;
          currentMembership = null;
        }
      }

      return {
        userLeagues,
        userMemberships,
        currentLeagueId,
        currentLeague,
        currentMembership,
      };
    });
  },

  /**
   * Clear all league state (on logout)
   */
  reset: () => {
    set({
      currentLeagueId: null,
      currentLeague: null,
      currentMembership: null,
      userLeagues: [],
      userMemberships: [],
      allLeagues: [],
      loading: false,
      error: null,
    });
  },
}));

// Export ACTIONS for convenience
export { ACTIONS };
