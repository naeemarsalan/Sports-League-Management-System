import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export const ROLE_CONFIG = {
  owner: {
    label: "Owner",
    color: colors.gold,
    icon: "star",
  },
  admin: {
    label: "Admin",
    color: colors.accent,
    icon: "shield-checkmark",
  },
  mod: {
    label: "Mod",
    color: colors.info,
    icon: "shield-half",
  },
  player: {
    label: "Player",
    color: colors.textSecondary,
    icon: "person",
  },
};

export const RoleBadge = ({ role, size = "medium", showIcon = true }) => {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.player;

  const isSmall = size === "small";
  const isLarge = size === "large";

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${config.color}20` },
        isSmall && styles.badgeSmall,
        isLarge && styles.badgeLarge,
      ]}
    >
      {showIcon && (
        <Ionicons
          name={config.icon}
          size={isSmall ? 10 : isLarge ? 16 : 12}
          color={config.color}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.label,
          { color: config.color },
          isSmall && styles.labelSmall,
          isLarge && styles.labelLarge,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeLarge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  labelSmall: {
    fontSize: 10,
  },
  labelLarge: {
    fontSize: 14,
  },
});
