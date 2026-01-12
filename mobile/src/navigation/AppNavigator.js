import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import { Platform } from "react-native";
import { useAuthStore } from "../state/useAuthStore";
import { DashboardScreen } from "../screens/DashboardScreen";
import { MatchesScreen } from "../screens/MatchesScreen";
import { LeaderboardScreen } from "../screens/LeaderboardScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { MatchDetailScreen } from "../screens/MatchDetailScreen";
import { ManagePlayersScreen } from "../screens/admin/ManagePlayersScreen";
import { NewMatchScreen } from "../screens/admin/NewMatchScreen";
import { ChallengeScreen } from "../screens/ChallengeScreen";
import { colors } from "../theme/colors";

const Stack = Platform.OS === "web" ? createStackNavigator() : createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { fontWeight: "600" },
  contentStyle: { backgroundColor: colors.background },
  animation: "fade_from_bottom",
};

const webScreenOptions = {
  ...screenOptions,
  ...TransitionPresets.SlideFromRightIOS,
};

const Tabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        paddingTop: 4,
        height: 60,
      },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: "500",
      },
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{ tabBarLabel: "Home" }}
    />
    <Tab.Screen
      name="Matches"
      component={MatchesScreen}
      options={{ tabBarLabel: "Matches" }}
    />
    <Tab.Screen
      name="Leaderboard"
      component={LeaderboardScreen}
      options={{ tabBarLabel: "Standings" }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarLabel: "Profile" }}
    />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const { user, bootstrap } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const options = Platform.OS === "web" ? webScreenOptions : screenOptions;

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator screenOptions={options}>
          <Stack.Screen
            name="Home"
            component={Tabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MatchDetail"
            component={MatchDetailScreen}
            options={{ title: "Match Details" }}
          />
          <Stack.Screen
            name="Challenge"
            component={ChallengeScreen}
            options={{ title: "Challenge Player" }}
          />
          <Stack.Screen
            name="ManagePlayers"
            component={ManagePlayersScreen}
            options={{ title: "Manage Players" }}
          />
          <Stack.Screen
            name="NewMatch"
            component={NewMatchScreen}
            options={{ title: "Create Match" }}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={options}>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: "Sign In" }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: "Register" }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};
