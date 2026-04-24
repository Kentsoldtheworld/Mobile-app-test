import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BalanceBar } from '@/src/components/BalanceBar';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { Screen } from '@/src/components/Screen';
import { PRESETS, type PresetId } from '@/src/features/session/presets';
import { useSessionStore } from '@/src/features/session/state/sessionStore';
import { colors, radii, space } from '@/src/theme/tokens';

// ─── constants ───────────────────────────────────────────────────────────────
const PRESET_ORDER: PresetId[] = ['frequent', 'balanced', 'minimal'];
const ROUND_MIN = 10;
const ROUND_MAX = 120;
const ROUND_STEP = 5;
const ROTATIONS_MIN = 1;
const ROTATIONS_MAX = 8;
const RATIO_MIN = 0.1;
const RATIO_MAX = 0.92;

// ─── stepper ─────────────────────────────────────────────────────────────────
type StepperRowProps = {
  label: string;
  value: string;
  onDec: () => void;
  onInc: () => void;
  decDisabled?: boolean;
  incDisabled?: boolean;
};

function StepperRow({ label, value, onDec, onInc, decDisabled, incDisabled }: StepperRowProps) {
  return (
    <View style={s.stepperRow}>
      <Text style={s.stepperLabel}>{label}</Text>
      <View style={s.stepperControls}>
        <Pressable
          onPress={onDec}
          disabled={decDisabled}
          accessibilityRole="button"
          style={({ pressed }) => [s.stepBtn, pressed && s.stepBtnPressed, decDisabled && s.stepBtnDisabled]}>
          <Text style={s.stepBtnText}>−</Text>
        </Pressable>
        <Text style={s.stepperValue}>{value}</Text>
        <Pressable
          onPress={onInc}
          disabled={incDisabled}
          accessibilityRole="button"
          style={({ pressed }) => [s.stepBtn, pressed && s.stepBtnPressed, incDisabled && s.stepBtnDisabled]}>
          <Text style={s.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── screen ──────────────────────────────────────────────────────────────────
type ModeSelection = { kind: 'preset'; id: PresetId } | { kind: 'custom' };

export default function ModesScreen() {
  const router = useRouter();
  const startPreset = useSessionStore((st) => st.startSessionFromPreset);
  const startCustomMinutes = useSessionStore((st) => st.startSessionCustomMinutes);

  const [selectedMode, setSelectedMode] = useState<ModeSelection>({ kind: 'preset', id: 'balanced' });
  // Custom state: total minutes per round + focus ratio
  const [roundMinutes, setRoundMinutes] = useState(30);
  const [focusRatio, setFocusRatio] = useState(0.83);
  const [rotations, setRotations] = useState(1);

  // Derive focus/break from round + ratio
  const customFocus = Math.max(1, Math.min(roundMinutes - 1, Math.round(roundMinutes * focusRatio)));
  const customBreak = roundMinutes - customFocus;

  // What the bar currently shows
  const previewFocus =
    selectedMode.kind === 'custom'
      ? customFocus
      : Math.round(PRESETS[selectedMode.id].focusDurationMs / 60000);
  const previewBreak =
    selectedMode.kind === 'custom'
      ? customBreak
      : Math.round(PRESETS[selectedMode.id].breakDurationMs / 60000);

  // Seamlessly seed custom values from the current preset before switching
  const activateCustom = () => {
    if (selectedMode.kind !== 'custom') {
      const pf = Math.round(PRESETS[selectedMode.id].focusDurationMs / 60000);
      const pb = Math.round(PRESETS[selectedMode.id].breakDurationMs / 60000);
      const total = pf + pb;
      setRoundMinutes(Math.max(ROUND_MIN, Math.min(ROUND_MAX, total)));
      setFocusRatio(Math.max(RATIO_MIN, Math.min(RATIO_MAX, pf / total)));
      setSelectedMode({ kind: 'custom' });
    }
  };

  const onBarDrag = (ratio: number) => {
    activateCustom();
    setFocusRatio(ratio);
  };

  const startSession = () => {
    if (selectedMode.kind === 'custom') {
      startCustomMinutes(customFocus, customBreak);
    } else {
      startPreset(selectedMode.id);
    }
    router.push('/session');
  };

  const isCustom = selectedMode.kind === 'custom';

  return (
    <Screen>
      <View style={s.root}>
        {/* ── Chip row ── */}
        <View style={s.chipSection}>
          <Text style={s.eyebrow}>Mode</Text>
          <View style={s.chipRow}>
            {PRESET_ORDER.map((id) => {
              const sel = selectedMode.kind === 'preset' && selectedMode.id === id;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: sel }}
                  onPress={() => setSelectedMode({ kind: 'preset', id })}
                  style={({ pressed }) => [s.chip, sel && s.chipSel, pressed && s.chipPress]}>
                  <Text style={[s.chipTxt, sel && s.chipTxtSel]}>
                    {PRESETS[id].label.replace(' breaks', '')}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: isCustom }}
              onPress={() => activateCustom()}
              style={({ pressed }) => [s.chip, isCustom && s.chipSel, pressed && s.chipPress]}>
              <Text style={[s.chipTxt, isCustom && s.chipTxtSel]}>Custom</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Balance bar ── */}
        <View style={s.barSection}>
          <Text style={s.eyebrow}>Session balance</Text>
          <BalanceBar
            focusMinutes={previewFocus}
            breakMinutes={previewBreak}
            onRatioChange={onBarDrag}
          />
        </View>

        {/* ── Controls ── */}
        <View style={s.controlSection}>
          <StepperRow
            label="Round"
            value={`${roundMinutes}m`}
            onDec={() => { activateCustom(); setRoundMinutes((v) => Math.max(ROUND_MIN, v - ROUND_STEP)); }}
            onInc={() => { activateCustom(); setRoundMinutes((v) => Math.min(ROUND_MAX, v + ROUND_STEP)); }}
            decDisabled={roundMinutes <= ROUND_MIN}
            incDisabled={roundMinutes >= ROUND_MAX}
          />
          <StepperRow
            label="Rounds"
            value={`${rotations}×`}
            onDec={() => { activateCustom(); setRotations((v) => Math.max(ROTATIONS_MIN, v - 1)); }}
            onInc={() => { activateCustom(); setRotations((v) => Math.min(ROTATIONS_MAX, v + 1)); }}
            decDisabled={rotations <= ROTATIONS_MIN}
            incDisabled={rotations >= ROTATIONS_MAX}
          />
          {rotations > 1 ? (
            <Text style={s.totalHint}>
              {customFocus * rotations}m focus · {customBreak * rotations}m break over {rotations} rounds
            </Text>
          ) : null}
        </View>

        <View style={s.spacer} />

        <PrimaryButton
          title={isCustom ? 'Start custom session' : `Start ${PRESETS[selectedMode.id].label.toLowerCase()}`}
          onPress={startSession}
        />
      </View>
    </Screen>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    paddingBottom: space.lg,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: 4,
  },
  // chips
  chipSection: {
    marginTop: space.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: colors.backgroundElevated,
  },
  chipSel: {
    borderColor: colors.mint,
    backgroundColor: 'rgba(66,255,169,0.14)',
  },
  chipPress: {
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  chipTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTxtSel: {
    color: colors.mint,
  },
  // bar
  barSection: {
    marginTop: space.lg,
  },
  // controls
  controlSection: {
    marginTop: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  stepperLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  stepBtnPressed: {
    backgroundColor: 'rgba(66,255,169,0.18)',
  },
  stepBtnDisabled: {
    opacity: 0.3,
  },
  stepBtnText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 48,
    textAlign: 'center',
  },
  totalHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
    paddingBottom: 4,
  },
  spacer: {
    flex: 1,
  },
});
