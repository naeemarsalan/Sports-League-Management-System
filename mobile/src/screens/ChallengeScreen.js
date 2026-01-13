import React, { useState, useMemo } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { EmptyState } from "../components/EmptyState";
import { createMatch } from "../lib/matches";
import { getLeagueMemberProfiles } from "../lib/members";
import { colors } from "../theme/colors";
import { useAuthStore } from "../state/useAuthStore";
import { useLeagueStore } from "../state/useLeagueStore";

export const ChallengeScreen = ({ navigation }) => {
  const { profile } = useAuthStore();
  const { currentLeagueId, currentLeague } = useLeagueStore();

  const { data: leagueProfiles = [], isLoading } = useQuery({
    queryKey: ["leagueProfiles", currentLeagueId],
    queryFn: () => getLeagueMemberProfiles(currentLeagueId),
    enabled: !!currentLeagueId,
  });

  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [weekCommencing, setWeekCommencing] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [creating, setCreating] = useState(false);

  // Filter out current user and apply search filter
  const opponents = useMemo(() => {
    return leagueProfiles
      .filter((p) => p.$id !== profile?.$id)
      .filter((p) =>
        p.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [leagueProfiles, profile, searchQuery]);

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
      await createMatch(
        {
          player1Id: profile.$id,
          player2Id: selectedOpponent.$id,
          leagueId: currentLeagueId,
          weekCommencing: new Date(weekCommencing).toISOString(),
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          isCompleted: false,
        },
        profile.displayName // Pass challenger name for push notification
      );
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
          <Text style={styles.opponentRole}>
            {item.membership?.role || item.role}
          </Text>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </Pressable>
    );
  };

  // Show empty state if no league selected
  if (!currentLeagueId) {
    return (
      <Screen>
        <EmptyState
          icon="people"
          title="No League Selected"
          message="Join or create a league before challenging players."
          actionTitle="Go to Leagues"
          onAction={() => navigation.navigate("Leagues")}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <SectionHeader
        title="Challenge Player"
        subtitle={currentLeague?.name ? `In ${currentLeague.name}` : "Select an opponent and schedule your match"}
      />

      <Text style={styles.sectionTitle}>Select Opponent</Text>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search players..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>×</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.listContainer}>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading players...</Text>
        ) : opponents.length === 0 ? (
          <Text style={styles.emptyText}>
            {searchQuery
              ? "No players match your search"
              : "No other players in this league"}
          </Text>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: "600",
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
    textTransform: "capitalize",
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
