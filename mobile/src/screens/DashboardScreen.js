import React, { useEffect, useRef, useMemo } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { Avatar } from "../components/Avatar";
import { fetchLeaderboard } from "../lib/leaderboard";
import { listMatches } from "../lib/matches";
import { colors } from "../theme/colors";
import { useAuthStore } from "../state/useAuthStore";

const QuickStatCard = ({ icon, value, label, color = colors.accent }) => (
  <View style={styles.quickStatCard}>
    <Text style={styles.quickStatIcon}>{icon}</Text>
    <Text style={[styles.quickStatValue, { color }]}>{value}</Text>
    <Text style={styles.quickStatLabel}>{label}</Text>
  </View>
);

export const DashboardScreen = ({ navigation }) => {
  const { profile } = useAuthStore();
  const roleLabel = profile?.role === "admin" ? "Admin" : "Player";

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
    const rank = leaderboard.findIndex((p) => p.playerId === profile?.$id) + 1;
    return {
      wins: entry?.wins ?? 0,
      rank: rank > 0 ? rank : "-",
      upcomingMatches: matches.filter((m) => !m.isCompleted).length,
    };
  }, [leaderboard, matches, profile]);

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
      {/* Welcome Header with Avatar */}
      <Animated.View
        style={[
          styles.welcomeHeader,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Avatar name={profile?.displayName} size={56} />
        <View style={styles.welcomeInfo}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.welcomeName}>{profile?.displayName ?? "Player"}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Quick Stats Row */}
      <LinearGradient
        colors={[colors.surfaceAlt, colors.surface]}
        style={styles.statsRow}
      >
        <QuickStatCard
          icon="🏆"
          value={`#${myStats.rank}`}
          label="Rank"
          color={colors.gold}
        />
        <View style={styles.statDivider} />
        <QuickStatCard
          icon="✓"
          value={myStats.wins}
          label="Wins"
          color={colors.success}
        />
        <View style={styles.statDivider} />
        <QuickStatCard
          icon="📅"
          value={myStats.upcomingMatches}
          label="Upcoming"
          color={colors.info}
        />
      </LinearGradient>

      {/* Quick Actions */}
      <Card highlight glow>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <Button
          title="⚔️  Challenge Player"
          onPress={() => navigation.navigate("Challenge")}
        />
        <Button
          title="🎯  View Matches"
          onPress={() => navigation.navigate("Matches")}
          variant="outline"
        />
        <Button
          title="📊  Leaderboard"
          onPress={() => navigation.navigate("Leaderboard")}
          variant="outline"
        />
      </Card>

      {/* Admin Controls */}
      {profile?.role === "admin" && (
        <Card>
          <Text style={styles.cardTitle}>Admin Controls</Text>
          <Button
            title="👥  Manage Players"
            onPress={() => navigation.navigate("ManagePlayers")}
          />
          <Button
            title="➕  Create Match"
            onPress={() => navigation.navigate("NewMatch")}
            variant="outline"
          />
        </Card>
      )}

      {/* Upcoming Match Preview */}
      {matches.length > 0 && !matches[0].isCompleted && (
        <Card>
          <Text style={styles.cardTitle}>Next Match</Text>
          <View style={styles.nextMatchPreview}>
            <Text style={styles.nextMatchDate}>
              📅 {matches[0].weekCommencing?.slice(0, 10) ?? "TBD"}
            </Text>
            <Text style={styles.nextMatchStatus}>Open</Text>
          </View>
          <Button
            title="View Details"
            onPress={() => navigation.navigate("Matches")}
            variant="outline"
          />
        </Card>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  welcomeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeInfo: {
    marginLeft: 16,
    flex: 1,
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
  roleBadge: {
    backgroundColor: colors.accentSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  roleText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  quickStatCard: {
    alignItems: "center",
    flex: 1,
  },
  quickStatIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  quickStatLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  nextMatchPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  nextMatchDate: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  nextMatchStatus: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: "600",
  },
});
