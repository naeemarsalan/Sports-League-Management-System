import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Screen } from "../components/Screen";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { createProfile } from "../lib/profiles";
import { colors } from "../theme/colors";
import { useAuthStore } from "../state/useAuthStore";

export const ProfileSetupScreen = () => {
  const { user, bootstrap } = useAuthStore();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSetup = async () => {
    if (!displayName.trim()) {
      Alert.alert("Required", "Please enter your display name.");
      return;
    }

    if (displayName.trim().length < 2) {
      Alert.alert("Too Short", "Display name must be at least 2 characters.");
      return;
    }

    setSaving(true);
    try {
      await createProfile({
        userId: user.$id,
        displayName: displayName.trim(),
        email: user.email,
        role: "player",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await bootstrap();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Setup Failed", error.message || "Could not create profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (saving) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} />
          <Text style={styles.loadingText}>Setting up your profile...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="person-add" size={48} color={colors.accent} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>
          Set up your player profile to start competing in the league.
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
            autoCapitalize="words"
            autoFocus
          />

          <Text style={styles.hint}>
            This is how other players will see you in matches and on the leaderboard.
          </Text>

          <Button
            title="Complete Setup"
            onPress={handleSetup}
            disabled={!displayName.trim()}
          />
        </View>

        {/* Email info */}
        <View style={styles.emailInfo}>
          <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accentSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 18,
  },
  emailInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  emailText: {
    color: colors.textMuted,
    fontSize: 14,
    marginLeft: 6,
  },
});
