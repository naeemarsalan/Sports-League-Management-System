import React, { useState, useMemo } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { Avatar } from "../components/Avatar";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { account } from "../lib/appwrite";
import { updateProfile, listProfiles } from "../lib/profiles";
import { listMatches } from "../lib/matches";
import { fetchLeaderboard } from "../lib/leaderboard";
import { colors } from "../theme/colors";
import { useAuthStore } from "../state/useAuthStore";

const StatBox = ({ value, label, color = colors.accent }) => (
  <View style={styles.statBox}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const RecentMatchItem = ({ match, playersById, currentUserId }) => {
  const isPlayer1 = match.player1Id === currentUserId;
  const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
  const opponentName = playersById[opponentId]?.displayName ?? "Unknown";
  const myScore = isPlayer1 ? match.scorePlayer1 : match.scorePlayer2;
  const theirScore = isPlayer1 ? match.scorePlayer2 : match.scorePlayer1;

  let result = "pending";
  let resultColor = colors.textMuted;
  let resultIcon = "~";

  if (match.isCompleted && myScore !== null && theirScore !== null) {
    if (myScore > theirScore) {
      result = "Won";
      resultColor = colors.success;
      resultIcon = "W";
    } else if (myScore < theirScore) {
      result = "Lost";
      resultColor = colors.danger;
      resultIcon = "L";
    } else {
      result = "Draw";
      resultColor = colors.warning;
      resultIcon = "D";
    }
  }

  return (
    <View style={styles.matchItem}>
      <View style={[styles.resultBadge, { backgroundColor: resultColor + "20" }]}>
        <Text style={[styles.resultIcon, { color: resultColor }]}>{resultIcon}</Text>
      </View>
      <View style={styles.matchInfo}>
        <Text style={styles.opponentName}>vs {opponentName}</Text>
        <Text style={styles.matchDate}>
          {match.weekCommencing?.slice(0, 10) ?? "TBD"}
        </Text>
      </View>
      {match.isCompleted ? (
        <Text style={[styles.matchScore, { color: resultColor }]}>
          {myScore} - {theirScore}
        </Text>
      ) : (
        <Text style={styles.matchPending}>Pending</Text>
      )}
    </View>
  );
};

export const ProfileScreen = () => {
  const { profile, user, bootstrap, logout, loading } = useAuthStore();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    enabled: !!profile,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: listProfiles,
    enabled: !!profile,
  });

  const { data: recentMatches = [] } = useQuery({
    queryKey: ["matches", undefined, profile?.$id],
    queryFn: () => listMatches({ playerId: profile?.$id }),
    enabled: !!profile,
  });

  const playersById = useMemo(() => {
    return profiles.reduce((acc, p) => {
      acc[p.$id] = p;
      return acc;
    }, {});
  }, [profiles]);

  const myStats = useMemo(() => {
    const entry = leaderboard.find((p) => p.playerId === profile?.$id);
    if (entry) {
      return {
        wins: entry.wins,
        draws: entry.draws,
        losses: entry.losses,
        points: entry.points,
        rank: leaderboard.findIndex((p) => p.playerId === profile?.$id) + 1,
      };
    }
    return { wins: 0, draws: 0, losses: 0, points: 0, rank: null };
  }, [leaderboard, profile]);

  const winRate = useMemo(() => {
    const total = myStats.wins + myStats.draws + myStats.losses;
    if (total === 0) return 0;
    return Math.round((myStats.wins / total) * 100);
  }, [myStats]);

  const handleProfileUpdate = async () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Display name cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile(profile.$id, { displayName: displayName.trim() });
      await bootstrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Update failed", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Error", "Please fill in both password fields.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters.");
      return;
    }
    setChangingPassword(true);
    try {
      await account.updatePassword(newPassword, currentPassword);
      setCurrentPassword("");
      setNewPassword("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Password updated successfully.");
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Update failed", error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          logout();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        <EmptyState
          icon="error"
          title="Profile not found"
          message="We couldn't load your profile. Please try again."
          actionTitle="Retry"
          onAction={bootstrap}
        />
      </Screen>
    );
  }

  const last5Matches = recentMatches.slice(0, 5);

  return (
    <Screen>
      {/* Header with gradient background */}
      <LinearGradient
        colors={[colors.accentSubtle, "transparent"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Avatar name={profile.displayName} size={80} />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{profile.displayName}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {profile.role === "admin" ? "Admin" : "Player"}
                </Text>
              </View>
              {myStats.rank && (
                <View style={[styles.roleBadge, styles.rankBadge]}>
                  <Text style={styles.rankText}>#{myStats.rank}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Card */}
      <Card highlight glow>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <StatBox value={myStats.wins} label="Wins" color={colors.success} />
          <StatBox value={myStats.draws} label="Draws" color={colors.warning} />
          <StatBox value={myStats.losses} label="Losses" color={colors.danger} />
          <StatBox value={myStats.points} label="Points" color={colors.accent} />
        </View>
        {/* Win Rate Bar */}
        <View style={styles.winRateContainer}>
          <View style={styles.winRateHeader}>
            <Text style={styles.winRateLabel}>Win Rate</Text>
            <Text style={styles.winRateValue}>{winRate}%</Text>
          </View>
          <View style={styles.winRateBar}>
            <View style={[styles.winRateFill, { width: `${winRate}%` }]} />
          </View>
        </View>
      </Card>

      {/* Recent Matches */}
      <Card>
        <Text style={styles.sectionTitle}>Recent Matches</Text>
        {last5Matches.length > 0 ? (
          last5Matches.map((match) => (
            <RecentMatchItem
              key={match.$id}
              match={match}
              playersById={playersById}
              currentUserId={profile.$id}
            />
          ))
        ) : (
          <Text style={styles.noMatches}>No matches played yet</Text>
        )}
      </Card>

      {/* Edit Profile */}
      <Card>
        <Text style={styles.sectionTitle}>Edit Profile</Text>
        <Input
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
        />
        <Button
          title={saving ? "Saving..." : "Save Changes"}
          onPress={handleProfileUpdate}
          disabled={saving}
        />
      </Card>

      {/* Change Password */}
      <Card>
        <Text style={styles.sectionTitle}>Change Password</Text>
        <Input
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          placeholder="Enter current password"
        />
        <Input
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="Enter new password (min 8 chars)"
        />
        <Button
          title={changingPassword ? "Updating..." : "Update Password"}
          onPress={handlePasswordUpdate}
          disabled={changingPassword}
          variant="outline"
        />
      </Card>

      {/* Session */}
      <Card>
        <Text style={styles.sectionTitle}>Session</Text>
        <Text style={styles.sessionInfo}>
          Signed in as {user?.email}
        </Text>
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="danger"
        />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 16,
    fontSize: 14,
  },
  headerGradient: {
    marginHorizontal: -16,
    marginTop: -16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    marginBottom: 8,
    borderRadius: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
  },
  email: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  roleBadge: {
    backgroundColor: colors.accentSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "600",
  },
  rankBadge: {
    backgroundColor: colors.goldGlow,
  },
  rankText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "700",
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  winRateContainer: {
    marginTop: 16,
  },
  winRateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  winRateLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  winRateValue: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "600",
  },
  winRateBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  winRateFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  matchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resultIcon: {
    fontSize: 14,
    fontWeight: "800",
  },
  matchInfo: {
    flex: 1,
  },
  opponentName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  matchDate: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  matchScore: {
    fontSize: 16,
    fontWeight: "700",
  },
  matchPending: {
    color: colors.textMuted,
    fontSize: 13,
  },
  noMatches: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 16,
  },
  sessionInfo: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 12,
  },
});
