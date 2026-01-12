import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Picker } from "@react-native-picker/picker";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { listProfiles, updateProfile } from "../../lib/profiles";
import { colors } from "../../theme/colors";

export const ManagePlayersScreen = () => {
  const { data: profiles = [], refetch } = useQuery({
    queryKey: ["profiles"],
    queryFn: listProfiles,
  });

  const [selected, setSelected] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("player");

  const selectProfile = (profile) => {
    setSelected(profile);
    setDisplayName(profile.displayName);
    setRole(profile.role);
  };

  const handleSave = async () => {
    try {
      await updateProfile(selected.$id, { displayName, role });
      Alert.alert("Updated", "Player updated.");
      setSelected(null);
      await refetch();
    } catch (error) {
      Alert.alert("Update failed", error.message);
    }
  };

  return (
    <Screen>
      <SectionHeader title="Manage Players" subtitle="Update names and roles." />
      <Card>
        <Text style={styles.label}>Selected player</Text>
        {selected ? (
          <Text style={styles.playerName}>{selected.displayName}</Text>
        ) : (
          <Text style={styles.placeholder}>Select a player to edit.</Text>
        )}
        <Input label="Display name" value={displayName} onChangeText={setDisplayName} />
        <Text style={styles.label}>Role</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={role} onValueChange={(value) => setRole(value)} dropdownIconColor={colors.textSecondary}>
            <Picker.Item label="Player" value="player" />
            <Picker.Item label="Admin" value="admin" />
          </Picker>
        </View>
        <Button title="Save changes" onPress={handleSave} disabled={!selected} />
      </Card>
      {profiles.map((profile) => (
        <TouchableOpacity key={profile.$id} onPress={() => selectProfile(profile)}>
          <Card>
            <Text style={styles.playerName}>{profile.displayName}</Text>
            <Text style={styles.meta}>Role: {profile.role}</Text>
          </Card>
        </TouchableOpacity>
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  label: {
    color: colors.textSecondary,
    marginBottom: 6,
  },
  playerName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  meta: {
    color: colors.textMuted,
  },
  placeholder: {
    color: colors.textMuted,
    marginBottom: 8,
  },
  pickerWrap: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
});
