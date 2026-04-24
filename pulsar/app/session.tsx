import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GhostButton } from '@/src/components/GhostButton';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { Screen } from '@/src/components/Screen';
import { formatSessionRemaining } from '@/src/features/session/formatRemaining';
import { useSessionStore } from '@/src/features/session/state/sessionStore';
import { colors, space } from '@/src/theme/tokens';

export default function SessionScreen() {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const reset = useSessionStore((s) => s.resetSessionToIdle);
  const reconcile = useSessionStore((s) => s.reconcile);
  const startNext = useSessionStore((s) => s.startNextSessionAfterCompletedFlow);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = useMemo(() => {
    void tick;
    return formatSessionRemaining(session, Date.now());
  }, [session, tick]);

  if (session.state === 'idle') {
    return (
      <Screen>
        <Text style={styles.title}>No active session</Text>
        <Text style={styles.body}>Choose a mode to begin.</Text>
        <PrimaryButton title="Pick a mode" onPress={() => router.push('/modes')} style={styles.cta} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.kicker}>STATE</Text>
      <Text style={styles.state}>{session.state}</Text>
      {remaining ? (
        <Text style={styles.timer}>
          {session.state === 'focus_active' ? 'Focus' : 'Break'} · {remaining}
        </Text>
      ) : (
        <Text style={styles.timerMuted}>Timer labels apply during focus and break only.</Text>
      )}
      <Text style={styles.hint}>
        During focus, leave the app (home gesture) to test destabilization. Break allows leaving freely.
      </Text>
      <View style={styles.actions}>
        <GhostButton title="Reconcile now" onPress={() => reconcile()} />
        <GhostButton title="View history" onPress={() => router.push('/history')} style={styles.gap} />
        <GhostButton title="Reset to idle" onPress={() => reset()} style={styles.gap} />
        {session.state === 'completed' ? (
          <PrimaryButton
            title="Start next (25 / 5)"
            style={styles.gap}
            onPress={() => {
              startNext('pomodoro');
            }}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  body: {
    marginTop: space.sm,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  cta: {
    marginTop: space.xl,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
  state: {
    marginTop: space.xs,
    fontSize: 20,
    fontWeight: '800',
    color: colors.mint,
    textTransform: 'uppercase',
  },
  timer: {
    marginTop: space.lg,
    fontSize: 34,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timerMuted: {
    marginTop: space.lg,
    fontSize: 15,
    color: colors.textMuted,
  },
  hint: {
    marginTop: space.lg,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  actions: {
    marginTop: space.xl,
    gap: 0,
  },
  gap: {
    marginTop: space.md,
  },
});
