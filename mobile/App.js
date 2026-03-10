import React, { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { Dimensions, Platform, UIManager } from "react-native";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { useAuthStore } from "./src/state/useAuthStore";
import { useLeagueStore } from "./src/state/useLeagueStore";
import { useNotificationStore } from "./src/state/useNotificationStore";
import {
  registerForPushNotifications,
  savePushToken,
  addNotificationListeners,
  getLastNotificationResponse,
} from "./src/lib/notifications";
import { navigationRef } from "./src/lib/navigation";
import { getMatch } from "./src/lib/matches";
import { NotificationModal } from "./src/components/NotificationModal";

const queryClient = new QueryClient();

const hasNativeSafeArea =
  Platform.OS === "web" ||
  !!UIManager.getViewManagerConfig?.("RNCSafeAreaView") ||
  !!UIManager.getViewManagerConfig?.("RNCSafeAreaProvider");

const window = Dimensions.get("window");
const fallbackFrame = { x: 0, y: 0, width: window.width, height: window.height };
const fallbackInsets = { top: 0, bottom: 0, left: 0, right: 0 };

function SafeAreaProviderCompat({ children }) {
  if (!hasNativeSafeArea) {
    return (
      <SafeAreaFrameContext.Provider value={fallbackFrame}>
        <SafeAreaInsetsContext.Provider value={fallbackInsets}>
          {children}
        </SafeAreaInsetsContext.Provider>
      </SafeAreaFrameContext.Provider>
    );
  }

  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}

const navigateToMatch = async (matchId) => {
  try {
    const match = await getMatch(matchId);
    // Fetch player profiles so names display correctly
    const playersById = {};
    const { databases: db, appwriteConfig: cfg } = require("./src/lib/appwrite");
    for (const pid of [match.player1Id, match.player2Id]) {
      if (pid) {
        try {
          const doc = await db.getDocument(cfg.databaseId, cfg.profilesCollectionId, pid);
          playersById[pid] = doc;
        } catch {
          // Profile not found — will fall back to default name
        }
      }
    }
    if (navigationRef.isReady()) {
      navigationRef.navigate("MatchDetail", { match, playersById });
    }
  } catch (error) {
    console.warn("Failed to navigate to match:", error.message);
  }
};

const parseNotification = (content, data) => ({
  type: data?.type || "general",
  title: content?.title || "",
  body: content?.body || "",
  data: data || {},
});

function NotificationHandler() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const hasRegistered = useRef(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);

  // Use ref so the listener closures always call the latest version
  const showNotificationRef = useRef(null);
  showNotificationRef.current = (content, data) => {
    console.log("[NotificationHandler] showNotification called:", { title: content?.title, data });
    const parsed = parseNotification(content, data);
    const item = useNotificationStore.getState().addNotification(parsed);
    setCurrentNotification(item);
    setModalVisible(true);

    // Auto-refresh data when notification arrives
    queryClient.invalidateQueries({ queryKey: ["matches"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    queryClient.invalidateQueries({ queryKey: ["leagueMembers"] });
    if (data?.type === "join_approved" && user) {
      useLeagueStore.getState().fetchUserLeagues(user.$id);
    }
  };

  useEffect(() => {
    if (user && !hasRegistered.current) {
      registerForPushNotifications().then((token) => {
        hasRegistered.current = true;
        if (token) {
          savePushToken(user.$id, token);
        }
      });
    }
    if (!user) {
      hasRegistered.current = false;
    }
  }, [user]);

  useEffect(() => {
    const cleanup = addNotificationListeners(
      (notification) => {
        console.log("[NotificationHandler] Foreground notification received");
        const { content } = notification.request;
        showNotificationRef.current(content, content.data);
      },
      (response) => {
        console.log("[NotificationHandler] Notification tapped");
        const { content } = response.notification.request;
        showNotificationRef.current(content, content.data);
      }
    );

    getLastNotificationResponse().then((response) => {
      if (response) {
        console.log("[NotificationHandler] Cold-start notification found");
        const { content } = response.notification.request;
        showNotificationRef.current(content, content.data);
      }
    });

    return cleanup;
  }, []);

  const handleAction = (notification) => {
    setModalVisible(false);
    if (notification.data?.matchId) {
      navigateToMatch(notification.data.matchId);
    }
  };

  return (
    <NotificationModal
      visible={modalVisible}
      onClose={() => setModalVisible(false)}
      notification={currentNotification}
      onAction={handleAction}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProviderCompat>
      <QueryClientProvider client={queryClient}>
        <NotificationHandler />
        <AppNavigator />
        <StatusBar style="light" />
      </QueryClientProvider>
    </SafeAreaProviderCompat>
  );
}
