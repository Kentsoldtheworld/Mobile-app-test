import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CosmicBackground } from '@/src/components/CosmicBackground';
import { GhostButton } from '@/src/components/GhostButton';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { SessionSummaryCard } from '@/src/components/SessionSummaryCard';
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

// ── "End session?" overlay (focus) ───────────────────────────────────────────
function ExitOverlay({ onNevermind, onConfirm }: { onNevermind: () => void; onConfirm: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [opacity]);

  return (
    <Animated.View style={[s.overlayBackdrop, { opacity }]}>
      <View style={s.overlayCard}>
        <Text style={s.overlayHeading}>end your session?</Text>
        <Text style={s.overlayBody}>your progress will be lost.</Text>
        <PrimaryButton title="end session" onPress={onConfirm} style={s.overlayCTA} />
        <GhostButton title="nevermind, keep going" onPress={onNevermind} style={s.overlayGhost} />
      </View>
    </Animated.View>
  );
}

// ── "Leave break?" overlay ────────────────────────────────────────────────────
function BreakExitOverlay({ onStay, onEnd }: { onStay: () => void; onEnd: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [opacity]);

  return (
    <Animated.View style={[s.overlayBackdrop, { opacity }]}>
      <View style={s.overlayCard}>
        <Text style={s.overlayHeading}>want to leave your break?</Text>
        <Text style={s.overlayBody}>
          {'Tapping any button here will end the session.\n\nIf you actually need to step away, just close the app — you\'ll get a notification when your break is over and can come back then.'}
        </Text>
        <PrimaryButton title="end session" onPress={onEnd} style={s.overlayCTA} />
        <GhostButton title="stay on break" onPress={onStay} style={s.overlayGhost} />
      </View>
    </Animated.View>
  );
}

// ── Live full-session block bar ───────────────────────────────────────────────
// Renders every planned cycle (focus + break) so the user always sees the
// complete session layout. Past cycles are fully lit; the current block pulses;
// future blocks are dim.
import type { PulsarSession } from '@/src/features/session/domain/types';

const BLOCK_MS = 5 * 60 * 1000;
const BLOCK_GAP = 3;
const CYCLE_SEP = 0; // no gap between cycles — color contrast is enough

function LiveBlockBar({ session }: { session: PulsarSession }) {
  const [barWidth, setBarWidth] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusPerCycle = Math.max(1, Math.ceil(session.focusDurationMs / BLOCK_MS));
  const breakPerCycle = Math.max(1, Math.ceil(session.breakDurationMs / BLOCK_MS));
  const plannedCycles = session.plannedCycles ?? 1;
  const currentCycle = session.currentCycle ?? 1; // 1-indexed
  const isFocusActive = session.state === 'focus_active';

  // Tile sizing: fit one row per cycle if few cycles, else wrap
  const blocksPerCycle = focusPerCycle + breakPerCycle;
  const totalBlocks = blocksPerCycle * plannedCycles;
  const perRow = Math.min(totalBlocks, 12);
  const tileSize =
    barWidth > 0
      ? Math.min(36, Math.max(8, Math.floor((barWidth - BLOCK_GAP * (perRow - 1)) / perRow)))
      : 0;

  const block = (key: string, color: string, opacity: number) => (
    <View key={key} style={{ width: tileSize, height: tileSize, borderRadius: 4, marginRight: BLOCK_GAP, marginBottom: BLOCK_GAP, backgroundColor: color, opacity }} />
  );
  const blockAnim = (key: string, color: string) => (
    <Animated.View key={key} style={{ width: tileSize, height: tileSize, borderRadius: 4, marginRight: BLOCK_GAP, marginBottom: BLOCK_GAP, backgroundColor: color, opacity: pulse }} />
  );

  const now = Date.now();
  const tiles: React.ReactElement[] = [];

  for (let c = 1; c <= plannedCycles; c++) {
    const isPast = c < currentCycle;
    const isCurrent = c === currentCycle;

    // ── Focus blocks for this cycle ──
    if (isPast) {
      for (let i = 0; i < focusPerCycle; i++) tiles.push(block(`f${c}-${i}`, colors.mint, 0.85));
    } else if (isCurrent && isFocusActive) {
      const elapsed = session.focusStartedAt ? Math.max(0, now - session.focusStartedAt) : 0;
      const doneCount = Math.min(focusPerCycle - 1, Math.floor(elapsed / BLOCK_MS));
      for (let i = 0; i < doneCount; i++) tiles.push(block(`f${c}-${i}`, colors.mint, 0.85));
      tiles.push(blockAnim(`f${c}-cur`, colors.mint));
      for (let i = doneCount + 1; i < focusPerCycle; i++) tiles.push(block(`f${c}-${i}`, colors.mint, 0.12));
    } else if (isCurrent && !isFocusActive) {
      // break_active — focus done for this cycle
      for (let i = 0; i < focusPerCycle; i++) tiles.push(block(`f${c}-${i}`, colors.mint, 0.85));
    } else {
      // future cycle
      for (let i = 0; i < focusPerCycle; i++) tiles.push(block(`f${c}-${i}`, colors.mint, 0.12));
    }

    // ── Break blocks for this cycle ──
    if (isPast) {
      for (let i = 0; i < breakPerCycle; i++) tiles.push(block(`b${c}-${i}`, BLUE, 0.85));
    } else if (isCurrent && !isFocusActive) {
      const elapsed = session.breakStartedAt ? Math.max(0, now - session.breakStartedAt) : 0;
      const doneCount = Math.min(breakPerCycle - 1, Math.floor(elapsed / BLOCK_MS));
      for (let i = 0; i < doneCount; i++) tiles.push(block(`b${c}-${i}`, BLUE, 0.85));
      tiles.push(blockAnim(`b${c}-cur`, BLUE));
      for (let i = doneCount + 1; i < breakPerCycle; i++) tiles.push(block(`b${c}-${i}`, BLUE, 0.12));
    } else {
      // focus_active current cycle or any future cycle — break not yet reached
      for (let i = 0; i < breakPerCycle; i++) tiles.push(block(`b${c}-${i}`, BLUE, 0.12));
    }

  }

  return (
    <View style={lb.bar} onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}>
      {tileSize > 0 ? tiles : null}
    </View>
  );
}

