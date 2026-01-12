import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { createMatch } from "../lib/matches";
import { listProfiles } from "../lib/profiles";
import { colors } from "../theme/colors";
import { useAuthStore } from "../state/useAuthStore";

export const ChallengeScreen = ({ navigation }) => {
  const { profile } = useAuthStore();
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: listProfiles,
  });

  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [weekCommencing, setWeekCommencing] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [creating, setCreating] = useState(false);

  // Filter out current user from opponents list
  const opponents = profiles.filter((p) => p.$id !== profile?.$id);

  const handleSelectOpponent = (opponent) => {
    Haptics.selectionAsync();
    setSelectedOpponent(opponent);
  };

  const handleChallenge = async () => {
    if (!selectedOpponent) {
      Alert.alert("Select opponent", "Please select a player to challenge.");
      return;
    }
    if (!weekCommencing) {
      Alert.alert("Select date", "Please enter the week commencing date.");
      return;
    }

    setCreating(true);
    try {
      await createMatch({
        player1Id: profile.$id,
        player2Id: selectedOpponent.$id,
        weekCommencing: new Date(weekCommencing).toISOString(),
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        isCompleted: false,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Challenge sent!",
        `Match created against ${selectedOpponent.displayName}`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Failed", error.message);
    } finally {
      setCreating(false);
    }
  };

  const renderOpponent = ({ item }) => {
    const isSelected = selectedOpponent?.$id === item.$id;
    return (
      <Pressable
        onPress={() => handleSelectOpponent(item)}
        style={[styles.opponentCard, isSelected && styles.opponentSelected]}
      >
        <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
          <Text style={styles.avatarText}>
            {item.displayName?.charAt(0)?.toUpperCase() || "?"}
          </Text>
        </View>
        <View style={styles.opponentInfo}>
          <Text style={[styles.opponentName, isSelected && styles.textSelected]}>
            {item.displayName}
          </Text>
          <Text style={styles.opponentRole}>{item.role}</Text>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <Screen scroll={false}>
      <SectionHeader
        title="Challenge Player"
        subtitle="Select an opponent and schedule your match"
      />

      <Text style={styles.sectionTitle}>Select Opponent</Text>
      <View style={styles.listContainer}>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading players...</Text>
        ) : opponents.length === 0 ? (
          <Text style={styles.emptyText}>No other players available</Text>
        ) : (
          <FlatList
            data={opponents}
            keyExtractor={(item) => item.$id}
            renderItem={renderOpponent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      <Card>
        <Input
          label="Week commencing (YYYY-MM-DD)"
          value={weekCommencing}
          onChangeText={setWeekCommencing}
          placeholder="2025-07-07"
        />
        <Input
          label="Scheduled time (optional, YYYY-MM-DD HH:MM)"
          value={scheduledAt}
          onChangeText={setScheduledAt}
          placeholder="2025-07-15 19:00"
        />
        <Button
          title={creating ? "Creating match..." : "Challenge!"}
          onPress={handleChallenge}
          disabled={creating || !selectedOpponent}
        />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  listContainer: {
    flex: 1,
    marginBottom: 16,
  },
  listContent: {
    gap: 8,
  },
  loadingText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 20,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 20,
  },
  opponentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  opponentSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSubtle,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarSelected: {
    backgroundColor: colors.accent,
  },
  avatarText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  opponentInfo: {
    flex: 1,
  },
  opponentName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  textSelected: {
    color: colors.accent,
  },
  opponentRole: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: "700",
  },
});
