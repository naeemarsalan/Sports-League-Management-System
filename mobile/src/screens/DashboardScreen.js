import React, { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { Animated, Pressable, StyleSheet, Text, View, ScrollView, RefreshControl } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Screen } from "../components/Screen";
import { Avatar } from "../components/Avatar";
import { LeagueCard } from "../components/LeagueCard";
import { RoleBadge } from "../components/RoleBadge";
import { NotificationModal } from "../components/NotificationModal";
import { NotificationHistoryModal } from "../components/NotificationHistoryModal";
import { fetchLeaderboard } from "../lib/leaderboard";
import { getScoringConfig } from "../lib/leagues";
import { listMatches } from "../lib/matches";
import { getMatch } from "../lib/matches";
import { colors } from "../theme/colors";
import { useAuthStore } from "../state/useAuthStore";
import { useLeagueStore, ACTIONS } from "../state/useLeagueStore";
import { useNotificationStore } from "../state/useNotificationStore";

const ActionButton = ({ icon, label, onPress, testID }) => (
  <Pressable
    onPress={() => {
      Haptics.selectionAsync();
      onPress?.();
    }}
    style={styles.actionButton}
    testID={testID}
  >
    <View style={styles.actionIconContainer}>
      <Ionicons name={icon} size={22} color={colors.accent} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
  </Pressable>
);

