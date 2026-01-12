import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MatchCard } from "../components/MatchCard";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { listMatches } from "../lib/matches";
import { listProfiles } from "../lib/profiles";
import { colors } from "../theme/colors";
import { useAuthStore } from "../state/useAuthStore";
import { Input } from "../components/Input";

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
    if (!weekCommencing) {
      return undefined;
    }
    const date = new Date(weekCommencing);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }
    return date.toISOString();
  }, [weekCommencing]);

  const { data: matches = [], refetch } = useQuery({
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

  return (
    <Screen>
      <SectionHeader title="Matches" subtitle="Track fixtures, schedule and score." />
      <View style={styles.filterRow}>
        {[
          { key: "all", label: "All" },
          { key: "upcoming", label: "Open" },
          { key: "completed", label: "Completed" },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => setStatus(item.key)}
            style={[styles.chip, status === item.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, status === item.key && styles.chipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.filterRow}>
        {[
          { key: "all", label: "All matches" },
          { key: "mine", label: "My matches" },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => setScope(item.key)}
            style={[styles.chip, scope === item.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, scope === item.key && styles.chipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Input
        label="Week commencing (YYYY-MM-DD)"
        value={weekCommencing}
        onChangeText={setWeekCommencing}
        placeholder="2025-07-07"
      />
      <TouchableOpacity onPress={refetch} style={styles.refresh}>
        <Text style={styles.refreshText}>Refresh list</Text>
      </TouchableOpacity>
      {matches.length === 0 ? (
        <Text style={styles.empty}>No matches found.</Text>
      ) : (
        matches.map((match) => (
          <TouchableOpacity
            key={match.$id}
            onPress={() => navigation.navigate("MatchDetail", { match, playersById })}
          >
            <MatchCard match={match} playersById={playersById} />
          </TouchableOpacity>
        ))
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: "rgba(33, 197, 93, 0.15)",
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  chipTextActive: {
    color: colors.accent,
  },
  empty: {
    color: colors.textSecondary,
    marginTop: 20,
  },
  refresh: {
    marginBottom: 8,
  },
  refreshText: {
    color: colors.accent,
  },
});
