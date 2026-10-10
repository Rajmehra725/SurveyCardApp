import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Palette, Radii, Shadows, Spacing } from "../../constants/theme";

interface CardProps {
  children: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
  bordered?: boolean;
  style?: ViewStyle;
}

export function Card({
  children,
  padding = "md",
  shadow = "sm",
  bordered = true,
  style,
}: CardProps) {
  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case "none":
        return { padding: 0 };
      case "sm":
        return { padding: Spacing.sm };
      case "md":
        return { padding: Spacing.lg };
      case "lg":
        return { padding: Spacing.xxl };
    }
  };

  const getShadowStyle = (): ViewStyle => {
    switch (shadow) {
      case "none":
        return {};
      case "sm":
        return Shadows.sm;
      case "md":
        return Shadows.md;
      case "lg":
        return Shadows.lg;
    }
  };

  return (
    <View
      style={[
        styles.base,
        getPaddingStyle(),
        getShadowStyle(),
        bordered && styles.bordered,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Palette.whiteSurface,
    borderRadius: Radii.xl,
  },
  bordered: {
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
});
