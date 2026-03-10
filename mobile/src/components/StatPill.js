import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export const StatPill = ({ label, value }) => {
  return (
    <View style={styles.pill}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  value: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
});
