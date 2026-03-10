import React, { useState, useRef } from "react";
import { Animated, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../theme/colors";

export const Input = ({
  label,
  value,
  onChangeText,
  secureTextEntry,
  placeholder,
  keyboardType,
  autoCapitalize = "none",
  testID,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, isFocused && styles.labelFocused]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[styles.input, isFocused && styles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={handleFocus}
        onBlur={handleBlur}
        testID={testID}
      />
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
  labelFocused: {
    color: colors.accent,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.border,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: colors.accent,
  },
});