export const DashboardScreen = ({ navigation }) => {
  const { user, profile } = useAuthStore();
  const {
    currentLeague,
    currentLeagueId,
    currentMembership,
    userLeagues,
    userMemberships,
    fetchUserLeagues,
    setCurrentLeague,
    canPerform,
  } = useLeagueStore();
  const queryClient = useQueryClient();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const [refreshing, setRefreshing] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const handleOpenHistory = useCallback(() => {
    Haptics.selectionAsync();
    markAllRead();
    setHistoryVisible(true);
  }, [markAllRead]);

  const handleSelectNotification = useCallback((notification) => {
    setHistoryVisible(false);
    setSelectedNotification(notification);
    setDetailModalVisible(true);
  }, []);

  const handleNotificationAction = useCallback(async (notification) => {
    setDetailModalVisible(false);
    if (notification.data?.matchId) {
      try {
        const match = await getMatch(notification.data.matchId);
        navigation.navigate("MatchDetail", { match, playersById: {} });
      } catch (e) {
        console.warn("Failed to navigate to match:", e.message);
      }
    }
  }, [navigation]);

  // Fetch user's leagues on mount
  useEffect(() => {
    if (user) {
      fetchUserLeagues(user.$id);
    }
  }, [user]);

  // Fetch leaderboard for current league
  const scoringConfig = getScoringConfig(currentLeague);
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard", currentLeagueId, scoringConfig],
    queryFn: () => fetchLeaderboard(currentLeagueId, scoringConfig),
    enabled: !!profile && !!currentLeagueId,
  });

  // Fetch upcoming matches for user in current league
  const { data: matches = [] } = useQuery({
    queryKey: ["matches", "upcoming", profile?.$id, currentLeagueId],
    queryFn: () =>
      listMatches({
        leagueId: currentLeagueId,
        status: "upcoming",
        playerId: profile?.$id,
      }),
    enabled: !!profile && !!currentLeagueId,
  });

  // Calculate user's stats
  const myStats = useMemo(() => {
    const entry = leaderboard.find(
      (p) => p.playerId === profile?.$id || p.userId === user?.$id
    );
    const totalMatches = matches.length;
    const completedMatches = matches.filter((m) => m.isCompleted).length;
    const progress =
      totalMatches > 0
        ? Math.round((completedMatches / totalMatches) * 100)
        : 0;
    return {
      wins: entry?.wins ?? 0,
      points: entry?.points ?? 0,
      upcomingMatches: matches.filter((m) => !m.isCompleted).length,
      progress,
    };
  }, [leaderboard, matches, profile, user]);

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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        user ? fetchUserLeagues(user.$id) : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] }),
        queryClient.invalidateQueries({ queryKey: ["matches"] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [user, fetchUserLeagues, queryClient]);

  const canManageMembers = canPerform(ACTIONS.APPROVE_MEMBERS);
  const canCreateMatch = canPerform(ACTIONS.CREATE_MATCH);

  const getMembershipForLeague = (leagueId) => {
    return userMemberships.find((m) => m.leagueId === leagueId);
  };

  return (
    <Screen
      testID="dashboard-container"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
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
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.welcomeName}>
            {profile?.displayName ?? "Player"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={handleOpenHistory} style={styles.bellButton}>
            <Ionicons name={unreadCount > 0 ? "notifications" : "notifications-outline"} size={24} color={colors.textPrimary} />
            {unreadCount > 0 && <View style={styles.badgeDot} />}
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Profile")}>
            <Avatar name={profile?.displayName} size={48} />
          </Pressable>
        </View>
      </Animated.View>

      {/* No Leagues State */}
      {userLeagues.length === 0 && (
        <View style={styles.noLeaguesContainer}>
          <Ionicons name="people-outline" size={64} color={colors.textMuted} />
          <Text style={styles.noLeaguesTitle}>No leagues yet</Text>
          <Text style={styles.noLeaguesText}>
            Create your own league or join an existing one to get started.
          </Text>
          <View style={styles.noLeaguesActions}>
            <Pressable
              style={styles.createLeagueBtn}
              onPress={() => navigation.navigate("CreateLeague")}
              testID="btn-create-league"
            >
              <Ionicons name="add" size={20} color={colors.textInverse} />
              <Text style={styles.createLeagueBtnText}>Create League</Text>
            </Pressable>
            <Pressable
              style={styles.joinLeagueBtn}
              onPress={() => navigation.navigate("JoinLeague")}
              testID="btn-join-league"
            >
              <Ionicons name="key-outline" size={20} color={colors.accent} />
              <Text style={styles.joinLeagueBtnText}>Join League</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Your Leagues Section */}
      {userLeagues.length > 0 && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>YOUR LEAGUES</Text>
              <Pressable onPress={() => navigation.navigate("Leagues")}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.leaguesScroll}
            >
              {userLeagues.slice(0, 3).map((league) => (
                <Pressable
                  key={league.$id}
                  style={[
                    styles.leagueCardWrapper,
                    currentLeagueId === league.$id && styles.leagueCardSelected,
                  ]}
                  onPress={async () => {
                    Haptics.selectionAsync();
                    await setCurrentLeague(league.$id);
                  }}
                >
                  <LinearGradient
                    colors={colors.gradientGreen}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.leagueCardGradient}
                  >
                    <View style={styles.leagueCardHeader}>
                      <Ionicons
                        name="ellipse"
                        size={24}
                        color="rgba(255,255,255,0.4)"
                      />
                      {currentLeagueId === league.$id && (
                        <View style={styles.activeIndicator}>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={colors.accent}
                          />
                        </View>
                      )}
                    </View>
                    <Text style={styles.leagueCardTitle} numberOfLines={1}>
                      {league.name}
                    </Text>
                    <View style={styles.leagueCardFooter}>
                      <Text style={styles.leagueCardMembers}>
                        {league.memberCount || 0} members
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              ))}
              {/* Add league button */}
              <Pressable
                style={styles.addLeagueCard}
                onPress={() => navigation.navigate("Leagues")}
              >
                <Ionicons name="add" size={32} color={colors.textMuted} />
                <Text style={styles.addLeagueText}>Browse</Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* Current League Info */}
          {currentLeague && (
            <View style={styles.currentLeagueInfo}>
              <Text style={styles.currentLeagueLabel}>Current:</Text>
              <Text style={styles.currentLeagueName} numberOfLines={1}>
                {currentLeague.name}
              </Text>
              {currentMembership && (
                <RoleBadge role={currentMembership.role} size="small" />
              )}
            </View>
          )}

          {/* Quick Actions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
            <View style={styles.actionsContainer}>
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
          {(canManageMembers || canCreateMatch) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>LEAGUE MANAGEMENT</Text>
              <View style={styles.actionsContainer}>
                {canCreateMatch && (
                  <ActionButton
                    icon="flash-outline"
                    label="Challenge Player"
                    onPress={() => navigation.navigate("Challenge")}
                    testID="btn-challenge-player"
                  />
                )}
                {canManageMembers && (
                  <ActionButton
                    icon="people-outline"
                    label="Manage Members"
                    onPress={() => navigation.navigate("LeagueMembers")}
                  />
                )}
                {canCreateMatch && (
                  <ActionButton
                    icon="add-circle-outline"
                    label="Create Match"
                    onPress={() => navigation.navigate("NewMatch")}
                  />
                )}
                {canManageMembers && (
                  <ActionButton
                    icon="megaphone-outline"
                    label="Send Announcement"
                    onPress={() => navigation.navigate("AdminBroadcast")}
                  />
                )}
                <ActionButton
                  icon="settings-outline"
                  label="League Settings"
                  onPress={() => navigation.navigate("LeagueSettings")}
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
                    {myStats.upcomingMatches} match
                    {myStats.upcomingMatches > 1 ? "es" : ""} scheduled
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
        </>
      )}
      <NotificationHistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        onSelectNotification={handleSelectNotification}
      />
      <NotificationModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        notification={selectedNotification}
        onAction={handleNotificationAction}
      />
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bellButton: {
    position: "relative",
    padding: 4,
  },
  badgeDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.background,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  seeAll: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "500",
  },
  leaguesScroll: {
    paddingRight: 20,
  },
  leagueCardWrapper: {
    width: 160,
    marginRight: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  leagueCardSelected: {
    borderColor: colors.accent,
  },
  leagueCardGradient: {
    padding: 16,
    height: 120,
    justifyContent: "space-between",
  },
  leagueCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeIndicator: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 2,
  },
  leagueCardTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  leagueCardFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  leagueCardMembers: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  addLeagueCard: {
    width: 100,
    height: 120,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addLeagueText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  currentLeagueInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  currentLeagueLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginRight: 8,
  },
  currentLeagueName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
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
  // No leagues state
  noLeaguesContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noLeaguesTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  noLeaguesText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    maxWidth: 280,
    marginBottom: 24,
  },
  noLeaguesActions: {
    flexDirection: "row",
  },
  createLeagueBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  createLeagueBtnText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  joinLeagueBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentSubtle,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  joinLeagueBtnText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
});
