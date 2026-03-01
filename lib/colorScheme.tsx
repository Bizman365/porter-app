import type { PropsWithChildren } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import type { AppTheme, ColorSchemeName } from './theme';
import { getTheme } from './theme';

type ThemeContextValue = {
  scheme: ColorSchemeName;
  setScheme: (scheme: ColorSchemeName) => void;
  toggleScheme: () => void;
  theme: AppTheme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [scheme, setScheme] = useState<ColorSchemeName>('dark');

  const value = useMemo<ThemeContextValue>(() => {
    const theme = getTheme(scheme);
    return {
      scheme,
      setScheme,
      toggleScheme: () => setScheme((s) => (s === 'dark' ? 'light' : 'dark')),
      theme,
    };
  }, [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}

