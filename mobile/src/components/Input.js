import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../theme/colors";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export const Input = ({
  label,
  value,
  onChangeText,
  secureTextEntry,
  placeholder,
  keyboardType,
  autoCapitalize = "none",
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = useSharedValue(colors.border);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
    transform: [{ scale: scale.value }],
  }));

  const handleFocus = () => {
    setIsFocused(true);
    borderColor.value = withTiming(colors.accent, { duration: 200 });
    scale.value = withTiming(1.01, { duration: 150 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderColor.value = withTiming(colors.border, { duration: 200 });
    scale.value = withTiming(1, { duration: 150 });
  };

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, isFocused && styles.labelFocused]}>
          {label}
        </Text>
      )}
      <AnimatedTextInput
        style={[styles.input, animatedStyle]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={handleFocus}
        onBlur={handleBlur}
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
    fontSize: 16,
  },
});
