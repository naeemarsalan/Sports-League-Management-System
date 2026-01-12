import { create } from "zustand";
import { account, ID } from "../lib/appwrite";
import { createProfile, getProfileByUserId } from "../lib/profiles";

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  error: null,
  bootstrap: async () => {
    set({ loading: true, error: null });
    try {
      const user = await account.get();
      const profile = await getProfileByUserId(user.$id);
      set({ user, profile, loading: false });
    } catch (error) {
      set({ user: null, profile: null, loading: false });
    }
  },
  login: async ({ email, password }) => {
    set({ loading: true, error: null });
    try {
      await account.createEmailSession(email, password);
      const user = await account.get();
      const profile = await getProfileByUserId(user.$id);
      set({ user, profile, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  register: async ({ email, password, displayName }) => {
    set({ loading: true, error: null });
    try {
      await account.create(ID.unique(), email, password, displayName);
      await account.createEmailSession(email, password);
      const user = await account.get();
      const profile = await createProfile({
        userId: user.$id,
        displayName,
        role: "player",
      });
      set({ user, profile, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  logout: async () => {
    set({ loading: true, error: null });
    try {
      await account.deleteSession("current");
    } finally {
      set({ user: null, profile: null, loading: false });
    }
  },
}));
