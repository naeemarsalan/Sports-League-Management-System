import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLeagueStore } from "../state/useLeagueStore";
import { LeagueCardCompact } from "./LeagueCard";
import { colors } from "../theme/colors";

export const LeaguePicker = ({ style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLeague, userLeagues, switchLeague } = useLeagueStore();

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(!isOpen);
  };

  const handleSelectLeague = async (leagueId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await switchLeague(leagueId);
    setIsOpen(false);
  };

  if (!currentLeague || userLeagues.length <= 1) {
    // Don't show picker if only one league
    return currentLeague ? (
      <View style={[styles.trigger, styles.triggerDisabled, style]}>
        <Ionicons name="ellipse" size={16} color={colors.textMuted} />
        <Text style={styles.triggerText} numberOfLines={1}>
          {currentLeague.name}
        </Text>
      </View>
    ) : null;
  }

  return (
    <>
      <Pressable onPress={handleToggle} style={[styles.trigger, style]}>
        <Ionicons name="ellipse" size={16} color={colors.accent} />
        <Text style={styles.triggerText} numberOfLines={1}>
          {currentLeague.name}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.textMuted}
        />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>Switch League</Text>
              <Pressable onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {userLeagues.map((league) => (
                <LeagueCardCompact
                  key={league.$id}
                  league={league}
                  isSelected={league.$id === currentLeague.$id}
                  onPress={() => handleSelectLeague(league.$id)}
                />
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 200,
  },
  triggerDisabled: {
    borderColor: colors.borderSubtle,
  },
  triggerText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
    marginHorizontal: 8,
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: colors.background,
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "600",
  },
  list: {
    padding: 16,
  },
});
