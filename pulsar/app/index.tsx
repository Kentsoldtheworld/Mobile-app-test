import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { GhostButton } from '@/src/components/GhostButton';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { Screen } from '@/src/components/Screen';
import { useSessionStore } from '@/src/features/session/state/sessionStore';
import { colors, space } from '@/src/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);

  const hasActiveSession =
    session.state === 'focus_active' ||
    session.state === 'focus_complete' ||
    session.state === 'break_active';

  return (
    <Screen>
      <View style={s.root}>
        {/* Wordmark / title */}
        <View style={s.top}>
          <Text style={s.wordmark}>pulsar</Text>
          <Text style={s.tagline}>stay in focus. take your breaks.</Text>
        </View>

        {/* CTAs */}
        <View style={s.actions}>
          {hasActiveSession ? (
            <PrimaryButton
              title="Resume session"
              onPress={() => router.push('/session')}
            />
          ) : (
            <PrimaryButton
              title="Start a session"
              onPress={() => router.push('/modes')}
            />
          )}
          <GhostButton
            title="Session history"
            onPress={() => router.push('/history')}
            style={s.secondary}
          />
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: space.xl,
  },
  top: {
    flex: 1,
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.mint,
    letterSpacing: -1,
  },
  tagline: {
    marginTop: space.sm,
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  actions: {
    gap: space.sm,
  },
  secondary: {
    marginTop: 0,
  },
});
