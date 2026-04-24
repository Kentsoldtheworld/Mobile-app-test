import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CosmicBackground } from '@/src/components/CosmicBackground';
import { GhostButton } from '@/src/components/GhostButton';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { playAlarm } from '@/src/features/session/audio/alarmPlayer';
import { formatSessionRemaining } from '@/src/features/session/formatRemaining';
import { useSessionStore } from '@/src/features/session/state/sessionStore';
import { colors, radii, space } from '@/src/theme/tokens';

const BLUE = '#5F86FF';

// ── Minimal close button ──────────────────────────────────────────────────────
function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityLabel="Exit focus session"
      accessibilityRole="button"
      style={({ pressed }) => [s.closeBtn, pressed && s.closeBtnPressed]}>
      <Text style={s.closeBtnText}>✕</Text>
    </Pressable>
  );
}

// ── "Are you sure?" overlay ───────────────────────────────────────────────────
function ExitOverlay({ onNevermind, onConfirm }: { onNevermind: () => void; onConfirm: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [opacity]);

  return (
    <Animated.View style={[s.overlayBackdrop, { opacity }]}>
      <View style={s.overlayCard}>
        <Text style={s.overlayHeading}>are you sure you want to exit?</Text>
        <Text style={s.overlayBody}>your focus timer will skip to break if you leave.</Text>
        <PrimaryButton title="yeah, I'm sure" onPress={onConfirm} style={s.overlayCTA} />
        <GhostButton title="nevermind" onPress={onNevermind} style={s.overlayGhost} />
      </View>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SessionScreen() {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const reconcile = useSessionStore((s) => s.reconcile);
  const startBreak = useSessionStore((s) => s.startBreak);
  const skipToBreak = useSessionStore((s) => s.skipToBreak);
  const startNextRound = useSessionStore((s) => s.startNextRound);
  const resetSessionToIdle = useSessionStore((s) => s.resetSessionToIdle);

  const [confirmExit, setConfirmExit] = useState(false);
  const [tick, setTick] = useState(0);
  const prevStateRef = useRef(session.state);

  // Drive countdown timer
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      reconcile();
    }, 1000);
    return () => clearInterval(id);
  }, [reconcile]);

  const remaining = useMemo(() => {
    void tick;
    return formatSessionRemaining(session, Date.now());
  }, [session, tick]);

  // Play alarm when focus ends or break ends
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = session.state;
    if (
      (prev === 'focus_active' && session.state === 'focus_complete') ||
      (prev === 'break_active' && session.state === 'completed')
    ) {
      void playAlarm();
    }
  }, [session.state]);

  // Redirect to modes if no active session
  useEffect(() => {
    if (session.state === 'idle') {
      router.replace('/modes');
    }
  }, [session.state, router]);

  if (session.state === 'idle') return null;

  // ── focus_active ─────────────────────────────────────────────────────────
  if (session.state === 'focus_active') {
    return (
      <CosmicBackground>
        <SafeAreaView style={s.safe}>
          <View style={s.focusRoot}>
            {/* Close button top-right */}
            <View style={s.closeRow}>
              <CloseButton onPress={() => setConfirmExit(true)} />
            </View>

            {/* Centered label + countdown */}
            <View style={s.centerContent}>
              <Text style={s.focusLabel}>in focus...</Text>
              {remaining ? <Text style={s.focusTimer}>{remaining}</Text> : null}
            </View>
          </View>

          {/* Exit confirmation overlay */}
          {confirmExit ? (
            <ExitOverlay
              onNevermind={() => setConfirmExit(false)}
              onConfirm={() => {
                setConfirmExit(false);
                skipToBreak();
              }}
            />
          ) : null}
        </SafeAreaView>
      </CosmicBackground>
    );
  }

  // ── focus_complete ───────────────────────────────────────────────────────
  if (session.state === 'focus_complete') {
    return (
      <CosmicBackground>
        <SafeAreaView style={s.safe}>
          <View style={s.stateRoot}>
            <View style={s.centerContent}>
              <Text style={s.stateHeading}>focus complete</Text>
              <Text style={s.stateSubtext}>Take a well-earned break.</Text>
            </View>
            <View style={s.bottomCTA}>
              <PrimaryButton title="Start break" onPress={startBreak} />
            </View>
          </View>
        </SafeAreaView>
      </CosmicBackground>
    );
  }

  // ── break_active ─────────────────────────────────────────────────────────
  if (session.state === 'break_active') {
    return (
      <CosmicBackground>
        <SafeAreaView style={s.safe}>
          <View style={s.stateRoot}>
            <View style={s.centerContent}>
              <Text style={[s.stateHeading, { color: BLUE }]}>on break</Text>
              {remaining ? <Text style={s.breakTimer}>{remaining}</Text> : null}
            </View>
            <View style={s.bottomCTA}>
              <GhostButton
                title="Skip break"
                onPress={() => {
                  resetSessionToIdle();
                  router.replace('/modes');
                }}
              />
            </View>
          </View>
        </SafeAreaView>
      </CosmicBackground>
    );
  }

  // ── completed ────────────────────────────────────────────────────────────
  if (session.state === 'completed') {
    return (
      <CosmicBackground>
        <SafeAreaView style={s.safe}>
          <View style={s.stateRoot}>
            <View style={s.centerContent}>
              <Text style={s.stateHeading}>break complete</Text>
              <Text style={s.stateSubtext}>Ready for your next round?</Text>
            </View>
            <View style={s.bottomCTA}>
              <PrimaryButton title="Start next round" onPress={startNextRound} />
              <GhostButton
                title="Back to modes"
                onPress={() => {
                  resetSessionToIdle();
                  router.replace('/modes');
                }}
                style={{ marginTop: space.sm }}
              />
            </View>
          </View>
        </SafeAreaView>
      </CosmicBackground>
    );
  }

  // ── destabilized ─────────────────────────────────────────────────────────
  return (
    <CosmicBackground>
      <SafeAreaView style={s.safe}>
        <View style={s.stateRoot}>
          <View style={s.centerContent}>
            <Text style={[s.stateHeading, { color: colors.starYellow }]}>session lost</Text>
            <Text style={s.stateSubtext}>You stepped away during focus. That's okay — take your time.</Text>
          </View>
          <View style={s.bottomCTA}>
            <PrimaryButton
              title="Reset"
              onPress={() => {
                resetSessionToIdle();
                router.replace('/modes');
              }}
            />
          </View>
        </View>
      </SafeAreaView>
    </CosmicBackground>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  focusRoot: {
    flex: 1,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },
  stateRoot: {
    flex: 1,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },

  // Close button
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: space.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  closeBtnText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Center content
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // focus_active
  focusLabel: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.mint,
    letterSpacing: 0.5,
  },
  focusTimer: {
    marginTop: space.md,
    fontSize: 52,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.40)',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },

  // break_active
  breakTimer: {
    marginTop: space.md,
    fontSize: 52,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },

  // shared state headings
  stateHeading: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.mint,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  stateSubtext: {
    marginTop: space.sm,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // CTA area
  bottomCTA: {
    paddingBottom: space.xl,
  },

  // Exit overlay
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  overlayCard: {
    width: '100%',
    backgroundColor: '#1D263B',
    borderRadius: radii.lg,
    padding: space.xl,
    alignItems: 'center',
  },
  overlayHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  overlayBody: {
    marginTop: space.sm,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  overlayCTA: {
    marginTop: space.xl,
    width: '100%',
  },
  overlayGhost: {
    marginTop: space.sm,
  },
});
