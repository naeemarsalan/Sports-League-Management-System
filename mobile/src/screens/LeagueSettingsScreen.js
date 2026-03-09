import React, { useState, useEffect } from "react";
import {
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Screen } from "../components/Screen";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { RoleBadge } from "../components/RoleBadge";
import { useLeagueStore, ACTIONS } from "../state/useLeagueStore";
import { useAuthStore } from "../state/useAuthStore";
import { updateLeague, regenerateInviteCode, deleteLeague, SCORING_DEFAULTS } from "../lib/leagues";
import { leaveLeague, getMembership } from "../lib/members";
import { colors } from "../theme/colors";

export const LeagueSettingsScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const {
    currentLeague,
    currentMembership,
    canPerform,
    refreshCurrentLeague,
    removeUserLeague,
    fetchUserLeagues,
  } = useLeagueStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [notifLimit, setNotifLimit] = useState((currentLeague?.notificationLimit || 50).toString());
  const [pointsPerWin, setPointsPerWin] = useState((currentLeague?.pointsPerWin ?? SCORING_DEFAULTS.pointsPerWin).toString());
  const [pointsPerDraw, setPointsPerDraw] = useState((currentLeague?.pointsPerDraw ?? SCORING_DEFAULTS.pointsPerDraw).toString());
  const [pointsPerLoss, setPointsPerLoss] = useState((currentLeague?.pointsPerLoss ?? SCORING_DEFAULTS.pointsPerLoss).toString());
  const [loading, setLoading] = useState(false);

  const canEdit = canPerform(ACTIONS.EDIT_LEAGUE_SETTINGS);
  const canDelete = canPerform(ACTIONS.DELETE_LEAGUE);
  const isOwner = currentMembership?.role === "owner";

  useEffect(() => {
    if (currentLeague) {
      setName(currentLeague.name);
      setDescription(currentLeague.description || "");
      setNotifLimit((currentLeague.notificationLimit || 50).toString());
      setPointsPerWin((currentLeague.pointsPerWin ?? SCORING_DEFAULTS.pointsPerWin).toString());
      setPointsPerDraw((currentLeague.pointsPerDraw ?? SCORING_DEFAULTS.pointsPerDraw).toString());
      setPointsPerLoss((currentLeague.pointsPerLoss ?? SCORING_DEFAULTS.pointsPerLoss).toString());
    }
  }, [currentLeague]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "League name is required");
      return;
    }

    const parsedWin = parseInt(pointsPerWin, 10);
    const parsedDraw = parseInt(pointsPerDraw, 10);
    const parsedLoss = parseInt(pointsPerLoss, 10);
    if (isNaN(parsedWin) || isNaN(parsedDraw) || isNaN(parsedLoss)) {
      Alert.alert("Error", "Scoring values must be valid integers");
      return;
    }

    setLoading(true);
    try {
      await updateLeague(currentLeague.$id, {
        name: name.trim(),
        description: description.trim(),
        notificationLimit: parseInt(notifLimit, 10) || 50,
        pointsPerWin: parsedWin,
        pointsPerDraw: parsedDraw,
        pointsPerLoss: parsedLoss,
      });
      await refreshCurrentLeague();
      Alert.alert("Saved", "League settings updated");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(currentLeague.inviteCode);
    Alert.alert("Copied", "Invite code copied to clipboard");
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join my pool league "${currentLeague.name}" using invite code: ${currentLeague.inviteCode}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleRegenerateCode = () => {
    Alert.alert(
      "Regenerate Code",
      "This will invalidate the current invite code. Anyone with the old code won't be able to join. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Regenerate",
          onPress: async () => {
            try {
              await regenerateInviteCode(currentLeague.$id);
              await refreshCurrentLeague();
              Alert.alert("Done", "New invite code generated");
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const handleLeaveLeague = () => {
    if (isOwner) {
      Alert.alert(
        "Cannot Leave",
        "As the owner, you cannot leave the league. Transfer ownership first or delete the league."
      );
      return;
    }

    Alert.alert(
      "Leave League",
      `Are you sure you want to leave "${currentLeague.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveLeague(currentMembership.$id);
              removeUserLeague(currentLeague.$id);
              navigation.navigate("Leagues");
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const handleDeleteLeague = () => {
    Alert.alert(
      "Delete League",
      `Are you sure you want to delete "${currentLeague.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteLeague(currentLeague.$id);
              removeUserLeague(currentLeague.$id);
              navigation.navigate("Leagues");
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  if (!currentLeague) {
    return (
      <Screen edges={[]}>
        <Text style={styles.noLeague}>No league selected</Text>
      </Screen>
    );
  }

  return (
    <Screen edges={[]}>
      <SectionHeader title="League Settings" />

      {/* Role info */}
      <View style={styles.roleSection}>
        <Text style={styles.roleLabel}>Your role:</Text>
        <RoleBadge role={currentMembership?.role || "player"} size="large" />
      </View>

      {/* Invite Code Section */}
      <Card style={styles.inviteCard}>
        <Text style={styles.cardTitle}>Invite Code</Text>
        <View style={styles.codeRow}>
          <Text style={styles.inviteCode}>{currentLeague.inviteCode}</Text>
          <View style={styles.codeActions}>
            <Pressable style={styles.codeBtn} onPress={handleCopyCode}>
              <Ionicons name="copy-outline" size={20} color={colors.accent} />
            </Pressable>
            <Pressable style={styles.codeBtn} onPress={handleShareCode}>
              <Ionicons name="share-outline" size={20} color={colors.accent} />
            </Pressable>
          </View>
        </View>
        {canEdit && (
          <Pressable style={styles.regenerateBtn} onPress={handleRegenerateCode}>
            <Ionicons name="refresh-outline" size={16} color={colors.warning} />
            <Text style={styles.regenerateText}>Regenerate Code</Text>
          </Pressable>
        )}
      </Card>

      {/* Edit Form (admins only) */}
      {canEdit && (
        <View style={styles.form}>
          <Input
            label="League Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            autoCapitalize="sentences"
          />
          <Input
            label="Daily Notification Limit"
            value={notifLimit}
            onChangeText={setNotifLimit}
            keyboardType="number-pad"
          />
        </View>
      )}

      {/* Scoring Rules (admins only) */}
      {canEdit && (
        <Card style={styles.scoringCard}>
          <Text style={styles.cardTitle}>Scoring Rules</Text>
          <Input
            label="Points per Win"
            value={pointsPerWin}
            onChangeText={setPointsPerWin}
            keyboardType="number-pad"
          />
          <Input
            label="Points per Draw"
            value={pointsPerDraw}
            onChangeText={setPointsPerDraw}
            keyboardType="number-pad"
          />
          <Input
            label="Points per Loss"
            value={pointsPerLoss}
            onChangeText={setPointsPerLoss}
            keyboardType="default"
          />
        </Card>
      )}

      {/* Save button */}
      {canEdit && (
        <View style={styles.form}>
          <Button
            title={loading ? "Saving..." : "Save Changes"}
            onPress={handleSave}
            disabled={loading}
          />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {!isOwner && (
          <Pressable style={styles.leaveBtn} onPress={handleLeaveLeague}>
            <Ionicons name="exit-outline" size={20} color={colors.danger} />
            <Text style={styles.leaveText}>Leave League</Text>
          </Pressable>
        )}

        {canDelete && (
          <Pressable style={styles.deleteBtn} onPress={handleDeleteLeague}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <Text style={styles.deleteText}>Delete League</Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  noLeague: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 40,
  },
  roleSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  roleLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginRight: 12,
  },
  inviteCard: {
    marginBottom: 20,
  },
  scoringCard: {
    marginBottom: 20,
  },
  cardTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inviteCode: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 4,
  },
  codeActions: {
    flexDirection: "row",
  },
  codeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  regenerateBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  regenerateText: {
    color: colors.warning,
    fontSize: 14,
    marginLeft: 6,
  },
  form: {
    marginBottom: 24,
  },
  actions: {
    marginTop: "auto",
    paddingTop: 20,
  },
  leaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    backgroundColor: colors.dangerSubtle,
    borderRadius: 12,
    marginBottom: 12,
  },
  leaveText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
  },
  deleteText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
