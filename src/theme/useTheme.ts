import { use } from 'react';

import { ThemeContext, type Theme } from './ThemeProvider';

export function useTheme(): Theme {
  const theme = use(ThemeContext);
  if (!theme) throw new Error('useTheme doit être utilisé sous <ThemeProvider>.');
  return theme;
}
