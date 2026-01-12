import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";

export const Screen = ({ children, scroll = true, style }) => {
  if (scroll) {
    return (
      <ScrollView contentContainerStyle={[styles.container, style]}>
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.container, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
});
