import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../../lib/colorScheme';
import { FONT, RADII } from '../../lib/theme';

export function SegmentedPills<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: Array<{ label: string; value: T }>;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View
      style={{
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: RADII.pill,
        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? c.primary : 'transparent',
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: active ? FONT.semibold : FONT.medium,
                fontSize: 13,
                color: active ? '#FFFFFF' : c.textSecondary,
              }}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

