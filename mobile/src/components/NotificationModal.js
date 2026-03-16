import React, { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { approveMember, rejectMember } from "../lib/members";

const typeConfig = {
  challenge_received: { icon: "flash", color: colors.accent, label: "Challenge Received" },
  join_request: { icon: "people", color: colors.info, label: "Join Request" },
  join_approved: { icon: "people", color: colors.success, label: "Membership Approved" },
  join_rejected: { icon: "people", color: colors.danger, label: "Membership Rejected" },
  position_overtaken: { icon: "trophy", color: colors.gold, label: "Position Overtaken" },
  match_scheduled: { icon: "calendar", color: colors.info, label: "Match Scheduled" },
  score_submitted: { icon: "checkmark-circle", color: colors.success, label: "Score Submitted" },
  admin_broadcast: { icon: "megaphone", color: colors.warning, label: "Announcement" },
};

const getConfig = (type) =>
  typeConfig[type] || { icon: "notifications", color: colors.accent, label: "Notification" };

export const NotificationModal = ({ visible, onClose, notification, onAction }) => {
  const [processing, setProcessing] = useState(false);

  if (!notification) return null;

  const config = getConfig(notification.type);
  const hasMatch = !!notification.data?.matchId;
  const isJoinRequest = notification.type === "join_request";
  const hasMembershipId = !!notification.data?.membershipId;

  const handleApprove = async () => {
    if (!hasMembershipId) {
      Alert.alert("Info", "Open League Members to manage join requests.");
      onClose();
      return;
    }
    setProcessing(true);
    try {
      await approveMember(notification.data.membershipId);
      Alert.alert("Approved", `${notification.data.requesterName || "Player"} has been approved.`);
      onClose();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to approve member.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!hasMembershipId) {
      Alert.alert("Info", "Open League Members to manage join requests.");
      onClose();
      return;
    }
    setProcessing(true);
    try {
      await rejectMember(notification.data.membershipId);
      Alert.alert("Rejected", "Join request has been rejected.");
      onClose();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to reject member.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.cardWrapper} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={colors.gradientCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.card}
          >
            {/* Close button */}
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>

            {/* Icon */}
            <View style={[styles.iconCircle, { backgroundColor: config.color + "20" }]}>
              <Ionicons name={config.icon} size={32} color={config.color} />
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {notification.title || config.label}
            </Text>

            {/* Body */}
            {!!notification.body && (
              <Text style={styles.body}>{notification.body}</Text>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              {isJoinRequest ? (
                <>
                  <Pressable
                    style={[styles.approveBtn, processing && styles.disabledBtn]}
                    onPress={handleApprove}
                    disabled={processing}
                  >
                    <Ionicons name="checkmark" size={18} color={colors.textInverse} />
                    <Text style={styles.primaryBtnText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.rejectBtn, processing && styles.disabledBtn]}
                    onPress={handleReject}
                    disabled={processing}
                  >
                    <Ionicons name="close" size={18} color={colors.danger} />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </Pressable>
                </>
              ) : hasMatch ? (
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => onAction?.(notification)}
                >
                  <Ionicons name="eye-outline" size={18} color={colors.textInverse} />
                  <Text style={styles.primaryBtnText}>View Match</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={[styles.dismissBtn, !hasMatch && !isJoinRequest && styles.dismissBtnFull]}
                onPress={onClose}
              >
                <Text style={styles.dismissBtnText}>Dismiss</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 14, 20, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  cardWrapper: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    padding: 24,
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
    marginTop: 20,
    width: "100%",
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    gap: 6,
  },
  rejectBtnText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "600",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: "600",
  },
  dismissBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dismissBtnFull: {
    flex: 1,
  },
  dismissBtnText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "500",
  },
});
