import React from "react";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { Dimensions, Platform, UIManager } from "react-native";
import { enableScreens } from "react-native-screens";
import { AppNavigator } from "./src/navigation/AppNavigator";

const queryClient = new QueryClient();

enableScreens(false);

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

export default function App() {
  return (
    <SafeAreaProviderCompat>
      <QueryClientProvider client={queryClient}>
        <AppNavigator />
        <StatusBar style="light" />
      </QueryClientProvider>
    </SafeAreaProviderCompat>
  );
}
