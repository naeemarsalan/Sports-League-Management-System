import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { DatePicker } from "../../components/DatePicker";
import { Screen } from "../../components/Screen";
import { createMatch } from "../../lib/matches";
import { listProfiles } from "../../lib/profiles";
import { colors } from "../../theme/colors";
import { useLeagueStore } from "../../state/useLeagueStore";

export const NewMatchScreen = ({ navigation }) => {
  const { currentLeagueId } = useLeagueStore();
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: listProfiles,
  });

  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [weekCommencing, setWeekCommencing] = useState(null);
  const [scheduledAt, setScheduledAt] = useState(null);

  const handleCreate = async () => {
    if (!player1Id || !player2Id || !weekCommencing) {
      Alert.alert("Missing data", "Select players and week commencing.");
      return;
    }
    try {
      await createMatch({
        player1Id,
        player2Id,
        leagueId: currentLeagueId,
        weekCommencing: weekCommencing.toISOString(),
        scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
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
        <DatePicker
          label="Week commencing"
          value={weekCommencing}
          onChange={setWeekCommencing}
          mode="date"
          placeholder="Select week..."
        />
        <DatePicker
          label="Scheduled at (optional)"
          value={scheduledAt}
          onChange={setScheduledAt}
          mode="time"
          placeholder="Pick a time..."
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