const lb = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: space.xl,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SessionScreen() {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const history = useSessionStore((s) => s.history);
  const reconcile = useSessionStore((s) => s.reconcile);
  const startBreak = useSessionStore((s) => s.startBreak);
  const skipBreak = useSessionStore((s) => s.skipBreak);
  const startNextRound = useSessionStore((s) => s.startNextRound);
  const resetSessionToIdle = useSessionStore((s) => s.resetSessionToIdle);

  const lastRecord = history.length > 0 ? history[history.length - 1] : null;

  const [confirmExit, setConfirmExit] = useState(false);
  const [confirmBreakExit, setConfirmBreakExit] = useState(false);
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

  // Redirect home if no active session
  useEffect(() => {
    if (session.state === 'idle') {
      router.replace('/');
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

            {/* Centered label + countdown + live blocks */}
            <View style={s.centerContent}>
              <Text style={s.focusLabel}>in focus...</Text>
              {remaining ? <Text style={s.focusTimer}>{remaining}</Text> : null}
              <LiveBlockBar session={session} />
            </View>
          </View>

          {/* Exit confirmation overlay */}
          {confirmExit ? (
            <ExitOverlay
              onNevermind={() => setConfirmExit(false)}
              onConfirm={() => {
                setConfirmExit(false);
                resetSessionToIdle();
                router.replace('/');
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
          <View style={s.focusRoot}>
            <View style={s.closeRow}>
              <CloseButton onPress={() => setConfirmBreakExit(true)} />
            </View>
            <View style={s.centerContent}>
              <Text style={[s.stateHeading, { color: BLUE }]}>on break</Text>
              {remaining ? <Text style={s.breakTimer}>{remaining}</Text> : null}
              <LiveBlockBar session={session} />
            </View>
            <View style={s.bottomCTA}>
              <GhostButton title="Skip break" onPress={skipBreak} />
            </View>
          </View>

          {confirmBreakExit ? (
            <BreakExitOverlay
              onStay={() => setConfirmBreakExit(false)}
              onEnd={() => {
                setConfirmBreakExit(false);
                resetSessionToIdle();
                router.replace('/');
              }}
            />
          ) : null}
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
              {lastRecord ? (
                <SessionSummaryCard record={lastRecord} />
              ) : (
                <>
                  <Text style={s.stateHeading}>break complete</Text>
                  <Text style={s.stateSubtext}>Ready for your next round?</Text>
                </>
              )}
            </View>
            <View style={s.bottomCTA}>
              <PrimaryButton
                title="Return home"
                onPress={() => {
                  resetSessionToIdle();
                  router.replace('/');
                }}
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
            {lastRecord ? (
              <SessionSummaryCard record={lastRecord} />
            ) : (
              <>
                <Text style={[s.stateHeading, { color: colors.starYellow }]}>session lost</Text>
                <Text style={s.stateSubtext}>You stepped away during focus.</Text>
              </>
            )}
          </View>
          <View style={s.bottomCTA}>
            <PrimaryButton
              title="Return home"
              onPress={() => {
                resetSessionToIdle();
                router.replace('/');
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
    alignItems: 'stretch',
    justifyContent: 'center',
  },

  // focus_active
  focusLabel: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.mint,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  focusTimer: {
    marginTop: space.md,
    fontSize: 52,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.40)',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },

  // break_active
  breakTimer: {
    marginTop: space.md,
    fontSize: 52,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
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
    width: '100%',
  },
});
