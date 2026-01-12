import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { colors } from "../theme/colors";

const icons = {
  matches: "🏆",
  players: "👥",
  leaderboard: "📊",
  search: "🔍",
  error: "⚠️",
  empty: "📭",
};

export const EmptyState = ({
  icon = "empty",
  title,
  message,
  actionTitle,
  onAction,
}) => {
  const emoji = icons[icon] || icons.empty;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{emoji}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionTitle && onAction && (
        <View style={styles.actionContainer}>
          <Button title={actionTitle} onPress={onAction} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    minHeight: 200,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  actionContainer: {
    marginTop: 24,
    width: "100%",
    maxWidth: 200,
  },
});
