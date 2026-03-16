import React, { useMemo, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useHeaderHeight } from "@react-navigation/elements";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { DatePicker } from "../components/DatePicker";
import { Input } from "../components/Input";
import { SectionHeader } from "../components/SectionHeader";
import { updateMatch } from "../lib/matches";
import { fetchLeaderboard, notifyOvertakenPlayers } from "../lib/leaderboard";
import { getScoringConfig } from "../lib/leagues";
import { colors } from "../theme/colors";
import { useAuthStore } from "../state/useAuthStore";
import { useLeagueStore, ACTIONS } from "../state/useLeagueStore";

const formatDateTime = (value) => (value ? value.replace("T", " ").slice(0, 16) : "");

export const MatchDetailScreen = ({ route, navigation }) => {
  const { profile } = useAuthStore();
  const { currentLeague, canPerform } = useLeagueStore();
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  const headerHeight = useHeaderHeight();
  const { match, playersById } = route.params;
  const scoringConfig = getScoringConfig(currentLeague);

  const [scheduledAt, setScheduledAt] = useState(
    match.scheduledAt ? new Date(match.scheduledAt) : null
  );
  const [score1, setScore1] = useState(match.scorePlayer1?.toString() ?? "");
  const [score2, setScore2] = useState(match.scorePlayer2?.toString() ?? "");

  const player1 = playersById[match.player1Id]?.displayName ?? "Player 1";
  const player2 = playersById[match.player2Id]?.displayName ?? "Player 2";

  const isModOrAbove = canPerform(ACTIONS.EDIT_ANY_MATCH);
  const isMatchPlayer = [match.player1Id, match.player2Id].includes(profile?.$id);

  const canEdit = useMemo(() => {
    if (!profile) return false;
    if (isModOrAbove) return true;
    // Regular players can only edit their own incomplete matches
    if (match.isCompleted) return false;
    return isMatchPlayer;
  }, [match, profile, isModOrAbove, isMatchPlayer]);

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
        leagueId: match.leagueId,
      });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
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
      Alert.alert("Invalid", "Frames must be numbers.");
      return;
    }
    try {
      // Capture leaderboard before score submission
      const leagueId = match.leagueId;
      const beforeBoard = leagueId ? await fetchLeaderboard(leagueId, scoringConfig) : [];

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
        leagueId: match.leagueId,
      });

      // Capture leaderboard after and notify overtaken players (fire-and-forget)
      if (leagueId && beforeBoard.length > 0) {
        fetchLeaderboard(leagueId, scoringConfig).then((afterBoard) => {
          notifyOvertakenPlayers(beforeBoard, afterBoard, leagueId);
        }).catch(() => {});
      }

      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      Alert.alert("Updated", "Result submitted.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Update failed", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Match details" subtitle={`${player1} vs ${player2}`} />
        {match.isCompleted && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedText}>
              {isModOrAbove ? "Match completed — editing as mod/admin" : "Match completed — results are locked"}
            </Text>
          </View>
        )}
        <Card>
          <Text style={styles.label}>Week commencing</Text>
          <Text style={styles.value}>{match.weekCommencing?.slice(0, 10)}</Text>
          <Text style={styles.label}>Scheduled at</Text>
          <Text style={styles.value}>{match.scheduledAt ? formatDateTime(match.scheduledAt) : "Not scheduled"}</Text>
          {match.isCompleted && (
            <>
              <Text style={styles.label}>Result</Text>
              <Text style={styles.value}>{player1} {match.scorePlayer1} - {match.scorePlayer2} {player2}</Text>
            </>
          )}
        </Card>
        {canEdit && (
          <Card>
            <Text style={styles.section}>Schedule match</Text>
            <DatePicker
              label="Scheduled date & time"
              value={scheduledAt}
              onChange={setScheduledAt}
              mode="datetime"
              placeholder="Pick a date & time..."
            />
            <Button title="Update schedule" onPress={handleSchedule} />
          </Card>
        )}
        {canEdit && (
          <Card>
            <Text style={styles.section}>{match.isCompleted ? "Edit result" : "Enter frames won"}</Text>
            <Input label={`${player1} frames won`} value={score1} onChangeText={setScore1} placeholder="0" testID="input-score-p1" />
            <Input label={`${player2} frames won`} value={score2} onChangeText={setScore2} placeholder="0" testID="input-score-p2" />
            <Button title={match.isCompleted ? "Update result" : "Submit result"} onPress={handleScore} testID="btn-submit-score" />
          </Card>
        )}
        {!canEdit && !match.isCompleted ? <Text style={styles.notice}>Only match players or admins can edit.</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
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
  completedBanner: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
    padding: 12,
    marginBottom: 16,
  },
  completedText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  notice: {
    color: colors.textSecondary,
    marginTop: 12,
  },
});
