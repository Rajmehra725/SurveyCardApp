import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { Palette, Radii, Shadows } from "../../constants/theme";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}: ButtonProps) {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: Palette.primaryBlue,
          ...Shadows.brandGlow,
        };
      case "secondary":
        return {
          backgroundColor: Palette.skyBlue,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderColor: Palette.primaryBlue,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
        };
      case "danger":
        return {
          backgroundColor: Palette.error,
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case "primary":
      case "danger":
        return { color: "#FFFFFF" };
      case "secondary":
        return { color: Palette.primaryTextLight };
      case "outline":
      case "ghost":
        return { color: Palette.primaryBlue };
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case "sm":
        return { height: 38, paddingHorizontal: 14, borderRadius: Radii.md };
      case "md":
        return { height: 48, paddingHorizontal: 20, borderRadius: Radii.lg };
      case "lg":
        return { height: 56, paddingHorizontal: 24, borderRadius: Radii.xl };
    }
  };

  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case "sm":
        return { fontSize: 13, fontWeight: "700" };
      case "md":
        return { fontSize: 15, fontWeight: "700" };
      case "lg":
        return { fontSize: 16, fontWeight: "800" };
    }
  };

  const isInteractive = !loading && !disabled;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!isInteractive}
      style={[
        styles.base,
        getSizeStyle(),
        getVariantStyle(),
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? Palette.primaryBlue : "#FFFFFF"}
        />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && <View style={styles.iconMargin}>{leftIcon}</View>}
          <Text style={[styles.text, getTextSizeStyle(), getTextStyle(), textStyle]}>
            {title}
          </Text>
          {rightIcon && <View style={styles.iconMarginRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    textAlign: "center",
  },
  iconMargin: {
    marginRight: 8,
  },
  iconMarginRight: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.55,
  },
});
