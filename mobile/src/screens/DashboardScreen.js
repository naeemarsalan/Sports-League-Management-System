import React, { useEffect, useRef, useMemo } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Screen } from "../components/Screen";
import { Avatar } from "../components/Avatar";
import { fetchLeaderboard } from "../lib/leaderboard";
import { listMatches } from "../lib/matches";
import { colors } from "../theme/colors";
import { useAuthStore } from "../state/useAuthStore";

const LeagueCard = ({ title, week, progress, onPress }) => (
  <Pressable
    onPress={() => {
      Haptics.selectionAsync();
      onPress?.();
    }}
    style={styles.leagueCardWrapper}
  >
    <LinearGradient
      colors={colors.gradientGreen}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.leagueCard}
    >
      <View style={styles.leagueCardContent}>
        <Text style={styles.leagueTitle}>{title}</Text>
        <Text style={styles.leagueWeek}>Week {week}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      </View>
      <View style={styles.leagueIconContainer}>
        <Ionicons name="ellipse" size={48} color="rgba(255,255,255,0.3)" />
      </View>
    </LinearGradient>
  </Pressable>
);

const ActionButton = ({ icon, label, onPress }) => (
  <Pressable
    onPress={() => {
      Haptics.selectionAsync();
      onPress?.();
    }}
    style={styles.actionButton}
  >
    <View style={styles.actionIconContainer}>
      <Ionicons name={icon} size={22} color={colors.accent} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
  </Pressable>
);

export const DashboardScreen = ({ navigation }) => {
  const { profile } = useAuthStore();

  // Fetch leaderboard for user stats
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    enabled: !!profile,
  });

  // Fetch upcoming matches for user
  const { data: matches = [] } = useQuery({
    queryKey: ["matches", "upcoming", profile?.$id],
    queryFn: () => listMatches({ status: "upcoming", playerId: profile?.$id }),
    enabled: !!profile,
  });

  // Calculate user's stats
  const myStats = useMemo(() => {
    const entry = leaderboard.find((p) => p.playerId === profile?.$id);
    const totalMatches = matches.length;
    const completedMatches = matches.filter((m) => m.isCompleted).length;
    const progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
    return {
      wins: entry?.wins ?? 0,
      points: entry?.points ?? 0,
      upcomingMatches: matches.filter((m) => !m.isCompleted).length,
      progress,
    };
  }, [leaderboard, matches, profile]);

  // Get current week number
  const currentWeek = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  }, []);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Screen>
      {/* Welcome Header */}
      <Animated.View
        style={[
          styles.welcomeHeader,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.welcomeName}>{profile?.displayName ?? "Player"}</Text>
        </View>
        <Pressable onPress={() => navigation.navigate("Profile")}>
          <Avatar name={profile?.displayName} size={48} />
        </Pressable>
      </Animated.View>

      {/* Your Leagues Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>YOUR LEAGUES</Text>
        <LeagueCard
          title="Snooker Pool League"
          week={currentWeek}
          progress={myStats.progress || 25}
          onPress={() => navigation.navigate("Leaderboard")}
        />
      </View>

      {/* Quick Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.actionsContainer}>
          <ActionButton
            icon="flash-outline"
            label="Challenge Player"
            onPress={() => navigation.navigate("Challenge")}
          />
          <ActionButton
            icon="calendar-outline"
            label="View Matches"
            onPress={() => navigation.navigate("Matches")}
          />
          <ActionButton
            icon="trophy-outline"
            label="Standings"
            onPress={() => navigation.navigate("Leaderboard")}
          />
        </View>
      </View>

      {/* Admin Controls */}
      {profile?.role === "admin" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ADMIN</Text>
          <View style={styles.actionsContainer}>
            <ActionButton
              icon="people-outline"
              label="Manage Players"
              onPress={() => navigation.navigate("ManagePlayers")}
            />
            <ActionButton
              icon="add-circle-outline"
              label="Create Match"
              onPress={() => navigation.navigate("NewMatch")}
            />
          </View>
        </View>
      )}

      {/* Upcoming Matches */}
      {myStats.upcomingMatches > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UPCOMING</Text>
          <View style={styles.upcomingCard}>
            <View style={styles.upcomingInfo}>
              <Ionicons name="time-outline" size={20} color={colors.accent} />
              <Text style={styles.upcomingText}>
                {myStats.upcomingMatches} match{myStats.upcomingMatches > 1 ? "es" : ""} scheduled
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                navigation.navigate("Matches");
              }}
              style={styles.upcomingButton}
            >
              <Text style={styles.upcomingButtonText}>View</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  welcomeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  welcomeText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  welcomeName: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  leagueCardWrapper: {
    borderRadius: 16,
    overflow: "hidden",
  },
  leagueCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    minHeight: 120,
  },
  leagueCardContent: {
    flex: 1,
  },
  leagueTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  leagueWeek: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
    marginRight: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.textPrimary,
    borderRadius: 3,
  },
  progressText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  leagueIconContainer: {
    marginLeft: 16,
    opacity: 0.8,
  },
  actionsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentSubtle,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "500",
  },
  upcomingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  upcomingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  upcomingText: {
    color: colors.textPrimary,
    fontSize: 15,
    marginLeft: 10,
  },
  upcomingButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upcomingButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "600",
  },
});
