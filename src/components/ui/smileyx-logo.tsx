import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { Palette } from "../../constants/theme";

interface SmileyXLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  subtitle?: string;
  style?: ViewStyle;
}

/**
 * SmileyX Original Brand Logo:
 * Combines:
 * 1. An abstract Blue Jay bird crest / wing ascending dynamically
 * 2. An expressive, warm smile arc connecting social nodes
 * 3. Modern Blue Jay gradient: Deep Blue (#2563EB) to Sky Blue (#38BDF8) with Cyan accent (#06B6D4)
 */
export function SmileyXLogo({
  size = 64,
  showText = false,
  textColor = Palette.primaryTextLight,
  subtitle,
  style,
}: SmileyXLogoProps) {
  const iconSize = size;
  const gradientId = "blueJayGrad";

  return (
    <View style={[styles.container, style]}>
      <Svg width={iconSize} height={iconSize} viewBox="0 0 100 100" fill="none">
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#38BDF8" />
            <Stop offset="50%" stopColor="#2563EB" />
            <Stop offset="100%" stopColor="#06B6D4" />
          </LinearGradient>
          <LinearGradient id="crestGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#1D4ED8" />
            <Stop offset="100%" stopColor="#38BDF8" />
          </LinearGradient>
        </Defs>

        {/* Outer Circular Aura / Badge */}
        <Circle cx="50" cy="50" r="46" fill={`url(#${gradientId})`} />

        {/* Deep Blue Jay Crest / Wing Wingtip Shape */}
        <Path
          d="M26 32 C38 20, 68 20, 78 36 C64 36, 52 44, 46 56 C42 42, 34 36, 26 32 Z"
          fill="#FFFFFF"
          opacity={0.95}
        />

        {/* Warm Smiling Arc (Connecting two social emotion nodes) */}
        <Path
          d="M32 58 C42 74, 58 74, 68 58"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Dynamic Jay Eye / Social Node 1 */}
        <Circle cx="34" cy="48" r="4.5" fill="#FFFFFF" />

        {/* Expression Accent Node 2 */}
        <Circle cx="66" cy="48" r="4.5" fill="#FFFFFF" />

        {/* Subtly uplifted beak accent / sparkle */}
        <Path
          d="M72 44 L80 47 L72 50 Z"
          fill="#38BDF8"
        />
      </Svg>

      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.brandText, { color: textColor }]}>
            Smiley<Text style={{ color: Palette.primaryBlue }}>X</Text>
          </Text>
          {subtitle ? (
            <Text style={styles.subtitleText}>{subtitle}</Text>
          ) : (
            <Text style={styles.taglineText}>Your Moments. Your Feelings.</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  brandText: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  taglineText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  subtitleText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
});
