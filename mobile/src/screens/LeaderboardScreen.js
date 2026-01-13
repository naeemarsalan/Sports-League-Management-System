import React, { useEffect, useRef } from "react";
import { Animated, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
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
  if (rank === 1) return { bg: colors.goldGlow, border: colors.gold, text: colors.gold, trophy: "🥇" };
  if (rank === 2) return { bg: colors.silverGlow, border: colors.silver, text: colors.silver, trophy: "🥈" };
  if (rank === 3) return { bg: colors.bronzeGlow, border: colors.bronze, text: colors.bronze, trophy: "🥉" };
  return { bg: colors.surface, border: colors.border, text: colors.textSecondary, trophy: null };
};

const LeaderboardRow = ({ item, index, maxPoints }) => {
  const rank = index + 1;
  const rankStyle = getRankStyle(rank);
  const isTopThree = rank <= 3;
  const progressWidth = maxPoints > 0 ? (item.points / maxPoints) * 100 : 0;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.rowWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={isTopThree ? [rankStyle.bg, colors.surface] : [colors.surface, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.row,
          isTopThree && { borderColor: rankStyle.border, borderWidth: 1.5 },
          isTopThree && styles.topThreeRow,
        ]}
      >
        {/* Trophy or Rank Badge */}
        {rankStyle.trophy ? (
          <View style={styles.trophyContainer}>
            <Text style={styles.trophy}>{rankStyle.trophy}</Text>
          </View>
        ) : (
          <View style={[styles.rankBadge, { backgroundColor: rankStyle.bg }]}>
            <Text style={[styles.rank, { color: rankStyle.text }]}>{rank}</Text>
          </View>
        )}

        <Avatar name={item.name} size={isTopThree ? 48 : 40} rank={rank} />

        <View style={styles.nameWrap}>
          <Text style={[styles.name, isTopThree && { color: rankStyle.text, fontSize: 17 }]}>
            {item.name}
          </Text>
          <Text style={styles.meta}>
            {item.wins}W · {item.draws}D · {item.losses}L
          </Text>
          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progressWidth}%`,
                  backgroundColor: isTopThree ? rankStyle.border : colors.accent,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.pointsWrap}>
          <Text style={[styles.points, isTopThree && { color: rankStyle.text, fontSize: 24 }]}>
            {item.points}
          </Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export const LeaderboardScreen = () => {
  const { data = [], refetch, isFetching, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });

  const maxPoints = data.length > 0 ? data[0].points : 0;

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
      {data.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{data.length}</Text>
            <Text style={styles.statLabel}>Players</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{maxPoints}</Text>
            <Text style={styles.statLabel}>Top Score</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>
              {data.reduce((sum, p) => sum + p.wins + p.draws + p.losses, 0)}
            </Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
        </View>
      )}
      <FlatList
        data={data}
        keyExtractor={(item) => item.playerId}
        renderItem={({ item, index }) => (
          <LeaderboardRow item={item} index={index} maxPoints={maxPoints} />
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
    </Screen>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
  },
  statBadge: {
    alignItems: "center",
  },
  statValue: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 20,
  },
  rowWrapper: {
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  topThreeRow: {
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  trophyContainer: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  trophy: {
    fontSize: 28,
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
  progressContainer: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
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
});
