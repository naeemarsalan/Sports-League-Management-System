import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";

export const Button = ({ title, onPress, variant = "primary", disabled }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  return (
    <Animated.View style={{ transform: [{ scale }], opacity: disabled ? 0.5 : 1 }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        {isPrimary || isDanger ? (
          <LinearGradient
            colors={isDanger ? [colors.danger, "#dc2626"] : colors.gradientAccent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.base, styles.gradient]}
          >
            <Text style={styles.text}>{title}</Text>
          </LinearGradient>
        ) : (
          <Animated.View style={[styles.base, styles.outline]}>
            <Text style={[styles.text, styles.outlineText]}>{title}</Text>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  gradient: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  outline: {
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  text: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 16,
  },
  outlineText: {
    color: colors.textSecondary,
  },
});
