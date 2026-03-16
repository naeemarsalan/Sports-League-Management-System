import React from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { useNotificationStore } from "../state/useNotificationStore";

const typeIcons = {
  challenge_received: { icon: "flash", color: colors.accent },
  join_request: { icon: "people", color: colors.info },
  join_approved: { icon: "people", color: colors.success },
  join_rejected: { icon: "people", color: colors.danger },
  position_overtaken: { icon: "trophy", color: colors.gold },
  match_scheduled: { icon: "calendar", color: colors.info },
  score_submitted: { icon: "checkmark-circle", color: colors.success },
  admin_broadcast: { icon: "megaphone", color: colors.warning },
};

const getIcon = (type) =>
  typeIcons[type] || { icon: "notifications", color: colors.accent };

const formatRelativeTime = (timestamp) => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

const NotificationItem = ({ item, onPress }) => {
  const config = getIcon(item.type);
  return (
    <Pressable style={styles.item} onPress={() => onPress(item)}>
      <View style={[styles.itemIcon, { backgroundColor: config.color + "20" }]}>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title || "Notification"}
        </Text>
        {!!item.body && (
          <Text style={styles.itemBody} numberOfLines={2}>
            {item.body}
          </Text>
        )}
        <Text style={styles.itemTime}>{formatRelativeTime(item.timestamp)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </Pressable>
  );
};

export const NotificationHistoryModal = ({ visible, onClose, onSelectNotification }) => {
  const { notifications, clearAll } = useNotificationStore();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
          {notifications.length > 0 ? (
            <Pressable onPress={clearAll} hitSlop={12}>
              <Text style={styles.clearText}>Clear all</Text>
            </Pressable>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        {/* List */}
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyMessage}>
              You'll see match updates, challenges, and announcements here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationItem item={item} onPress={onSelectNotification} />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "600",
  },
  clearText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "500",
  },
  list: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  itemBody: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  itemTime: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyMessage: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
});
