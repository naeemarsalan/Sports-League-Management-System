import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { SectionHeader } from "../components/SectionHeader";
import { useAuthStore } from "../state/useAuthStore";
import { useLeagueStore } from "../state/useLeagueStore";
import { createLeague } from "../lib/leagues";
import { colors } from "../theme/colors";

export const CreateLeagueScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const { fetchUserLeagues, setCurrentLeague } = useLeagueStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a league name");
      return;
    }

    if (name.trim().length < 3) {
      Alert.alert("Error", "League name must be at least 3 characters");
      return;
    }

    setLoading(true);
    try {
      const league = await createLeague({
        name: name.trim(),
        description: description.trim(),
        createdBy: user.$id,
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
        <Input
          label="League Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Friday Night Pool League"
          autoCapitalize="words"
        />

        <Input
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Tell people what your league is about"
          autoCapitalize="sentences"
        />

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
  footer: {
    paddingTop: 20,
  },
});
