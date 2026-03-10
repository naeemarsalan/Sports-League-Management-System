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
import { DatePicker } from "../components/DatePicker";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { EmptyState } from "../components/EmptyState";
import { createMatch } from "../lib/matches";
import { getLeagueMemberProfiles } from "../lib/members";
import { colors } from "../theme/colors";
import { useAuthStore } from "../state/useAuthStore";
import { useLeagueStore, ACTIONS } from "../state/useLeagueStore";

/** Returns the next Monday from today (or today if it is Monday). */
const getNextMonday = () => {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const ChallengeScreen = ({ navigation }) => {
  const { profile } = useAuthStore();
  const { currentLeagueId, currentLeague, canPerform } = useLeagueStore();

  const { data: leagueProfiles = [], isLoading } = useQuery({
    queryKey: ["leagueProfiles", currentLeagueId],
    queryFn: () => getLeagueMemberProfiles(currentLeagueId),
    enabled: !!currentLeagueId,
  });

  const [step, setStep] = useState(1);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [weekCommencing, setWeekCommencing] = useState(getNextMonday());
  const [scheduledAt, setScheduledAt] = useState(null);
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
    setStep(2);
  };

  const handleChallenge = async () => {
    if (!selectedOpponent) {
      Alert.alert("Select opponent", "Please select a player to challenge.");
      return;
    }
    if (!weekCommencing) {
      Alert.alert("Select date", "Please pick the week commencing date.");
      return;
    }

    setCreating(true);
    try {
      await createMatch(
        {
          player1Id: profile.$id,
          player2Id: selectedOpponent.$id,
          leagueId: currentLeagueId,
          weekCommencing: weekCommencing.toISOString(),
          scheduledAt: scheduledAt
            ? new Date(
                weekCommencing.getFullYear(),
                weekCommencing.getMonth(),
                weekCommencing.getDate(),
                scheduledAt.getHours(),
                scheduledAt.getMinutes()
              ).toISOString()
            : null,
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

  // Permission check — only mod/admin/owner can challenge
  if (!canPerform(ACTIONS.CREATE_MATCH)) {
    return (
      <Screen>
        <EmptyState
          icon="lock-closed"
          title="Permission Denied"
          message="Only moderators and admins can schedule matches."
          actionTitle="Go Back"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

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

  /* ───── Step 2: Pick Dates & Confirm ───── */
  if (step === 2) {
    return (
      <Screen>
        <SectionHeader
          title="Schedule Match"
          subtitle={currentLeague?.name ? `In ${currentLeague.name}` : "Pick dates for the match"}
        />

        {/* Selected opponent summary */}
        <Card>
          <View style={styles.opponentSummary}>
            <View style={[styles.avatar, styles.avatarSelected]}>
              <Text style={styles.avatarText}>
                {selectedOpponent?.displayName?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
            <View style={styles.opponentInfo}>
              <Text style={styles.opponentName}>
                {selectedOpponent?.displayName}
              </Text>
              <Pressable onPress={() => setStep(1)}>
                <Text style={styles.changeLink}>Change opponent</Text>
              </Pressable>
            </View>
          </View>
        </Card>

        <Card>
          <DatePicker
            label="Week commencing"
            value={weekCommencing}
            onChange={setWeekCommencing}
            mode="date"
            placeholder="Select week..."
          />
          <DatePicker
            label="Scheduled time (optional)"
            value={scheduledAt}
            onChange={setScheduledAt}
            mode="time"
            placeholder="Pick a time..."
          />
          <View style={styles.buttonRow}>
            <Pressable onPress={() => setStep(1)} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
            <View style={styles.challengeButton}>
              <Button
                title={creating ? "Creating match..." : "Challenge!"}
                onPress={handleChallenge}
                disabled={creating}
                testID="btn-confirm-challenge"
              />
            </View>
          </View>
        </Card>
      </Screen>
    );
  }

  /* ───── Step 1: Select Opponent ───── */
  return (
    <Screen scroll={false}>
      <SectionHeader
        title="Challenge Player"
        subtitle={currentLeague?.name ? `In ${currentLeague.name}` : "Select an opponent"}
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

      {selectedOpponent && (
        <View style={styles.nextBar}>
          <Button title="Next" onPress={() => setStep(2)} testID="btn-create-match" />
        </View>
      )}
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
  opponentSummary: {
    flexDirection: "row",
    alignItems: "center",
  },
  changeLink: {
    color: colors.accent,
    fontSize: 13,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  challengeButton: {
    flex: 1,
  },
  nextBar: {
    paddingTop: 8,
  },
});
