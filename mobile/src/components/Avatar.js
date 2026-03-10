import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";

// Generate consistent color based on name
const getColorFromName = (name) => {
  const gradients = [
    [colors.accent, colors.accentDark],
    [colors.gold, "#d97706"],
    ["#3b82f6", "#1d4ed8"],
    ["#8b5cf6", "#6d28d9"],
    ["#ec4899", "#be185d"],
    ["#14b8a6", "#0d9488"],
  ];

  let hash = 0;
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return gradients[Math.abs(hash) % gradients.length];
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter((p) => p.length > 0);
  if (parts.length >= 2) {
    return (parts[0].trim()[0] + parts[parts.length - 1].trim()[0]).toUpperCase();
  }
  return name.trim().substring(0, 2).toUpperCase();
};

export const Avatar = ({
  name,
  size = 44,
  rank,
  showBorder = false,
}) => {
  const initials = getInitials(name);
  const gradient = getColorFromName(name);

  const getRankStyle = () => {
    if (rank === 1) return { borderColor: colors.gold, shadowColor: colors.goldGlow };
    if (rank === 2) return { borderColor: colors.silver, shadowColor: colors.silverGlow };
    if (rank === 3) return { borderColor: colors.bronze, shadowColor: colors.bronzeGlow };
    return {};
  };

  const rankStyle = getRankStyle();
  const fontSize = size * 0.4;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        showBorder && styles.border,
        rank != null && rank <= 3 && {
          borderWidth: 2,
          borderColor: rankStyle.borderColor,
          shadowColor: rankStyle.shadowColor,
          shadowOpacity: 0.8,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        },
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          { borderRadius: size / 2 - (rank != null && rank <= 3 ? 2 : 0) },
        ]}
      >
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      </LinearGradient>
      {rank != null && rank <= 3 && (
        <View
          style={[
            styles.rankBadge,
            {
              backgroundColor: rankStyle.borderColor,
              right: -2,
              bottom: -2,
            },
          ]}
        >
          <Text style={styles.rankText}>{rank}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "visible",
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  border: {
    borderWidth: 2,
    borderColor: colors.border,
  },
  initials: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  rankBadge: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: "800",
  },
});
