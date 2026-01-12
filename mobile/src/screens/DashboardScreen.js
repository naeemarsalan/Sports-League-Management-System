import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { colors } from "../theme/colors";
import { useAuthStore } from "../state/useAuthStore";

export const DashboardScreen = ({ navigation }) => {
  const { profile } = useAuthStore();
  const roleLabel = profile?.role === "admin" ? "Admin" : "Player";

  return (
    <Screen>
      <SectionHeader title={`Welcome, ${profile?.displayName ?? "Player"}`} subtitle={`${roleLabel} dashboard`} />
      <Card>
        <Text style={styles.cardTitle}>Quick actions</Text>
        <Button title="View Matches" onPress={() => navigation.navigate("Matches")} />
        <Button title="Leaderboard" onPress={() => navigation.navigate("Leaderboard")} variant="outline" />
      </Card>
      {profile?.role === "admin" ? (
        <Card>
          <Text style={styles.cardTitle}>Admin controls</Text>
          <Button title="Manage Players" onPress={() => navigation.navigate("ManagePlayers")} />
          <Button title="Create Match" onPress={() => navigation.navigate("NewMatch")} variant="outline" />
        </Card>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
});
