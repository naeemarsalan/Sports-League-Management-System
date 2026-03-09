import React, { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { DatePicker } from "../components/DatePicker";
import { Input } from "../components/Input";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { updateMatch } from "../lib/matches";
import { colors } from "../theme/colors";
import { useAuthStore } from "../state/useAuthStore";

const formatDateTime = (value) => (value ? value.replace("T", " ").slice(0, 16) : "");

export const MatchDetailScreen = ({ route, navigation }) => {
  const { profile } = useAuthStore();
  const { match, playersById } = route.params;

  const [scheduledAt, setScheduledAt] = useState(
    match.scheduledAt ? new Date(match.scheduledAt) : null
  );
  const [score1, setScore1] = useState(match.scorePlayer1?.toString() ?? "");
  const [score2, setScore2] = useState(match.scorePlayer2?.toString() ?? "");

  const player1 = playersById[match.player1Id]?.displayName ?? "Player 1";
  const player2 = playersById[match.player2Id]?.displayName ?? "Player 2";

  const canEdit = useMemo(() => {
    if (!profile) {
      return false;
    }
    if (profile.role === "admin") {
      return true;
    }
    return [match.player1Id, match.player2Id].includes(profile.$id);
  }, [match, profile]);

  const opponentId = profile?.$id === match.player1Id ? match.player2Id : match.player1Id;

  const handleSchedule = async () => {
    try {
      const payload = scheduledAt
        ? { scheduledAt: scheduledAt.toISOString() }
        : { scheduledAt: null };
      await updateMatch(match.$id, payload, {
        playerIds: [opponentId],
        type: "match_scheduled",
        data: {
          opponentName: profile?.displayName,
          scheduledAt: payload.scheduledAt,
        },
      });
      Alert.alert("Updated", "Match schedule updated.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Update failed", error.message);
    }
  };

  const handleScore = async () => {
    const parsedScore1 = Number(score1);
    const parsedScore2 = Number(score2);
    if (Number.isNaN(parsedScore1) || Number.isNaN(parsedScore2)) {
      Alert.alert("Invalid", "Scores must be numbers.");
      return;
    }
    try {
      await updateMatch(match.$id, {
        scorePlayer1: parsedScore1,
        scorePlayer2: parsedScore2,
        isCompleted: true,
      }, {
        playerIds: [match.player1Id, match.player2Id],
        type: "score_submitted",
        data: {
          scorePlayer1: parsedScore1,
          scorePlayer2: parsedScore2,
          player1Name: player1,
          player2Name: player2,
        },
      });
      Alert.alert("Updated", "Score submitted.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Update failed", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Screen edges={[]}>
        <SectionHeader title="Match details" subtitle={`${player1} vs ${player2}`} />
        <Card>
          <Text style={styles.label}>Week commencing</Text>
          <Text style={styles.value}>{match.weekCommencing?.slice(0, 10)}</Text>
          <Text style={styles.label}>Scheduled at</Text>
          <Text style={styles.value}>{match.scheduledAt ? formatDateTime(match.scheduledAt) : "Not scheduled"}</Text>
        </Card>
        <Card>
          <Text style={styles.section}>Schedule match</Text>
          <DatePicker
            label="Scheduled date & time"
            value={scheduledAt}
            onChange={setScheduledAt}
            mode="datetime"
            placeholder="Pick a date & time..."
          />
          <Button title="Update schedule" onPress={handleSchedule} disabled={!canEdit} />
        </Card>
        <Card>
          <Text style={styles.section}>Enter score</Text>
          <Input label={`${player1} score`} value={score1} onChangeText={setScore1} placeholder="0" />
          <Input label={`${player2} score`} value={score2} onChangeText={setScore2} placeholder="0" />
          <Button title="Submit score" onPress={handleScore} disabled={!canEdit} />
        </Card>
        {!canEdit ? <Text style={styles.notice}>Only match players or admins can edit.</Text> : null}
      </Screen>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  label: {
    color: colors.textMuted,
    marginBottom: 4,
  },
  value: {
    color: colors.textPrimary,
    marginBottom: 12,
    fontSize: 16,
  },
  section: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  notice: {
    color: colors.textSecondary,
    marginTop: 12,
  },
});
