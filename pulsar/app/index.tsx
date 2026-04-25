import { useRouter } from 'expo-router';
import { ClockCounterClockwise, Lightning, Play } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fermi, type Expression } from '@/src/components/Fermi';
import { GhostButton } from '@/src/components/GhostButton';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { Screen } from '@/src/components/Screen';
import { useSessionStore } from '@/src/features/session/state/sessionStore';
import { colors, space } from '@/src/theme/tokens';

const EXPRESSIONS: Expression[] = ['default', 'happy', 'bored', 'angry'];

export default function HomeScreen() {
  const router = useRouter();
  const session = useSessionStore((st) => st.session);

  const [expressionIdx, setExpressionIdx] = useState(0);
  const expression = EXPRESSIONS[expressionIdx];

  const cycleExpression = () => {
    setExpressionIdx((i) => (i + 1) % EXPRESSIONS.length);
  };

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

        {/* Fermi proof-of-concept */}
        <View style={s.fermiArea}>
          <Pressable
            onPress={cycleExpression}
            accessibilityRole="button"
            accessibilityLabel={`Fermi expression: ${expression}. Tap to cycle.`}
            style={({ pressed }) => [s.fermiPress, pressed && s.fermiPressed]}>
            <Fermi expression={expression} size={220} />
            <Text style={s.fermiLabel}>{expression}</Text>
          </Pressable>
        </View>

        {/* CTAs */}
        <View style={s.actions}>
          {hasActiveSession ? (
            <PrimaryButton
              title="Resume session"
              icon={<Play size={18} weight="duotone" color={colors.background} />}
              onPress={() => router.push('/session')}
            />
          ) : (
            <PrimaryButton
              title="Start a session"
              icon={<Lightning size={18} weight="duotone" color={colors.background} />}
              onPress={() => router.push('/modes')}
            />
          )}
          <GhostButton
            title="Session history"
            icon={<ClockCounterClockwise size={18} weight="duotone" color={colors.mint} />}
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
    paddingTop: space.lg,
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
  fermiArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fermiPress: {
    alignItems: 'center',
    paddingVertical: space.md,
  },
  fermiPressed: {
    opacity: 0.85,
  },
  fermiLabel: {
    marginTop: space.md,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  actions: {
    gap: space.sm,
  },
  secondary: {
    marginTop: 0,
  },
});
