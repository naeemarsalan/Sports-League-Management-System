import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { Card } from "./Card";

export const MatchCard = ({ match, playersById }) => {
  const player1 = playersById[match.player1Id]?.displayName ?? "Player 1";
  const player2 = playersById[match.player2Id]?.displayName ?? "Player 2";
  const scoreAvailable = match.scorePlayer1 !== null && match.scorePlayer2 !== null;

  return (
    <Card>
      <View style={styles.row}>
        <Text style={styles.player}>{player1}</Text>
        <Text style={styles.vs}>vs</Text>
        <Text style={styles.player}>{player2}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaText}>Week: {match.weekCommencing?.slice(0, 10)}</Text>
        <Text style={styles.metaText}>
          {scoreAvailable
            ? `Score ${match.scorePlayer1} - ${match.scorePlayer2}`
            : "Awaiting score"}
        </Text>
      </View>
      <View style={styles.statusWrap}>
        <Text style={[styles.status, match.isCompleted ? styles.complete : styles.pending]}>
          {match.isCompleted ? "Completed" : "Open"}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  player: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 16,
  },
  vs: {
    color: colors.textMuted,
    fontSize: 12,
  },
  meta: {
    marginTop: 12,
  },
  metaText: {
    color: colors.textSecondary,
    marginBottom: 6,
  },
  statusWrap: {
    marginTop: 10,
    alignItems: "flex-start",
  },
  status: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "600",
  },
  complete: {
    backgroundColor: "rgba(33, 197, 93, 0.15)",
    color: colors.accent,
  },
  pending: {
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    color: colors.textSecondary,
  },
});
