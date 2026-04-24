import { DarkTheme, type Theme } from '@react-navigation/native';

import { colors } from '@/src/theme/tokens';

export const pulsarNavigationDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.mint,
    background: colors.background,
    card: colors.backgroundElevated,
    text: colors.textPrimary,
    border: 'rgba(255,255,255,0.08)',
    notification: colors.mint,
  },
};
