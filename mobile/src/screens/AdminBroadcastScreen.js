import React, { useState, useEffect } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/Card";
import { useLeagueStore, ACTIONS } from "../state/useLeagueStore";
import { getLeagueMembers } from "../lib/members";
import { sendPushNotification, getLeagueNotificationQuota } from "../lib/notifications";
import { colors } from "../theme/colors";

export const AdminBroadcastScreen = ({ navigation }) => {
  const { currentLeague, currentLeagueId, canPerform } = useLeagueStore();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState(null);

  const canBroadcast = canPerform(ACTIONS.EDIT_LEAGUE_SETTINGS);

  // Fetch quota on mount
  useEffect(() => {
    if (currentLeagueId && canBroadcast) {
      getLeagueNotificationQuota(currentLeagueId, currentLeague?.notificationLimit || 50).then(setQuota);
    }
  }, [currentLeagueId, canBroadcast]);

  if (!canBroadcast) {
    return (
      <Screen edges={[]}>
        <Text style={styles.noPermission}>Only admins and owners can send announcements.</Text>
      </Screen>
    );
  }

  const handleSend = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }
    if (!message.trim()) {
      Alert.alert("Error", "Please enter a message");
      return;
    }

    setLoading(true);
    try {
      const members = await getLeagueMembers(currentLeagueId, "approved");

      // Check if sending to all members would exceed the limit
      if (quota && quota.remaining < members.length) {
        Alert.alert(
          "Rate Limit",
          `This league can send ${quota.remaining} more notification${quota.remaining !== 1 ? "s" : ""} today (limit: ${quota.limit}/day). ` +
          `Broadcasting to ${members.length} members would exceed the limit.`
        );
        setLoading(false);
        return;
      }

      const promises = members.map((member) =>
        sendPushNotification("admin_broadcast", member.userId, {
          title: title.trim(),
          message: message.trim(),
          leagueName: currentLeague?.name,
        }, currentLeagueId)
      );
      await Promise.all(promises);

      // Refresh quota after sending
      getLeagueNotificationQuota(currentLeagueId, currentLeague?.notificationLimit || 50).then(setQuota);

      Alert.alert(
        "Sent",
        `Announcement sent to ${members.length} member${members.length !== 1 ? "s" : ""}.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to send announcement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={[]}>
      <SectionHeader title="Send Announcement" subtitle={currentLeague?.name} />

      {/* Quota indicator */}
      {quota && (
        <Card style={styles.quotaCard}>
          <View style={styles.quotaRow}>
            <Ionicons
              name={quota.remaining > 10 ? "notifications-outline" : "warning-outline"}
              size={18}
              color={quota.remaining > 10 ? colors.textSecondary : colors.warning}
            />
            <Text style={[styles.quotaText, quota.remaining <= 10 && styles.quotaWarning]}>
              {quota.remaining}/{quota.limit} notifications remaining today
            </Text>
          </View>
          <View style={styles.quotaBar}>
            <View
              style={[
                styles.quotaFill,
                {
                  width: `${Math.min(100, (quota.count / quota.limit) * 100)}%`,
                  backgroundColor: quota.remaining > 10 ? colors.accent : colors.warning,
                },
              ]}
            />
          </View>
        </Card>
      )}

      <View style={styles.form}>
        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Announcement title"
          autoCapitalize="sentences"
        />
        <Input
          label="Message"
          value={message}
          onChangeText={setMessage}
          placeholder="Write your announcement..."
          autoCapitalize="sentences"
          multiline
          numberOfLines={4}
          style={styles.messageInput}
        />
        <Button
          title={loading ? "Sending..." : "Send Announcement"}
          onPress={handleSend}
          disabled={loading || !title.trim() || !message.trim() || (quota && quota.remaining === 0)}
        />
        {quota && quota.remaining === 0 && (
          <Text style={styles.limitReached}>
            Daily notification limit reached. Try again tomorrow.
          </Text>
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  noPermission: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 40,
  },
  quotaCard: {
    marginBottom: 16,
  },
  quotaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  quotaText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginLeft: 8,
  },
  quotaWarning: {
    color: colors.warning,
  },
  quotaBar: {
    height: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 2,
    overflow: "hidden",
  },
  quotaFill: {
    height: "100%",
    borderRadius: 2,
  },
  form: {
    flex: 1,
  },
  messageInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  limitReached: {
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
});
