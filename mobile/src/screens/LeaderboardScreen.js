import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { fetchLeaderboard } from "../lib/leaderboard";
import { colors } from "../theme/colors";

export const LeaderboardScreen = () => {
  const { data = [], refetch, isFetching } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });

  return (
    <Screen scroll={false} style={{ paddingBottom: 20 }}>
      <SectionHeader title="Leaderboard" subtitle="Live standings across the league." />
      <Text style={styles.refresh} onPress={refetch}>
        {isFetching ? "Refreshing..." : "Pull to refresh"}
      </Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.playerId}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>{index + 1}</Text>
            <View style={styles.nameWrap}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>W {item.wins} · D {item.draws} · L {item.losses}</Text>
            </View>
            <Text style={styles.points}>{item.points} pts</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  refresh: {
    color: colors.accent,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
  },
  rank: {
    color: colors.textSecondary,
    width: 24,
    fontWeight: "600",
  },
  nameWrap: {
    flex: 1,
    marginLeft: 6,
  },
  name: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 16,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  points: {
    color: colors.accent,
    fontWeight: "700",
  },
  separator: {
    height: 10,
  },
});
