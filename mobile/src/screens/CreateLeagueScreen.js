import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { SectionHeader } from "../components/SectionHeader";
import { useAuthStore } from "../state/useAuthStore";
import { useLeagueStore } from "../state/useLeagueStore";
import { createLeague, SCORING_DEFAULTS } from "../lib/leagues";
import { colors } from "../theme/colors";

export const CreateLeagueScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const { fetchUserLeagues, setCurrentLeague } = useLeagueStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sportType, setSportType] = useState("pool");
  const [pointsPerWin, setPointsPerWin] = useState(SCORING_DEFAULTS.pointsPerWin.toString());
  const [pointsPerDraw, setPointsPerDraw] = useState(SCORING_DEFAULTS.pointsPerDraw.toString());
  const [pointsPerLoss, setPointsPerLoss] = useState(SCORING_DEFAULTS.pointsPerLoss.toString());
  const [includeFramePoints, setIncludeFramePoints] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a league name");
      return;
    }

    if (name.trim().length < 3) {
      Alert.alert("Error", "League name must be at least 3 characters");
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
      const league = await createLeague({
        name: name.trim(),
        description: description.trim(),
        createdBy: user.$id,
        pointsPerWin: parsedWin,
        pointsPerDraw: parsedDraw,
        pointsPerLoss: parsedLoss,
        includeFramePoints,
        sportType,
      });

      // Refresh user's leagues and set this as current
      await fetchUserLeagues(user.$id);
      await setCurrentLeague(league.$id);

      Alert.alert(
        "League Created!",
        `Your invite code is: ${league.inviteCode}\n\nShare this code with others to invite them.`,
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Main"),
          },
        ]
      );
    } catch (error) {
      console.error("Error creating league:", error);
      Alert.alert("Error", error.message || "Failed to create league");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={[]}>
      <SectionHeader
        title="Create League"
        subtitle="Start your own league and invite players"
      />

      <View style={styles.form}>
        {/* Sport Type Selector */}
        <View style={styles.sportSelector}>
          <Text style={styles.sportLabel}>Sport</Text>
          <View style={styles.sportPills}>
            <Pressable
              style={[styles.sportPill, sportType === "pool" && styles.sportPillActive]}
              onPress={() => setSportType("pool")}
            >
              <Text style={[styles.sportPillText, sportType === "pool" && styles.sportPillTextActive]}>
                Pool
              </Text>
            </Pressable>
            <View style={[styles.sportPill, styles.sportPillDisabled]}>
              <Text style={[styles.sportPillText, styles.sportPillTextDisabled]}>Snooker</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            </View>
          </View>
        </View>

        <Input
          label="League Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Friday Night Pool League"
          autoCapitalize="words"
          testID="input-league-name"
        />

        <Input
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Tell people what your league is about"
          autoCapitalize="sentences"
        />

        {sportType === "pool" && (
          <>
            <Pressable
              style={styles.advancedToggle}
              onPress={() => setShowAdvanced(!showAdvanced)}
              testID="btn-advanced-settings"
            >
              <Text style={styles.advancedToggleText}>Advanced Settings</Text>
              <Ionicons
                name={showAdvanced ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>

            {showAdvanced && (
              <View style={styles.advancedSection}>
                <Text style={styles.advancedLabel}>Scoring Rules</Text>
                <Input
                  label="Points per Win"
                  value={pointsPerWin}
                  onChangeText={setPointsPerWin}
                  keyboardType="number-pad"
                  testID="input-points-per-win"
                />
                <Input
                  label="Points per Draw"
                  value={pointsPerDraw}
                  onChangeText={setPointsPerDraw}
                  keyboardType="number-pad"
                  testID="input-points-per-draw"
                />
                <Input
                  label="Points per Loss"
                  value={pointsPerLoss}
                  onChangeText={setPointsPerLoss}
                  keyboardType="default"
                  testID="input-points-per-loss"
                />

                <View style={styles.frameToggleRow}>
                  <View style={styles.frameToggleLabel}>
                    <Text style={styles.frameToggleTitle}>Include Frame Points</Text>
                    <Text style={styles.frameToggleHint}>
                      Add each player's frame score as bonus leaderboard points
                    </Text>
                  </View>
                  <Switch
                    value={includeFramePoints}
                    onValueChange={setIncludeFramePoints}
                    trackColor={{ false: colors.border, true: colors.accent }}
                    thumbColor="#fff"
                    testID="switch-frame-points"
                  />
                </View>
              </View>
            )}
          </>
        )}

        <View style={styles.info}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.infoText}>
            1. You'll become the owner of this league
          </Text>
          <Text style={styles.infoText}>
            2. An invite code will be generated
          </Text>
          <Text style={styles.infoText}>
            3. Share the code with others to invite them
          </Text>
          <Text style={styles.infoText}>
            4. Approve join requests from your members screen
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title={loading ? "Creating..." : "Create League"}
          onPress={handleCreate}
          disabled={loading || !name.trim()}
          testID="btn-submit-create-league"
        />
        <Button title="Cancel" variant="outline" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  form: {
    flex: 1,
  },
  advancedToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  advancedToggleText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "500",
  },
  advancedSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  advancedLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  info: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    paddingLeft: 4,
  },
  sportSelector: {
    marginBottom: 12,
  },
  sportLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sportPills: {
    flexDirection: "row",
    gap: 10,
  },
  sportPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sportPillActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSubtle,
  },
  sportPillDisabled: {
    opacity: 0.5,
  },
  sportPillText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  sportPillTextActive: {
    color: colors.accent,
  },
  sportPillTextDisabled: {
    color: colors.textMuted,
  },
  comingSoonBadge: {
    backgroundColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  comingSoonText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  frameToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  frameToggleLabel: {
    flex: 1,
    marginRight: 12,
  },
  frameToggleTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  frameToggleHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    paddingTop: 20,
  },
});
