import { Text, View } from 'react-native';

import { useTheme } from '../../lib/colorScheme';
import { FONT } from '../../lib/theme';

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const palette: Record<typeof tone, { bg: string; text: string }> = {
    neutral: {
      bg: theme.isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
      text: c.textSecondary,
    },
    success: {
      bg: theme.isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5',
      text: c.success,
    },
    warning: {
      bg: theme.isDark ? 'rgba(245,158,11,0.15)' : '#FFFBEB',
      text: c.warning,
    },
    danger: {
      bg: theme.isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2',
      text: c.danger,
    },
  };

  return (
    <View
      style={{
        backgroundColor: palette[tone].bg,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 4,
      }}
    >
      <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: palette[tone].text }}>{label}</Text>
    </View>
  );
}

