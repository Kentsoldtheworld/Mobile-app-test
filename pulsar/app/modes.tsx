import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DurationSlider } from '@/src/components/DurationSlider';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { Screen } from '@/src/components/Screen';
import { PRESETS, type PresetId } from '@/src/features/session/presets';
import { useSessionStore } from '@/src/features/session/state/sessionStore';
import { colors, radii, space } from '@/src/theme/tokens';

// ─── constants ───────────────────────────────────────────────────────────────
const PRESET_ORDER: PresetId[] = ['frequent', 'balanced', 'minimal'];
const CYCLES_MIN = 1;
const CYCLES_MAX = 8;
const BLOCK_MIN = 8;  // px — square size at small counts
const BLOCK_MAX = 13; // px — square size at small counts

// ─── helpers ─────────────────────────────────────────────────────────────────
function formatTotalTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m}m`;
}

function matchPreset(focus: number, brk: number): PresetId | null {
  for (const id of PRESET_ORDER) {
    const p = PRESETS[id];
    if (
      Math.round(p.focusDurationMs / 60000) === focus &&
      Math.round(p.breakDurationMs / 60000) === brk
    ) return id;
  }
  return null;
}

// ─── session grid ─────────────────────────────────────────────────────────────
function SessionGrid({ focusMin, breakMin, cycles }: { focusMin: number; breakMin: number; cycles: number }) {
  const focusBlocks = Math.max(1, Math.round(focusMin / 5));
  const breakBlocks = Math.max(1, Math.round(breakMin / 5));
  const perCycle = focusBlocks + breakBlocks;
  const total = perCycle * cycles;

  // Scale tile size down when there are lots of blocks
  const tileSize = total > 36 ? BLOCK_MIN : BLOCK_MAX;
  const gap = 3;

  const tiles = useMemo(() => {
    const arr: { isFocus: boolean }[] = [];
    for (let c = 0; c < cycles; c++) {
      for (let f = 0; f < focusBlocks; f++) arr.push({ isFocus: true });
      for (let b = 0; b < breakBlocks; b++) arr.push({ isFocus: false });
    }
    return arr;
  }, [focusBlocks, breakBlocks, cycles]);

  return (
    <View>
      <View style={s.gridRow}>
        {tiles.map((tile, i) => (
          <View
            key={i}
            style={[
              s.tile,
              {
                width: tileSize,
                height: tileSize,
                borderRadius: 3,
                marginRight: gap,
                marginBottom: gap,
              },
              tile.isFocus ? s.tileFocus : s.tileBreak,
            ]}
          />
        ))}
      </View>
      <View style={s.gridLegend}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, s.tileFocus]} />
          <Text style={s.legendText}>Focus ({focusBlocks * 5}m)</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, s.tileBreak]} />
          <Text style={s.legendText}>Break ({breakBlocks * 5}m)</Text>
        </View>
        {cycles > 1 && (
          <Text style={s.legendTotal}>
            {focusMin * cycles}m focus · {breakMin * cycles}m break total
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── screen ──────────────────────────────────────────────────────────────────
export default function ModesScreen() {
  const router = useRouter();
  const startCustomMinutes = useSessionStore((st) => st.startSessionCustomMinutes);

  const [focusMin, setFocusMin] = useState(20);
  const [breakMin, setBreakMin] = useState(5);
  const [cycles, setCycles] = useState(1);

  const activePreset = matchPreset(focusMin, breakMin);

  const applyPreset = (id: PresetId) => {
    setFocusMin(Math.round(PRESETS[id].focusDurationMs / 60000));
    setBreakMin(Math.round(PRESETS[id].breakDurationMs / 60000));
  };

  const startSession = () => {
    startCustomMinutes(focusMin, breakMin, cycles);
    router.replace('/session');
  };

  const totalMin = (focusMin + breakMin) * cycles;
  const startLabel = `Start ${formatTotalTime(totalMin)} session`;

  return (
    <Screen>
      <View style={s.root}>

        {/* ── Preset chips ── */}
        <View style={s.section}>
          <Text style={s.eyebrow}>Mode</Text>
          <View style={s.chipRow}>
            {PRESET_ORDER.map((id) => {
              const sel = activePreset === id;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: sel }}
                  onPress={() => applyPreset(id)}
                  style={({ pressed }) => [s.chip, sel && s.chipSel, pressed && s.chipPress]}>
                  <Text style={[s.chipTxt, sel && s.chipTxtSel]}>
                    {PRESETS[id].label.replace(' breaks', '')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Sliders ── */}
        <View style={s.section}>
          <DurationSlider
            label="Focus"
            value={focusMin}
            min={5}
            max={60}
            step={5}
            onChange={setFocusMin}
          />
          <DurationSlider
            label="Break"
            value={breakMin}
            min={5}
            max={60}
            step={5}
            onChange={setBreakMin}
          />
        </View>

        {/* ── Cycles stepper ── */}
        <View style={s.section}>
          <View style={s.cyclesRow}>
            <Text style={s.cyclesLabel}>Cycles</Text>
            <View style={s.cyclesControls}>
              <Pressable
                onPress={() => setCycles((v) => Math.max(CYCLES_MIN, v - 1))}
                disabled={cycles <= CYCLES_MIN}
                accessibilityRole="button"
                style={({ pressed }) => [
                  s.stepBtn,
                  pressed && s.stepBtnPressed,
                  cycles <= CYCLES_MIN && s.stepBtnDisabled,
                ]}>
                <Text style={s.stepBtnText}>−</Text>
              </Pressable>
              <Text style={s.cyclesValue}>{cycles}×</Text>
              <Pressable
                onPress={() => setCycles((v) => Math.min(CYCLES_MAX, v + 1))}
                disabled={cycles >= CYCLES_MAX}
                accessibilityRole="button"
                style={({ pressed }) => [
                  s.stepBtn,
                  pressed && s.stepBtnPressed,
                  cycles >= CYCLES_MAX && s.stepBtnDisabled,
                ]}>
                <Text style={s.stepBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── Session grid ── */}
        <View style={s.section}>
          <Text style={s.eyebrow}>Session</Text>
          <SessionGrid focusMin={focusMin} breakMin={breakMin} cycles={cycles} />
        </View>

        <View style={s.spacer} />

        <PrimaryButton title={startLabel} onPress={startSession} />
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
  section: {
    marginTop: space.lg,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: 6,
  },
  // chips
  chipRow: {
    flexDirection: 'row',
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
  // cycles stepper
  cyclesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cyclesLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cyclesControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  cyclesValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 36,
    textAlign: 'center',
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
  // session grid
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tile: {
    borderRadius: 3,
  },
  tileFocus: {
    backgroundColor: colors.mint,
    opacity: 0.85,
  },
  tileBreak: {
    backgroundColor: colors.starYellow,
    opacity: 0.7,
  },
  gridLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 14,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  legendTotal: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    width: '100%',
  },
  spacer: {
    flex: 1,
  },
});
