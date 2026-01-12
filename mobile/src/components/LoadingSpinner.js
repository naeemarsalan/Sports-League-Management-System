import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { colors } from "../theme/colors";

export const LoadingSpinner = ({ size = 40, color = colors.accent }) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0.6, { duration: 500 })
      ),
      -1,
      true
    );
  }, []);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            backgroundColor: color,
          },
        ]}
      />
      <Animated.View
        style={[
          spinnerStyle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 3,
            borderColor: colors.border,
            borderTopColor: color,
          },
        ]}
      />
    </View>
  );
};

export const LoadingOverlay = ({ visible, message }) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <LoadingSpinner size={48} />
        {message && (
          <Animated.Text style={styles.message}>{message}</Animated.Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  glow: {
    position: "absolute",
    opacity: 0.2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 10, 8, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  overlayContent: {
    alignItems: "center",
    padding: 24,
  },
  message: {
    color: colors.textPrimary,
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
});
