import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { createMatch } from "../../lib/matches";
import { listProfiles } from "../../lib/profiles";
import { colors } from "../../theme/colors";

export const NewMatchScreen = ({ navigation }) => {
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: listProfiles,
  });

  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [weekCommencing, setWeekCommencing] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const handleCreate = async () => {
    if (!player1Id || !player2Id || !weekCommencing) {
      Alert.alert("Missing data", "Select players and week commencing.");
      return;
    }
    try {
      await createMatch({
        player1Id,
        player2Id,
        weekCommencing: new Date(weekCommencing).toISOString(),
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        isCompleted: false,
      });
      Alert.alert("Created", "Match scheduled.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Create failed", error.message);
    }
  };

  return (
    <Screen>
      <SectionHeader title="Create Match" subtitle="Schedule a new fixture." />
      <Card>
        <Text style={styles.label}>Player 1</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={player1Id} onValueChange={(value) => setPlayer1Id(value)}>
            <Picker.Item label="Select player" value="" />
            {profiles.map((profile) => (
              <Picker.Item key={profile.$id} label={profile.displayName} value={profile.$id} />
            ))}
          </Picker>
        </View>
        <Text style={styles.label}>Player 2</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={player2Id} onValueChange={(value) => setPlayer2Id(value)}>
            <Picker.Item label="Select player" value="" />
            {profiles.map((profile) => (
              <Picker.Item key={profile.$id} label={profile.displayName} value={profile.$id} />
            ))}
          </Picker>
        </View>
        <Input
          label="Week commencing (YYYY-MM-DD)"
          value={weekCommencing}
          onChangeText={setWeekCommencing}
          placeholder="2025-07-07"
        />
        <Input
          label="Scheduled at (optional, YYYY-MM-DD HH:MM)"
          value={scheduledAt}
          onChangeText={setScheduledAt}
          placeholder="2025-07-15 19:00"
        />
        <Button title="Create match" onPress={handleCreate} />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  label: {
    color: colors.textSecondary,
    marginBottom: 6,
  },
  pickerWrap: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
});
