import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MAX_NOTIFICATIONS = 50;

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const item = {
          id: notification.id || Date.now().toString(),
          type: notification.type || "general",
          title: notification.title || "",
          body: notification.body || "",
          data: notification.data || {},
          timestamp: notification.timestamp || Date.now(),
          read: false,
        };
        set((state) => ({
          notifications: [item, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
          unreadCount: state.unreadCount + 1,
        }));
        return item;
      },

      markAllRead: () =>
        set((state) => ({
          unreadCount: 0,
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      clearAll: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: "notification-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
