import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionLifecycleRoot } from '@/src/features/session/hooks/SessionLifecycleRoot';
import { pulsarNavigationDarkTheme } from '@/src/theme/navigationTheme';
import { colors } from '@/src/theme/tokens';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={pulsarNavigationDarkTheme}>
      <SafeAreaProvider>
        <SessionLifecycleRoot>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerShadowVisible: false,
              headerTintColor: colors.mint,
              headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
              contentStyle: { backgroundColor: colors.background },
            }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="modes" options={{ title: 'Choose a mode' }} />
            <Stack.Screen name="session" options={{ title: 'Session' }} />
            <Stack.Screen name="history" options={{ title: 'History' }} />
          </Stack>
        </SessionLifecycleRoot>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
