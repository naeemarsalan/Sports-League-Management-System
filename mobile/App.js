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
} from "./src/lib/notifications";

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
        // Navigation will be handled by deep linking in AppNavigator
      }
    );

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
