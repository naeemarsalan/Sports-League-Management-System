import React, { useState, useCallback } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { RoleBadge } from "../components/RoleBadge";
import { EmptyState } from "../components/EmptyState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useLeagueStore, ACTIONS } from "../state/useLeagueStore";
import { useAuthStore } from "../state/useAuthStore";
import {
  getLeagueMembers,
  approveMember,
  rejectMember,
  updateMemberRole,
  removeMember,
  hasPermission,
} from "../lib/members";
import { getProfileByUserId } from "../lib/profiles";
import { colors } from "../theme/colors";

const TAB_MEMBERS = "members";
const TAB_PENDING = "pending";

export const LeagueMembersScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState(TAB_MEMBERS);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { currentLeague, currentLeagueId, currentMembership, canPerform } = useLeagueStore();

  const canManageMembers = canPerform(ACTIONS.APPROVE_MEMBERS);

  // Fetch members
  const {
    data: members = [],
    refetch: refetchMembers,
    isFetching,
    isLoading,
  } = useQuery({
    queryKey: ["leagueMembers", currentLeagueId, activeTab],
    queryFn: async () => {
      const status = activeTab === TAB_PENDING ? "pending" : "approved";
      const memberships = await getLeagueMembers(currentLeagueId, status);

      // Fetch profiles for each member
      const membersWithProfiles = await Promise.all(
        memberships.map(async (membership) => {
          try {
            const profile = await getProfileByUserId(membership.userId);
            return { ...membership, profile };
          } catch {
            return { ...membership, profile: null };
          }
        })
      );

      return membersWithProfiles;
    },
    enabled: !!currentLeagueId,
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (membershipId) => approveMember(membershipId, currentLeague?.name),
    onSuccess: () => {
      queryClient.invalidateQueries(["leagueMembers"]);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (membershipId) => rejectMember(membershipId, currentLeague?.name),
    onSuccess: () => {
      queryClient.invalidateQueries(["leagueMembers"]);
    },
  });

  const handleApprove = (member) => {
    Alert.alert(
      "Approve Member",
      `Approve ${member.profile?.displayName || "this user"} to join the league?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () => approveMutation.mutate(member.$id),
        },
      ]
    );
  };

  const handleReject = (member) => {
    Alert.alert(
      "Reject Request",
      `Reject ${member.profile?.displayName || "this user"}'s request to join?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => rejectMutation.mutate(member.$id),
        },
      ]
    );
  };

  const handleRoleChange = (member) => {
    if (!canPerform(ACTIONS.PROMOTE_TO_MOD)) return;

    const options = [];

    // Can always demote to player
    if (member.role !== "player") {
      options.push({
        text: "Player",
        onPress: () => updateMemberRole(member.$id, "player").then(() => refetchMembers()),
      });
    }

    // Can promote to mod if admin or higher
    if (member.role !== "mod" && canPerform(ACTIONS.PROMOTE_TO_MOD)) {
      options.push({
        text: "Moderator",
        onPress: () => updateMemberRole(member.$id, "mod").then(() => refetchMembers()),
      });
    }

    // Only owner can promote to admin
    if (member.role !== "admin" && canPerform(ACTIONS.PROMOTE_TO_ADMIN)) {
      options.push({
        text: "Admin",
        onPress: () => updateMemberRole(member.$id, "admin").then(() => refetchMembers()),
      });
    }

    options.push({ text: "Cancel", style: "cancel" });

    Alert.alert(
      "Change Role",
      `Select a new role for ${member.profile?.displayName}`,
      options
    );
  };

  const handleRemove = (member) => {
    if (member.role === "owner") {
      Alert.alert("Cannot Remove", "The owner cannot be removed from the league.");
      return;
    }

    Alert.alert(
      "Remove Member",
      `Remove ${member.profile?.displayName || "this user"} from the league?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMember(member.$id);
              refetchMembers();
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const renderMember = ({ item: member }) => {
    const isCurrentUser = member.userId === user.$id;
    const canEditThisMember =
      canManageMembers &&
      !isCurrentUser &&
      member.role !== "owner" &&
      (currentMembership?.role === "owner" ||
        (currentMembership?.role === "admin" && member.role === "player") ||
        (currentMembership?.role === "admin" && member.role === "mod"));

    return (
      <View style={styles.memberRow}>
        <View style={styles.memberInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={colors.textMuted} />
          </View>
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>
              {member.profile?.displayName || "Unknown User"}
              {isCurrentUser && (
                <Text style={styles.youBadge}> (You)</Text>
              )}
            </Text>
            <RoleBadge role={member.role} size="small" />
          </View>
        </View>

        {activeTab === TAB_PENDING ? (
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleApprove(member)}
              disabled={approveMutation.isPending}
              testID="btn-approve-member"
            >
              <Ionicons name="checkmark" size={20} color={colors.success} />
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleReject(member)}
              disabled={rejectMutation.isPending}
            >
              <Ionicons name="close" size={20} color={colors.danger} />
            </Pressable>
          </View>
        ) : canEditThisMember ? (
          <Pressable
            style={styles.moreBtn}
            testID="btn-member-actions"
            onPress={() => {
              Alert.alert(
                member.profile?.displayName || "Member",
                "Choose an action",
                [
                  { text: "Change Role", onPress: () => handleRoleChange(member) },
                  {
                    text: "Report Concern",
                    onPress: () =>
                      Linking.openURL(
                        `mailto:support@snookerpoolleague.co.uk?subject=${encodeURIComponent(
                          `Report: ${member.profile?.displayName || "User"} in ${currentLeague?.name || "league"}`
                        )}`
                      ),
                  },
                  {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => handleRemove(member),
                  },
                  { text: "Cancel", style: "cancel" },
                ]
              );
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
          </Pressable>
        ) : !isCurrentUser ? (
          <Pressable
            style={styles.moreBtn}
            onPress={() => {
              Alert.alert(
                member.profile?.displayName || "Member",
                "Choose an action",
                [
                  {
                    text: "Report Concern",
                    onPress: () =>
                      Linking.openURL(
                        `mailto:support@snookerpoolleague.co.uk?subject=${encodeURIComponent(
                          `Report: ${member.profile?.displayName || "User"} in ${currentLeague?.name || "league"}`
                        )}`
                      ),
                  },
                  { text: "Cancel", style: "cancel" },
                ]
              );
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    );
  };

  const pendingCount = activeTab === TAB_MEMBERS ? 0 : members.length;

  return (
    <Screen scroll={false} edges={[]}>
      <SectionHeader title="Members" subtitle={`${members.length} ${activeTab === TAB_PENDING ? "pending" : "members"}`} />

      {/* Tabs */}
      {canManageMembers && (
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === TAB_MEMBERS && styles.tabActive]}
            onPress={() => setActiveTab(TAB_MEMBERS)}
            testID="tab-members"
          >
            <Text
              style={[
                styles.tabText,
                activeTab === TAB_MEMBERS && styles.tabTextActive,
              ]}
            >
              Members
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === TAB_PENDING && styles.tabActive]}
            onPress={() => setActiveTab(TAB_PENDING)}
            testID="tab-pending"
          >
            <Text
              style={[
                styles.tabText,
                activeTab === TAB_PENDING && styles.tabTextActive,
              ]}
            >
              Pending
            </Text>
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.$id}
          renderItem={renderMember}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetchMembers}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={activeTab === TAB_PENDING ? "hourglass" : "people"}
              title={
                activeTab === TAB_PENDING
                  ? "No pending requests"
                  : "No members yet"
              }
              message={
                activeTab === TAB_PENDING
                  ? "Share your invite code to get members"
                  : "Members will appear here once approved"
              }
            />
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    marginBottom: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingBottom: 20,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
  youBadge: {
    color: colors.textMuted,
    fontWeight: "400",
  },
  actions: {
    flexDirection: "row",
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  approveBtn: {
    backgroundColor: colors.successSubtle,
  },
  rejectBtn: {
    backgroundColor: colors.dangerSubtle,
  },
  moreBtn: {
    padding: 8,
  },
});
