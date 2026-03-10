import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "../theme/colors";

const formatDate = (date) =>
  date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (date) =>
  `${formatDate(date)} ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

export const DatePicker = ({
  label,
  value,
  onChange,
  mode = "date",
  placeholder = "Select date...",
}) => {
  const [show, setShow] = useState(false);
  // For datetime mode: after picking date, pick time
  const [pickerMode, setPickerMode] = useState(mode === "datetime" ? "date" : mode);
  // Store intermediate date in datetime mode (only call parent onChange after both date and time)
  const [pendingDate, setPendingDate] = useState(null);

  const displayText = value
    ? mode === "datetime"
      ? formatDateTime(value)
      : mode === "time"
        ? value.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
        : formatDate(value)
    : placeholder;

  const handlePress = () => {
    if (mode === "datetime") {
      setPickerMode("date");
    }
    setShow(true);
  };

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShow(false);
    }

    if (event.type === "dismissed") {
      setShow(false);
      return;
    }

    if (!selectedDate) return;

    if (mode === "datetime" && pickerMode === "date") {
      // First step done (date selected), store in local state — don't call parent yet
      setPendingDate(selectedDate);
      if (Platform.OS === "android") {
        // Android shows separate dialogs — open time picker next
        setTimeout(() => {
          setPickerMode("time");
          setShow(true);
        }, 100);
      } else {
        setPickerMode("time");
      }
    } else if (mode === "datetime" && pickerMode === "time") {
      // Second step done (time selected) — combine with pending date and call parent
      const combined = pendingDate ? new Date(pendingDate) : new Date();
      combined.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      setPendingDate(null);
      onChange(combined);
      if (Platform.OS !== "ios") {
        setShow(false);
      }
    } else {
      onChange(selectedDate);
      if (Platform.OS === "ios") {
        // iOS inline picker stays open; don't auto-close
      } else {
        setShow(false);
      }
    }
  };

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable onPress={handlePress} style={styles.field}>
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {displayText}
        </Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode={pickerMode}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
          themeVariant="dark"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    color: colors.textSecondary,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  field: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  fieldText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  placeholder: {
    color: colors.textMuted,
  },
});
