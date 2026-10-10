import '@/global.css';
import { Platform, ViewStyle, TextStyle } from 'react-native';

export const SmileyXBrand = {
  name: 'SmileyX',
  tagline: 'Your Moments. Your Feelings. Your World.',
  concept: 'Share a Moment. Express a Feeling. Keep a Memory. Stay Connected.',
  version: '2.0.0',
};

// Legacy brand alias for backward compatibility
export const RaazBrand = SmileyXBrand;

/**
 * Blue Jay Visual Identity Palette
 */
export const Palette = {
  primaryBlue: '#2563EB',   // Core brand blue
  skyBlue: '#38BDF8',       // Light vibrant sky blue
  accentCyan: '#06B6D4',    // Accent cyan
  lightBg: '#F8FAFF',       // Crisp modern light background
  whiteSurface: '#FFFFFF',  // Clean white surface
  darkBg: '#0B1220',        // Deep midnight blue dark background
  darkSurface: '#111827',   // Dark surface
  primaryTextLight: '#111827',
  secondaryTextLight: '#64748B',
  borderLight: '#E2E8F0',
  success: '#16A34A',
  error: '#DC2626',
  warning: '#F59E0B',
  info: '#0284C7',
} as const;

export const Colors = {
  light: {
    primary: Palette.primaryBlue,
    primaryHover: '#1D4ED8',
    secondary: Palette.skyBlue,
    accent: Palette.accentCyan,
    background: Palette.lightBg,
    surface: Palette.whiteSurface,
    card: Palette.whiteSurface,
    border: Palette.borderLight,
    borderStrong: '#CBD5E1',
    text: Palette.primaryTextLight,
    textSecondary: Palette.secondaryTextLight,
    muted: '#94A3B8',
    success: Palette.success,
    error: Palette.error,
    warning: Palette.warning,
    info: Palette.info,
    online: Palette.success,
    badge: Palette.primaryBlue,
    primaryLight: 'rgba(37, 99, 235, 0.10)',
    secondaryLight: 'rgba(56, 189, 248, 0.12)',
    accentLight: 'rgba(6, 182, 212, 0.12)',
    backgroundElement: '#EEF2F6',
    backgroundSelected: '#E0E7FF',
    overlay: 'rgba(11, 18, 32, 0.55)',
  },
  dark: {
    primary: Palette.primaryBlue,
    primaryHover: '#3B82F6',
    secondary: Palette.skyBlue,
    accent: Palette.accentCyan,
    background: Palette.darkBg,
    surface: Palette.darkSurface,
    card: '#151E32',
    border: '#1E293B',
    borderStrong: '#334155',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    muted: '#64748B',
    success: '#22C55E',
    error: '#EF4444',
    warning: '#FBBF24',
    info: '#38BDF8',
    online: '#22C55E',
    badge: Palette.primaryBlue,
    primaryLight: 'rgba(37, 99, 235, 0.22)',
    secondaryLight: 'rgba(56, 189, 248, 0.22)',
    accentLight: 'rgba(6, 182, 212, 0.22)',
    backgroundElement: '#1A2338',
    backgroundSelected: '#1E3A8A',
    overlay: 'rgba(0, 0, 0, 0.75)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Typography = {
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700' as const,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodyBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  micro: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600' as const,
  },
};

export const Spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  // Backward compatibility:
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 9999,
  round: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  brandGlow: {
    shadowColor: Palette.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const IconSizes = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
  xxl: 44,
};

export const AnimationTimings = {
  quick: 150,
  normal: 250,
  smooth: 350,
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
