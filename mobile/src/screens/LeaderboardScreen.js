import React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { Avatar } from "../components/Avatar";
import { EmptyState } from "../components/EmptyState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { fetchLeaderboard } from "../lib/leaderboard";
import { colors } from "../theme/colors";

const getRankStyle = (rank) => {
  if (rank === 1) return { bg: colors.goldGlow, border: colors.gold, text: colors.gold };
  if (rank === 2) return { bg: colors.silverGlow, border: colors.silver, text: colors.silver };
  if (rank === 3) return { bg: colors.bronzeGlow, border: colors.bronze, text: colors.bronze };
  return { bg: colors.surface, border: colors.border, text: colors.textSecondary };
};

const LeaderboardRow = ({ item, index }) => {
  const rank = index + 1;
  const rankStyle = getRankStyle(rank);
  const isTopThree = rank <= 3;

  return (
    <LinearGradient
      colors={isTopThree ? [rankStyle.bg, colors.surface] : [colors.surface, colors.surface]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.row,
        isTopThree && { borderColor: rankStyle.border, borderWidth: 1 },
      ]}
    >
      <View style={[styles.rankBadge, { backgroundColor: rankStyle.bg }]}>
        <Text style={[styles.rank, { color: rankStyle.text }]}>{rank}</Text>
      </View>
      <Avatar name={item.name} size={40} rank={rank} />
      <View style={styles.nameWrap}>
        <Text style={[styles.name, isTopThree && { color: rankStyle.text }]}>
          {item.name}
        </Text>
        <Text style={styles.meta}>
          {item.wins}W · {item.draws}D · {item.losses}L
        </Text>
      </View>
      <View style={styles.pointsWrap}>
        <Text style={[styles.points, isTopThree && { color: rankStyle.text }]}>
          {item.points}
        </Text>
        <Text style={styles.pointsLabel}>pts</Text>
      </View>
    </LinearGradient>
  );
};

export const LeaderboardScreen = () => {
  const { data = [], refetch, isFetching, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });

  if (isLoading) {
    return (
      <Screen scroll={false}>
        <SectionHeader title="Leaderboard" subtitle="Live standings across the league." />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={{ paddingBottom: 0 }}>
      <SectionHeader title="Leaderboard" subtitle="Live standings across the league." />
      <FlatList
        data={data}
        keyExtractor={(item) => item.playerId}
        renderItem={({ item, index }) => <LeaderboardRow item={item} index={index} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    </Screen>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rank: {
    fontWeight: "800",
    fontSize: 14,
  },
  nameWrap: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 16,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  pointsWrap: {
    alignItems: "flex-end",
  },
  points: {
    color: colors.accent,
    fontWeight: "800",
    fontSize: 20,
  },
  pointsLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: -2,
  },
  separator: {
    height: 10,
  },
});
