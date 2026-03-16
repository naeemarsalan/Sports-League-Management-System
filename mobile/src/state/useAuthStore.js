import { create } from "zustand";
import { account, functions, ID } from "../lib/appwrite";
import { createProfile, getProfileByUserId } from "../lib/profiles";

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  error: null,
  // Computed: user is logged in but has no profile
  get needsProfileSetup() {
    const state = get();
    return state.user !== null && state.profile === null && !state.loading;
  },
  bootstrap: async () => {
    set({ loading: true, error: null });
    try {
      const user = await account.get();
      const profile = await getProfileByUserId(user.$id);
      set({ user, profile, loading: false });
    } catch (error) {
      // Error code 401 means user is not authenticated (guest) - this is expected
      if (error.code !== 401) {
        console.error('Bootstrap error:', error);
      }
      set({ user: null, profile: null, loading: false });
    }
  },
  login: async ({ email, password }) => {
    set({ loading: true, error: null });
    
    // Input validation
    if (!email || !password) {
      const errorMessage = 'Email and password are required';
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
    
    if (!email.includes('@')) {
      const errorMessage = 'Please enter a valid email address';
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
    
    try {
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      const profile = await getProfileByUserId(user.$id);
      set({ user, profile, loading: false });
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Authentication failed';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  register: async ({ email, password, displayName }) => {
    set({ loading: true, error: null });
    
    // Input validation
    if (!email || !password || !displayName) {
      const errorMessage = 'All fields are required';
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
    
    if (!email.includes('@')) {
      const errorMessage = 'Please enter a valid email address';
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
    
    if (password.length < 6) {
      const errorMessage = 'Password must be at least 6 characters long';
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
    
    if (displayName.length < 2) {
      const errorMessage = 'Display name must be at least 2 characters long';
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
    
    try {
      await account.create(ID.unique(), email, password, displayName);
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      const profile = await createProfile({
        userId: user.$id,
        displayName,
        role: "player",
      });
      set({ user, profile, loading: false });
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Registration failed';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  logout: async () => {
    set({ loading: true, error: null });
    try {
      await account.deleteSession("current");
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({ user: null, profile: null, loading: false });
    }
  },
  resetPassword: async (email) => {
    try {
      await account.createRecovery(email, "https://www.snookerpoolleague.co.uk/support");
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  },
  deleteAccount: async () => {
    set({ loading: true, error: null });
    try {
      const execution = await functions.createExecution(
        "delete-account",
        "",
        false
      );
      const response = JSON.parse(execution.responseBody || "{}");
      if (!response.success) {
        throw new Error(response.error || "Account deletion failed");
      }
    } catch (error) {
      console.error("Delete account error:", error);
      set({ loading: false });
      throw error;
    }
    set({ user: null, profile: null, loading: false });
  },
}));
