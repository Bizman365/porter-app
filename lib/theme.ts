import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

export type ColorSchemeName = 'light' | 'dark';

const isWeb = Platform.OS === 'web';

export const FONT = {
  regular: isWeb ? 'Inter, sans-serif' : 'Inter_400Regular',
  medium: isWeb ? 'Inter, sans-serif' : 'Inter_500Medium',
  semibold: isWeb ? 'Inter, sans-serif' : 'Inter_600SemiBold',
  bold: isWeb ? 'Inter, sans-serif' : 'Inter_700Bold',
} as const;

export const SPACING = {
  grid: 8,
  screenX: 20,
  cardGap: 12,
  sectionGap: 24,
} as const;

export const RADII = {
  card: 16,
  button: 12,
  pill: 999,
} as const;

export const TYPE = {
  heroNumber: {
    fontSize: 36,
    fontFamily: FONT.bold,
    ...(isWeb ? { fontWeight: '700' as const } : {}),
    letterSpacing: 0.2,
  },
  sectionHeader: {
    fontSize: 18,
    fontFamily: FONT.semibold,
    ...(isWeb ? { fontWeight: '600' as const } : {}),
  },
  body: {
    fontSize: 14,
    fontFamily: FONT.regular,
    ...(isWeb ? { fontWeight: '400' as const } : {}),
  },
  labelCaps: {
    fontSize: 12,
    fontFamily: FONT.medium,
    ...(isWeb ? { fontWeight: '500' as const } : {}),
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
} as const;

export type ThemeColors = {
  background: string;
  card: string;
  border: string;
  primary: string;
  secondary: string;
  gradientFrom: string;
  gradientTo: string;
  success: string;
  warning: string;
  danger: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
};

export type AppTheme = {
  scheme: ColorSchemeName;
  isDark: boolean;
  colors: ThemeColors;
  cardShadow: ViewStyle;
  tabBarBorder: string;
};

function buildCardShadow(scheme: ColorSchemeName): ViewStyle {
  const darkShadow = Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.12,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 2 },
    default: {
      shadowColor: '#000000',
      shadowOpacity: 0.12,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 10 },
    },
  }) as ViewStyle;

  const lightShadow = Platform.select({
    ios: {
      shadowColor: '#111827',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 3 },
    default: {
      shadowColor: '#111827',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
    },
  }) as ViewStyle;

  return scheme === 'dark' ? darkShadow : lightShadow;
}

export const LIGHT_THEME: AppTheme = {
  scheme: 'light',
  isDark: false,
  colors: {
    background: '#F9FAFB',
    card: '#FFFFFF',
    border: '#E5E7EB',
    primary: '#059669',
    secondary: '#0891B2',
    gradientFrom: '#059669',
    gradientTo: '#0891B2',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
  },
  cardShadow: buildCardShadow('light'),
  tabBarBorder: '#E5E7EB',
} as const;

export const DARK_THEME: AppTheme = {
  scheme: 'dark',
  isDark: true,
  colors: {
    background: '#0F1117',
    card: '#1A1D2E',
    border: 'rgba(255,255,255,0.06)',
    primary: '#059669',
    secondary: '#0891B2',
    gradientFrom: '#059669',
    gradientTo: '#0891B2',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.6)',
    textMuted: 'rgba(255,255,255,0.4)',
  },
  cardShadow: buildCardShadow('dark'),
  tabBarBorder: 'rgba(255,255,255,0.06)',
} as const;

export function getTheme(scheme: ColorSchemeName): AppTheme {
  return scheme === 'dark' ? DARK_THEME : LIGHT_THEME;
}
