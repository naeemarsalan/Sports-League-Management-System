import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { useAuthStore } from "../state/useAuthStore";
import { getLeagueByInviteCode } from "../lib/leagues";
import { requestToJoinLeague, getMembership } from "../lib/members";
import { colors } from "../theme/colors";

export const JoinLeagueScreen = ({ navigation }) => {
  const { user } = useAuthStore();

  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [foundLeague, setFoundLeague] = useState(null);
  const [error, setError] = useState("");

  const handleLookup = async () => {
    if (!inviteCode.trim()) {
      setError("Please enter an invite code");
      return;
    }

    if (inviteCode.trim().length !== 6) {
      setError("Invite code must be 6 characters");
      return;
    }

    setLoading(true);
    setError("");
    setFoundLeague(null);

    try {
      const league = await getLeagueByInviteCode(inviteCode.trim().toUpperCase());

      if (!league) {
        setError("No league found with this invite code");
        return;
      }

      // Check if already a member
      const existingMembership = await getMembership(league.$id, user.$id);
      if (existingMembership) {
        if (existingMembership.status === "approved") {
          setError("You're already a member of this league");
        } else if (existingMembership.status === "pending") {
          setError("You already have a pending request for this league");
        } else {
          setError("Your previous request was rejected");
        }
        return;
      }

      setFoundLeague(league);
    } catch (error) {
      console.error("Error looking up league:", error);
      setError(error.message || "Failed to lookup league");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!foundLeague) return;

    setLoading(true);
    try {
      await requestToJoinLeague(foundLeague.$id, user.$id);

      Alert.alert(
        "Request Sent!",
        "Your request to join has been sent. You'll be notified when an admin approves it.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Error joining league:", error);
      Alert.alert("Error", error.message || "Failed to request join");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={[]}>
      <SectionHeader
        title="Join League"
        subtitle="Enter an invite code to find a league"
      />

      <View style={styles.form}>
        <Input
          label="Invite Code"
          value={inviteCode}
          onChangeText={(text) => {
            setInviteCode(text.toUpperCase());
            setError("");
            setFoundLeague(null);
          }}
          placeholder="Enter 6-character code"
          autoCapitalize="characters"
        />

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!foundLeague && (
          <Button
            title={loading ? "Looking up..." : "Find League"}
            onPress={handleLookup}
            disabled={loading || !inviteCode.trim()}
          />
        )}

        {foundLeague && (
          <Card highlight style={styles.leagueCard}>
            <View style={styles.leagueHeader}>
              <View style={styles.leagueIcon}>
                <Ionicons name="ellipse" size={24} color={colors.accent} />
              </View>
              <View style={styles.leagueInfo}>
                <Text style={styles.leagueName}>{foundLeague.name}</Text>
                {foundLeague.description && (
                  <Text style={styles.leagueDesc}>{foundLeague.description}</Text>
                )}
              </View>
            </View>
            <View style={styles.leagueStats}>
              <View style={styles.stat}>
                <Ionicons name="people" size={16} color={colors.textSecondary} />
                <Text style={styles.statText}>
                  {foundLeague.memberCount || 0} members
                </Text>
              </View>
            </View>

            <Button
              title={loading ? "Sending request..." : "Request to Join"}
              onPress={handleJoin}
              disabled={loading}
            />
          </Card>
        )}
      </View>

      <View style={styles.footer}>
        <Button title="Cancel" variant="outline" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  form: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dangerSubtle,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  leagueCard: {
    marginTop: 16,
  },
  leagueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  leagueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "600",
  },
  leagueDesc: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  leagueStats: {
    flexDirection: "row",
    marginBottom: 8,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginLeft: 6,
  },
  footer: {
    paddingTop: 20,
  },
});
