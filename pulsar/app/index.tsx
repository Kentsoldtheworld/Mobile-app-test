import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GhostButton } from '@/src/components/GhostButton';
import { MascotPeek } from '@/src/components/MascotPeek';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { Screen } from '@/src/components/Screen';
import { useSessionStore } from '@/src/features/session/state/sessionStore';
import { colors, space } from '@/src/theme/tokens';

export default function WelcomeScreen() {
  const router = useRouter();
  const hasSeenWelcome = useSessionStore((s) => s.hasSeenWelcome);

  useEffect(() => {
    if (hasSeenWelcome) {
      router.replace('/modes');
    }
  }, [hasSeenWelcome, router]);

  const setHasSeenWelcome = useSessionStore((s) => s.setHasSeenWelcome);

  return (
    <Screen>
      <MascotPeek />
      <View style={styles.body}>
        <Text style={styles.title}>Welcome to Pulsar</Text>
        <Text style={styles.bodyText}>
          Stay in the app during focus. Break is your release. Come back on purpose after each break.
        </Text>
        <PrimaryButton
          title="Get started"
          onPress={() => {
            setHasSeenWelcome(true);
            router.push('/modes');
          }}
          style={styles.cta}
        />
        <GhostButton
          title="Session history"
          onPress={() => router.push('/history')}
          style={styles.secondary}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: space.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.starYellow,
    letterSpacing: 0.2,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  cta: {
    marginTop: space.md,
  },
  secondary: {
    marginTop: space.sm,
  },
});
