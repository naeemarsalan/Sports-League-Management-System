import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";

export const Card = ({ children, style, highlight = false, glow = false }) => {
  return (
    <View
      style={[
        styles.container,
        highlight && styles.highlight,
        glow && styles.glow,
        style,
      ]}
    >
      <View style={styles.clipWrapper}>
        <LinearGradient
          colors={highlight ? [colors.cardHighlight, colors.card] : colors.gradientCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          {children}
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  clipWrapper: {
    borderRadius: 17,
    overflow: "hidden",
  },
  gradient: {
    padding: 16,
  },
  highlight: {
    borderColor: colors.borderAccent,
  },
  glow: {
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
});
