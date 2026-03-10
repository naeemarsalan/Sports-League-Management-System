import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { LeagueCard } from "../components/LeagueCard";
import { EmptyState } from "../components/EmptyState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useLeagueStore } from "../state/useLeagueStore";
import { useAuthStore } from "../state/useAuthStore";
import { listLeagues } from "../lib/leagues";
import { colors } from "../theme/colors";

const TAB_MY_LEAGUES = "my";
const TAB_BROWSE = "browse";

export const LeaguesScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState(TAB_MY_LEAGUES);
  const { user } = useAuthStore();
  const {
    userLeagues,
    userMemberships,
    fetchUserLeagues,
    setCurrentLeague,
    loading: storeLoading,
  } = useLeagueStore();

  // Fetch browse leagues
  const {
    data: allLeagues = [],
    refetch: refetchAllLeagues,
    isFetching: fetchingAll,
    isLoading: loadingAll,
  } = useQuery({
    queryKey: ["allLeagues"],
    queryFn: listLeagues,
    enabled: activeTab === TAB_BROWSE,
  });

  const handleRefresh = async () => {
    if (activeTab === TAB_MY_LEAGUES) {
      await fetchUserLeagues(user.$id);
    } else {
      await refetchAllLeagues();
    }
  };

  const handleLeaguePress = async (league) => {
    if (activeTab === TAB_MY_LEAGUES) {
      await setCurrentLeague(league.$id);
      navigation.navigate("Main");
    } else {
      // Navigate to league details for joining
      navigation.navigate("LeagueDetail", { leagueId: league.$id });
    }
  };

  const getMembershipForLeague = (leagueId) => {
    return userMemberships.find((m) => m.leagueId === leagueId);
  };

  const renderLeague = ({ item }) => (
    <LeagueCard
      league={item}
      membership={
        activeTab === TAB_MY_LEAGUES ? getMembershipForLeague(item.$id) : null
      }
      onPress={() => handleLeaguePress(item)}
      showRole={activeTab === TAB_MY_LEAGUES}
    />
  );

  const leagues = activeTab === TAB_MY_LEAGUES ? userLeagues : allLeagues;
  const isLoading = activeTab === TAB_MY_LEAGUES ? storeLoading : loadingAll;
  const isFetching = activeTab === TAB_MY_LEAGUES ? storeLoading : fetchingAll;

  return (
    <Screen scroll={false} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Leagues</Text>
        <Pressable
          style={styles.createButton}
          onPress={() => navigation.navigate("CreateLeague")}
        >
          <Ionicons name="add" size={24} color={colors.accent} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === TAB_MY_LEAGUES && styles.tabActive]}
          onPress={() => setActiveTab(TAB_MY_LEAGUES)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === TAB_MY_LEAGUES && styles.tabTextActive,
            ]}
          >
            My Leagues
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === TAB_BROWSE && styles.tabActive]}
          onPress={() => setActiveTab(TAB_BROWSE)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === TAB_BROWSE && styles.tabTextActive,
            ]}
          >
            Browse All
          </Text>
        </Pressable>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate("JoinLeague")}
        >
          <Ionicons name="key-outline" size={18} color={colors.accent} />
          <Text style={styles.actionText}>Enter Invite Code</Text>
        </Pressable>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} />
        </View>
      ) : (
        <FlatList
          data={leagues}
          keyExtractor={(item) => item.$id}
          renderItem={renderLeague}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={activeTab === TAB_MY_LEAGUES ? "people" : "search"}
              title={
                activeTab === TAB_MY_LEAGUES
                  ? "No leagues yet"
                  : "No leagues found"
              }
              message={
                activeTab === TAB_MY_LEAGUES
                  ? "Create a new league or join an existing one."
                  : "Be the first to create a league!"
              }
            />
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: colors.textInverse,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentSubtle,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 20,
    paddingTop: 16,
  },
});
