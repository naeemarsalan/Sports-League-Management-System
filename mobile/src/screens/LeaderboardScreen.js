import React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { EmptyState } from "../components/EmptyState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { fetchLeaderboard } from "../lib/leaderboard";
import { useLeagueStore } from "../state/useLeagueStore";
import { colors } from "../theme/colors";

const TableHeader = () => (
  <View style={styles.tableHeader}>
    <Text style={[styles.headerCell, styles.rankCol]}>RANK</Text>
    <Text style={[styles.headerCell, styles.playerCol]}>PLAYER</Text>
    <Text style={[styles.headerCell, styles.statCol]}>W</Text>
    <Text style={[styles.headerCell, styles.statCol]}>L</Text>
    <Text style={[styles.headerCell, styles.ptsCol]}>PTS</Text>
  </View>
);

const LeaderboardRow = ({ item, index }) => {
  const rank = index + 1;
  const isFirst = rank === 1;

  return (
    <View style={[styles.tableRow, isFirst && styles.firstRow]}>
      {/* Rank */}
      <View style={[styles.cell, styles.rankCol]}>
        {isFirst ? (
          <Ionicons name="trophy" size={18} color={colors.gold} />
        ) : (
          <Text style={styles.rankText}>{rank}</Text>
        )}
      </View>

      {/* Player Name */}
      <View style={[styles.cell, styles.playerCol]}>
        <Text style={[styles.playerName, isFirst && styles.firstPlayerName]} numberOfLines={1}>
          {item.name}
        </Text>
      </View>

      {/* Wins */}
      <View style={[styles.cell, styles.statCol]}>
        <Text style={styles.statText}>{item.wins}</Text>
      </View>

      {/* Losses */}
      <View style={[styles.cell, styles.statCol]}>
        <Text style={styles.statText}>{item.losses}</Text>
      </View>

      {/* Points */}
      <View style={[styles.cell, styles.ptsCol]}>
        <Text style={[styles.ptsText, isFirst && styles.firstPts]}>{item.points}</Text>
      </View>
    </View>
  );
};

export const LeaderboardScreen = () => {
  const { currentLeagueId, currentLeague } = useLeagueStore();

  const { data = [], refetch, isFetching, isLoading, isError, error } = useQuery({
    queryKey: ["leaderboard", currentLeagueId],
    queryFn: () => fetchLeaderboard(currentLeagueId),
    retry: 2,
    enabled: !!currentLeagueId,
  });

  // Log for debugging
  if (isError) {
    console.error("Leaderboard query error:", error);
  }

  if (isLoading) {
    return (
      <Screen scroll={false}>
        <Text style={styles.screenTitle}>STANDINGS</Text>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={{ paddingBottom: 0 }}>
      <Text style={styles.screenTitle}>STANDINGS</Text>

      <View style={styles.tableContainer}>
        <TableHeader />
        <FlatList
          data={data}
          keyExtractor={(item, index) => item.playerId || `row-${index}`}
          renderItem={({ item, index }) => (
            <LeaderboardRow item={item} index={index} />
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
              icon="leaderboard"
              title="No standings yet"
              message="Complete some matches to see the leaderboard."
            />
          }
        />
      </View>
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
  tableContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  headerCell: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  firstRow: {
    backgroundColor: colors.surfaceAlt,
  },
  cell: {
    justifyContent: "center",
  },
  rankCol: {
    width: 50,
  },
  playerCol: {
    flex: 1,
    paddingRight: 8,
  },
  statCol: {
    width: 40,
    alignItems: "center",
  },
  ptsCol: {
    width: 50,
    alignItems: "flex-end",
  },
  rankText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  playerName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "500",
  },
  firstPlayerName: {
    color: colors.gold,
    fontWeight: "600",
  },
  statText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  ptsText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "700",
  },
  firstPts: {
    color: colors.gold,
  },
  listContent: {
    paddingBottom: 20,
  },
});
