import React, { useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { account } from "../lib/appwrite";
import { updateProfile } from "../lib/profiles";
import { colors } from "../theme/colors";
import { useAuthStore } from "../state/useAuthStore";

export const ProfileScreen = () => {
  const { profile, user, bootstrap, logout } = useAuthStore();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleProfileUpdate = async () => {
    try {
      await updateProfile(profile.$id, { displayName });
      await bootstrap();
      Alert.alert("Updated", "Profile saved.");
    } catch (error) {
      Alert.alert("Update failed", error.message);
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      await account.updatePassword(newPassword, currentPassword);
      setCurrentPassword("");
      setNewPassword("");
      Alert.alert("Updated", "Password updated.");
    } catch (error) {
      Alert.alert("Update failed", error.message);
    }
  };

  if (!profile) {
    return (
      <Screen>
        <Text style={styles.empty}>Profile not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionHeader title="Profile" subtitle={`Signed in as ${user?.email ?? ""}`} />
      <Card>
        <Text style={styles.label}>Display name</Text>
        <Input value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
        <Button title="Save profile" onPress={handleProfileUpdate} />
      </Card>
      <Card>
        <Text style={styles.label}>Change password</Text>
        <Input
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <Input
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <Button title="Update password" onPress={handlePasswordUpdate} />
      </Card>
      <Card>
        <Text style={styles.label}>Session</Text>
        <Button title="Sign out" onPress={logout} variant="outline" />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  label: {
    color: colors.textSecondary,
    marginBottom: 6,
  },
  empty: {
    color: colors.textSecondary,
  },
});
