import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { Avatar } from "../components/Avatar";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { account } from "../lib/appwrite";
import { updateProfile } from "../lib/profiles";
import { colors } from "../theme/colors";
import { useAuthStore } from "../state/useAuthStore";

export const ProfileScreen = () => {
  const { profile, user, bootstrap, logout, loading } = useAuthStore();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

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

  return (
    <Screen>
      <View style={styles.header}>
        <Avatar name={profile.displayName} size={80} />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{profile.displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {profile.role === "admin" ? "Admin" : "Player"}
            </Text>
          </View>
        </View>
      </View>

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 8,
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
  },
  email: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: colors.accentSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  roleText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  sessionInfo: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 12,
  },
});
