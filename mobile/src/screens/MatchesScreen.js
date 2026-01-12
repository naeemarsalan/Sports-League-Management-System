import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { MatchCard } from "../components/MatchCard";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { EmptyState } from "../components/EmptyState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Input } from "../components/Input";
import { listMatches } from "../lib/matches";
import { listProfiles } from "../lib/profiles";
import { colors } from "../theme/colors";
import { useAuthStore } from "../state/useAuthStore";

const FilterChip = ({ label, active, onPress }) => (
  <Pressable
    onPress={() => {
      Haptics.selectionAsync();
      onPress();
    }}
    style={[styles.chip, active && styles.chipActive]}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>
      {label}
    </Text>
  </Pressable>
);

export const MatchesScreen = ({ navigation }) => {
  const { profile } = useAuthStore();
  const [status, setStatus] = useState("all");
  const [scope, setScope] = useState("all");
  const [weekCommencing, setWeekCommencing] = useState("");

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: listProfiles,
  });

  const playerFilter = scope === "mine" ? profile?.$id : undefined;
  const statusFilter = status === "all" ? undefined : status;
  const weekFilter = useMemo(() => {
    if (!weekCommencing) return undefined;
    const date = new Date(weekCommencing);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString();
  }, [weekCommencing]);

  const {
    data: matches = [],
    refetch,
    isFetching,
    isLoading,
  } = useQuery({
    queryKey: ["matches", statusFilter, playerFilter, weekFilter],
    queryFn: () =>
      listMatches({
        status: statusFilter,
        playerId: playerFilter,
        weekCommencing: weekFilter,
      }),
  });

  const playersById = useMemo(() => {
    return profiles.reduce((acc, profileItem) => {
      acc[profileItem.$id] = profileItem;
      return acc;
    }, {});
  }, [profiles]);

  const renderMatch = ({ item }) => (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        navigation.navigate("MatchDetail", { match: item, playersById });
      }}
    >
      <MatchCard match={item} playersById={playersById} />
    </Pressable>
  );

  const ListHeader = () => (
    <View>
      <View style={styles.filterRow}>
        {[
          { key: "all", label: "All" },
          { key: "upcoming", label: "Open" },
          { key: "completed", label: "Completed" },
        ].map((item) => (
          <FilterChip
            key={item.key}
            label={item.label}
            active={status === item.key}
            onPress={() => setStatus(item.key)}
          />
        ))}
      </View>
      <View style={styles.filterRow}>
        {[
          { key: "all", label: "All matches" },
          { key: "mine", label: "My matches" },
        ].map((item) => (
          <FilterChip
            key={item.key}
            label={item.label}
            active={scope === item.key}
            onPress={() => setScope(item.key)}
          />
        ))}
      </View>
      <Input
        label="Week commencing (YYYY-MM-DD)"
        value={weekCommencing}
        onChangeText={setWeekCommencing}
        placeholder="2025-07-07"
      />
    </View>
  );

  if (isLoading) {
    return (
      <Screen scroll={false}>
        <SectionHeader title="Matches" subtitle="Track fixtures, schedule and score." />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={{ paddingBottom: 0 }}>
      <SectionHeader title="Matches" subtitle="Track fixtures, schedule and score." />
      <FlatList
        data={matches}
        keyExtractor={(item) => item.$id}
        renderItem={renderMatch}
        ListHeaderComponent={ListHeader}
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
            message="Try adjusting your filters or create a new match."
            actionTitle="Challenge Player"
            onAction={() => navigation.navigate("Challenge")}
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
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSubtle,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  chipTextActive: {
    color: colors.accent,
    fontWeight: "600",
  },
});
