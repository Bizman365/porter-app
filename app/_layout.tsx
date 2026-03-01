import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from '../lib/colorScheme';
import { I18nProvider } from '../lib/i18n';

function Providers({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>{children}</I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedStatusBar() {
  const { theme } = useTheme();
  return <StatusBar style={theme.isDark ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <Providers>
      <ThemedStatusBar />
      <Stack screenOptions={{ headerShown: false }} />
    </Providers>
  );
}

