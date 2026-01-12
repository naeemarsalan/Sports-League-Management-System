import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button = ({ title, onPress, variant = "primary", disabled }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, disabled && styles.disabled]}
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
    </AnimatedPressable>
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
  disabled: {
    opacity: 0.5,
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
