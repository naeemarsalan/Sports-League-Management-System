import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { Dimensions, Platform, UIManager } from "react-native";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { useAuthStore } from "./src/state/useAuthStore";
import {
  registerForPushNotifications,
  savePushToken,
  addNotificationListeners,
  getLastNotificationResponse,
} from "./src/lib/notifications";
import { navigationRef } from "./src/lib/navigation";
import { getMatch } from "./src/lib/matches";

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
    if (navigationRef.isReady()) {
      navigationRef.navigate("MatchDetail", { match, playersById: {} });
    }
  } catch (error) {
    console.warn("Failed to navigate to match:", error.message);
  }
};

function NotificationHandler() {
  const { user } = useAuthStore();
  const hasRegistered = useRef(false);

  useEffect(() => {
    // Register for push notifications when user logs in
    if (user && !hasRegistered.current) {
      hasRegistered.current = true;

      registerForPushNotifications().then((token) => {
        if (token) {
          savePushToken(user.$id, token);
        }
      });
    }

    // Reset registration state on logout
    if (!user) {
      hasRegistered.current = false;
    }
  }, [user]);

  useEffect(() => {
    // Set up notification listeners
    const cleanup = addNotificationListeners(
      // Called when notification received while app is open
      (notification) => {
        console.log("Notification received in foreground:", notification.request.content);
      },
      // Called when user taps on a notification
      (response) => {
        const data = response.notification.request.content.data;
        console.log("User tapped notification:", data);
        if (data?.matchId) {
          navigateToMatch(data.matchId);
        }
      }
    );

    // Handle cold-start deep linking
    getLastNotificationResponse().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        if (data?.matchId) {
          navigateToMatch(data.matchId);
        }
      }
    });

    return cleanup;
  }, []);

  return null;
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
