import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Screen } from "../components/Screen";
import { EmptyState } from "../components/EmptyState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { listMatches, deleteMatch } from "../lib/matches";
import { listProfiles } from "../lib/profiles";
import { colors } from "../theme/colors";
import { useAuthStore } from "../state/useAuthStore";
import { useLeagueStore } from "../state/useLeagueStore";

const PillTab = ({ label, active, onPress }) => (
  <Pressable
    onPress={() => {
      Haptics.selectionAsync();
      onPress();
    }}
    style={[styles.pillTab, active && styles.pillTabActive]}
  >
    <Text style={[styles.pillTabText, active && styles.pillTabTextActive]}>
      {label}
    </Text>
  </Pressable>
);

const MatchRow = ({ match, playersById, onPress, onDelete, canDelete }) => {
  const player1 = playersById[match.player1Id]?.displayName ?? "Player 1";
  const player2 = playersById[match.player2Id]?.displayName ?? "Player 2";
  const hasScore = match.scorePlayer1 !== null && match.scorePlayer2 !== null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Pressable onPress={onPress} style={styles.matchRow} testID="match-row">
      <View style={styles.matchInfo}>
        <Text style={styles.matchPlayers}>
          {player1} <Text style={styles.vsText}>vs.</Text>
        </Text>
        <Text style={styles.matchPlayers}>{player2}</Text>
        <Text style={styles.matchDate}>{formatDate(match.weekCommencing)}</Text>
      </View>

      <View style={styles.matchResult}>
        {match.isCompleted && hasScore ? (
          <View style={styles.resultBadge}>
            <Text style={styles.resultText}>
              FRAMES: {match.scorePlayer1}-{match.scorePlayer2}
            </Text>
          </View>
        ) : canDelete ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
};

export const MatchesScreen = ({ navigation }) => {
  const { profile } = useAuthStore();
  const { currentLeagueId, currentLeague } = useLeagueStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("upcoming");

  const canDeleteMatch = (match) => {
    if (!profile) return false;
    return profile.role === "admin" || profile.$id === match.player1Id || profile.$id === match.player2Id;
  };

  const handleDelete = (matchId) => {
    Alert.alert("Delete match?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMatch(matchId);
            queryClient.invalidateQueries(["matches"]);
          } catch (error) {
            console.error("deleteMatch failed:", error);
            Alert.alert("Error", error.message || "Failed to delete match.");
          }
        },
      },
    ]);
  };

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: listProfiles,
  });

  const statusFilter = tab === "upcoming" ? "upcoming" : "completed";

  const {
    data: matches = [],
    refetch,
    isFetching,
    isLoading,
  } = useQuery({
    queryKey: ["matches", statusFilter, currentLeagueId],
    queryFn: () => listMatches({ leagueId: currentLeagueId, status: statusFilter }),
    enabled: !!currentLeagueId,
  });

  const playersById = useMemo(() => {
    return profiles.reduce((acc, profileItem) => {
      acc[profileItem.$id] = profileItem;
      return acc;
    }, {});
  }, [profiles]);

  if (isLoading) {
    return (
      <Screen scroll={false}>
        <Text style={styles.screenTitle}>MATCHES</Text>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={{ paddingBottom: 0 }}>
      <Text style={styles.screenTitle}>MATCHES</Text>

      {/* Pill Tabs */}
      <View style={styles.pillContainer}>
        <PillTab
          label="Upcoming"
          active={tab === "upcoming"}
          onPress={() => setTab("upcoming")}
        />
        <PillTab
          label="Past"
          active={tab === "past"}
          onPress={() => setTab("past")}
        />
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <MatchRow
            match={item}
            playersById={playersById}
            canDelete={canDeleteMatch(item)}
            onDelete={() => handleDelete(item.$id)}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate("MatchDetail", { match: item, playersById });
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="matches"
            title="No matches found"
            message={tab === "upcoming" ? "No upcoming matches scheduled." : "No completed matches yet."}
            actionTitle="Challenge Player"
            onAction={() => navigation.navigate("Challenge")}
          />
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  screenTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pillContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
  },
  pillTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 22,
    alignItems: "center",
  },
  pillTabActive: {
    backgroundColor: colors.surfaceAlt,
  },
  pillTabText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "500",
  },
  pillTabTextActive: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 20,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  matchInfo: {
    flex: 1,
  },
  matchPlayers: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  vsText: {
    color: colors.textMuted,
    fontWeight: "400",
  },
  matchDate: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  matchResult: {
    marginLeft: 12,
  },
  resultBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  resultText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: "700",
  },
});
