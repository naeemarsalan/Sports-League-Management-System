import React, { useState, useMemo } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Screen } from "../components/Screen";
import { Avatar } from "../components/Avatar";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { account } from "../lib/appwrite";
import { updateProfile, listProfiles } from "../lib/profiles";
import { listMatches } from "../lib/matches";
import { fetchLeaderboard } from "../lib/leaderboard";
import { colors } from "../theme/colors";
import { useAuthStore } from "../state/useAuthStore";

export const ProfileScreen = ({ navigation }) => {
  const { profile, user, bootstrap, logout, deleteAccount, loading } = useAuthStore();
  const [showEditName, setShowEditName] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

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
      const total = entry.wins + entry.draws + entry.losses;
      return {
        wins: entry.wins,
        losses: entry.losses,
        points: entry.points,
        winRate: total > 0 ? Math.round((entry.wins / total) * 100) : 0,
      };
    }
    return { wins: 0, losses: 0, points: 0, winRate: 0 };
  }, [leaderboard, profile]);

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Display name cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile(profile.$id, { displayName: displayName.trim() });
      await bootstrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEditName(false);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Update failed", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert("Error", "Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      await account.updatePassword(newPassword, currentPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Your password has been updated.");
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Failed", error.message || "Could not update password.");
    } finally {
      setSavingPassword(false);
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

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all associated data including your profile, league memberships, and match history. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            // Second confirmation
            Alert.alert(
              "Are you absolutely sure?",
              "Type your action to confirm: all your data will be permanently removed.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete Everything",
                  style: "destructive",
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      await deleteAccount();
                    } catch (error) {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                      Alert.alert("Error", error.message || "Failed to delete account. Please try again.");
                      setDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} />
        </View>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        <EmptyState
          icon="person"
          title="Complete Your Profile"
          message="Set up your profile to start playing."
          actionTitle="Set Up Profile"
          onAction={bootstrap}
        />
      </Screen>
    );
  }

  // Get current match if any
  const currentMatch = recentMatches.find((m) => !m.isCompleted);
  const currentOpponent = currentMatch
    ? playersById[
        currentMatch.player1Id === profile.$id
          ? currentMatch.player2Id
          : currentMatch.player1Id
      ]?.displayName ?? "Unknown"
    : null;

  return (
    <Screen>
      <Text style={styles.screenTitle}>PLAYER PROFILE</Text>

      {/* Centered Avatar and Name */}
      <View style={styles.profileHeader}>
        <Avatar name={profile.displayName} size={100} />
        <Text style={styles.playerName}>{profile.displayName}</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>LEAGUE RATING:</Text>
          <Text style={styles.statValueLarge}>{myStats.points}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>WIN RATE:</Text>
          <Text style={styles.statValueLarge}>{myStats.winRate}%</Text>
        </View>
      </View>

      {/* Recent Performance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RECENT PERFORMANCE</Text>
        <View style={styles.performanceBox}>
          <View style={styles.performanceStats}>
            <View style={styles.performanceStat}>
              <Text style={[styles.performanceValue, { color: colors.success }]}>
                {myStats.wins}
              </Text>
              <Text style={styles.performanceLabel}>Wins</Text>
            </View>
            <View style={styles.performanceStat}>
              <Text style={[styles.performanceValue, { color: colors.danger }]}>
                {myStats.losses}
              </Text>
              <Text style={styles.performanceLabel}>Losses</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Current Match */}
      {currentMatch && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CURRENT MATCH</Text>
          <View style={styles.currentMatchBox}>
            <Text style={styles.currentMatchText}>
              vs {currentOpponent}
            </Text>
          </View>
        </View>
      )}

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SETTINGS</Text>

        <Pressable
          style={styles.menuItem}
          onPress={() => setShowEditName(!showEditName)}
        >
          <Text style={styles.menuItemText}>Edit Display Name</Text>
          <Ionicons
            name={showEditName ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.textMuted}
          />
        </Pressable>

        {showEditName && (
          <View style={styles.editNameBox}>
            <Input
              label="Display name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
            />
            <Button
              title={saving ? "Saving..." : "Save"}
              onPress={handleSaveName}
              disabled={saving}
            />
          </View>
        )}

        <Pressable
          style={styles.menuItem}
          onPress={() => setShowChangePassword(!showChangePassword)}
        >
          <Text style={styles.menuItemText}>Change Password</Text>
          <Ionicons
            name={showChangePassword ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.textMuted}
          />
        </Pressable>

        {showChangePassword && (
          <View style={styles.editNameBox}>
            <Input
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              secureTextEntry
            />
            <Input
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Min 8 characters"
              secureTextEntry
            />
            <Input
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              secureTextEntry
            />
            <Button
              title={savingPassword ? "Updating..." : "Update Password"}
              onPress={handleChangePassword}
              disabled={savingPassword}
            />
          </View>
        )}

        <Pressable
          style={styles.menuItem}
          onPress={() => Linking.openURL("mailto:support@snookerpoolleague.co.uk")}
        >
          <Text style={styles.menuItemText}>Support / Report a Concern</Text>
          <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable style={styles.menuItem} onPress={handleLogout}>
          <Text style={[styles.menuItemText, { color: colors.danger }]}>
            Log Out
          </Text>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        </Pressable>

        <Pressable
          style={[styles.menuItem, styles.deleteAccountItem]}
          onPress={handleDeleteAccount}
          disabled={deleting}
        >
          <Text style={[styles.menuItemText, { color: colors.danger }]}>
            {deleting ? "Deleting Account..." : "Delete Account"}
          </Text>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screenTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  playerName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 12,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statValueLarge: {
    color: colors.accent,
    fontSize: 36,
    fontWeight: "800",
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
  performanceBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  performanceStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  performanceStat: {
    alignItems: "center",
  },
  performanceValue: {
    fontSize: 32,
    fontWeight: "800",
  },
  performanceLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  currentMatchBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  currentMatchText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "500",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  menuItemText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "500",
  },
  editNameBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  deleteAccountItem: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: "transparent",
  },
});
