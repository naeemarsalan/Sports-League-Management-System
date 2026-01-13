import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../state/useAuthStore";
import { useLeagueStore } from "../state/useLeagueStore";
import { DashboardScreen } from "../screens/DashboardScreen";
import { MatchesScreen } from "../screens/MatchesScreen";
import { LeaderboardScreen } from "../screens/LeaderboardScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { MatchDetailScreen } from "../screens/MatchDetailScreen";
import { ChallengeScreen } from "../screens/ChallengeScreen";
import { ProfileSetupScreen } from "../screens/ProfileSetupScreen";
// League screens
import { LeaguesScreen } from "../screens/LeaguesScreen";
import { CreateLeagueScreen } from "../screens/CreateLeagueScreen";
import { JoinLeagueScreen } from "../screens/JoinLeagueScreen";
import { LeagueMembersScreen } from "../screens/LeagueMembersScreen";
import { LeagueSettingsScreen } from "../screens/LeagueSettingsScreen";
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

const getTabIcon = (routeName, focused) => {
  const icons = {
    Dashboard: focused ? "home" : "home-outline",
    Matches: focused ? "calendar" : "calendar-outline",
    Leaderboard: focused ? "trophy" : "trophy-outline",
    Profile: focused ? "person" : "person-outline",
  };
  return icons[routeName] || "ellipse-outline";
};

const Tabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        paddingTop: 8,
        paddingBottom: 8,
        height: 65,
      },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: "500",
        marginTop: 2,
      },
      tabBarIcon: ({ focused, color, size }) => (
        <Ionicons
          name={getTabIcon(route.name, focused)}
          size={24}
          color={color}
        />
      ),
    })}
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
  const { user, profile, bootstrap } = useAuthStore();
  const { reset: resetLeagueStore } = useLeagueStore();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Reset league store on logout
  useEffect(() => {
    if (!user) {
      resetLeagueStore();
    }
  }, [user, resetLeagueStore]);

  const options = Platform.OS === "web" ? webScreenOptions : screenOptions;

  // User is logged in but has no profile - show setup screen
  const needsProfileSetup = user && !profile;

  return (
    <NavigationContainer>
      {user ? (
        needsProfileSetup ? (
          <Stack.Navigator screenOptions={options}>
            <Stack.Screen
              name="ProfileSetup"
              component={ProfileSetupScreen}
              options={{ title: "Profile Setup", headerShown: false }}
            />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator screenOptions={options}>
            <Stack.Screen
              name="Main"
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
            {/* League Management Screens */}
            <Stack.Screen
              name="Leagues"
              component={LeaguesScreen}
              options={{ title: "Leagues" }}
            />
            <Stack.Screen
              name="CreateLeague"
              component={CreateLeagueScreen}
              options={{ title: "Create League" }}
            />
            <Stack.Screen
              name="JoinLeague"
              component={JoinLeagueScreen}
              options={{ title: "Join League" }}
            />
            <Stack.Screen
              name="LeagueMembers"
              component={LeagueMembersScreen}
              options={{ title: "Members" }}
            />
            <Stack.Screen
              name="LeagueSettings"
              component={LeagueSettingsScreen}
              options={{ title: "League Settings" }}
            />
          </Stack.Navigator>
        )
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
