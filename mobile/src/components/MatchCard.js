import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";
import { Card } from "./Card";
import { Avatar } from "./Avatar";

export const MatchCard = ({ match, playersById }) => {
  const player1 = playersById[match.player1Id]?.displayName ?? "Player 1";
  const player2 = playersById[match.player2Id]?.displayName ?? "Player 2";
  const scoreAvailable = match.scorePlayer1 != null && match.scorePlayer2 != null;

  // Determine winner for highlighting
  let player1Winner = false;
  let player2Winner = false;
  let isDraw = false;

  if (match.isCompleted && scoreAvailable) {
    if (match.scorePlayer1 > match.scorePlayer2) {
      player1Winner = true;
    } else if (match.scorePlayer2 > match.scorePlayer1) {
      player2Winner = true;
    } else {
      isDraw = true;
    }
  }

  // Format date nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return "TBD";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card highlight={match.isCompleted}>
      {/* Players Row with Avatars */}
      <View style={styles.playersRow}>
        {/* Player 1 */}
        <View style={styles.playerSection}>
          <Avatar name={player1} size={36} />
          <Text
            style={[
              styles.playerName,
              player1Winner && styles.winnerName,
            ]}
            numberOfLines={1}
          >
            {player1}
          </Text>
        </View>

        {/* VS Badge */}
        <View style={styles.vsContainer}>
          <LinearGradient
            colors={match.isCompleted ? colors.gradientAccent : [colors.surfaceAlt, colors.surface]}
            style={styles.vsBadge}
          >
            <Text style={[styles.vsText, match.isCompleted && styles.vsTextComplete]}>
              VS
            </Text>
          </LinearGradient>
        </View>

        {/* Player 2 */}
        <View style={[styles.playerSection, styles.playerSectionRight]}>
          <Text
            style={[
              styles.playerName,
              styles.playerNameRight,
              player2Winner && styles.winnerName,
            ]}
            numberOfLines={1}
          >
            {player2}
          </Text>
          <Avatar name={player2} size={36} />
        </View>
      </View>

      {/* Score Display */}
      {scoreAvailable && (
        <View style={styles.scoreRow}>
          <Text
            style={[
              styles.score,
              player1Winner && styles.winnerScore,
              isDraw && styles.drawScore,
            ]}
          >
            {match.scorePlayer1}
          </Text>
          <Text style={styles.scoreDivider}>-</Text>
          <Text
            style={[
              styles.score,
              player2Winner && styles.winnerScore,
              isDraw && styles.drawScore,
            ]}
          >
            {match.scorePlayer2}
          </Text>
        </View>
      )}

      {/* Meta Info Row */}
      <View style={styles.metaRow}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={styles.dateText}>{formatDate(match.weekCommencing)}</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusIcon}>
            {match.isCompleted ? "✓" : "⏳"}
          </Text>
          <Text
            style={[
              styles.statusText,
              match.isCompleted ? styles.statusComplete : styles.statusPending,
            ]}
          >
            {match.isCompleted ? "Completed" : "Open"}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  playersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playerSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  playerSectionRight: {
    justifyContent: "flex-end",
  },
  playerName: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 10,
    flex: 1,
  },
  playerNameRight: {
    marginLeft: 0,
    marginRight: 10,
    textAlign: "right",
  },
  winnerName: {
    color: colors.accent,
  },
  vsContainer: {
    paddingHorizontal: 8,
  },
  vsBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  vsText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  vsTextComplete: {
    color: colors.textPrimary,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
  },
  score: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.textSecondary,
    minWidth: 50,
    textAlign: "center",
  },
  winnerScore: {
    color: colors.accent,
  },
  drawScore: {
    color: colors.warning,
  },
  scoreDivider: {
    fontSize: 24,
    color: colors.textMuted,
    marginHorizontal: 8,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  statusComplete: {
    color: colors.accent,
  },
  statusPending: {
    color: colors.textMuted,
  },
});
