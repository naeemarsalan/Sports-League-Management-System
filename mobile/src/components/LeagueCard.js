import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors } from "../theme/colors";

export const LeagueCard = ({
  league,
  membership,
  onPress,
  showMemberCount = true,
  showRole = true,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const getRoleBadge = () => {
    if (!membership || !showRole) return null;

    const roleConfig = {
      owner: { label: "Owner", color: colors.gold },
      admin: { label: "Admin", color: colors.accent },
      mod: { label: "Mod", color: colors.info },
      player: { label: "Player", color: colors.textSecondary },
    };

    const config = roleConfig[membership.role] || roleConfig.player;

    return (
      <View style={[styles.roleBadge, { backgroundColor: `${config.color}20` }]}>
        <Text style={[styles.roleText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <LinearGradient
        colors={colors.gradientGreen}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="ellipse" size={28} color="rgba(255,255,255,0.4)" />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {league.name}
            </Text>
            {league.description ? (
              <Text style={styles.description} numberOfLines={1}>
                {league.description}
              </Text>
            ) : null}
          </View>
          {getRoleBadge()}
        </View>

        {showMemberCount && (
          <View style={styles.footer}>
            <View style={styles.stat}>
              <Ionicons name="people" size={16} color={colors.textSecondary} />
              <Text style={styles.statText}>
                {league.memberCount || 0} members
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
};

export const LeagueCardCompact = ({ league, onPress, isSelected }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.compactContainer, isSelected && styles.compactSelected]}
    >
      <View style={styles.compactIcon}>
        <Ionicons
          name="ellipse"
          size={20}
          color={isSelected ? colors.accent : colors.textMuted}
        />
      </View>
      <Text
        style={[styles.compactName, isSelected && styles.compactNameSelected]}
        numberOfLines={1}
      >
        {league.name}
      </Text>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "600",
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginLeft: 6,
  },
  // Compact styles
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSubtle,
  },
  compactIcon: {
    marginRight: 12,
  },
  compactName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "500",
  },
  compactNameSelected: {
    color: colors.accent,
  },
});
