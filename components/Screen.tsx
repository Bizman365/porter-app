import type { PropsWithChildren, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../lib/colorScheme';
import { SPACING } from '../lib/theme';

export function Screen({
  children,
  scroll = true,
  overlay,
  contentContainerStyle,
  padTop = SPACING.sectionGap,
  padBottomExtra = 0,
}: PropsWithChildren<{
  scroll?: boolean;
  overlay?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  padTop?: number;
  padBottomExtra?: number;
}>) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const padding = {
    paddingTop: padTop,
    paddingBottom: SPACING.sectionGap + insets.bottom + padBottomExtra,
    paddingLeft: SPACING.screenX + insets.left,
    paddingRight: SPACING.screenX + insets.right,
  } as const;

  const container = { ...padding, ...(StyleSheet.flatten(contentContainerStyle) ?? {}) };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1 }}>
        {scroll ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={container}>
            <View style={{ gap: SPACING.cardGap }}>{children}</View>
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, ...container }}>{children}</View>
          </View>
        )}

        {overlay ? (
          <View pointerEvents="box-none" style={{ position: 'absolute', inset: 0 }}>
            {overlay}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

