import { useRef, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { colors, radii, space } from '@/src/theme/tokens';

type BalanceBarProps = {
  focusMinutes: number;
  breakMinutes: number;
  /** Always fires when user drags the handle. */
  onRatioChange: (ratio: number) => void;
};

const RATIO_MIN = 0.1;
const RATIO_MAX = 0.92;
const HANDLE_W = 26;
const BAR_H = 36;
const TOUCH_H = 60;

export function BalanceBar({ focusMinutes, breakMinutes, onRatioChange }: BalanceBarProps) {
  const [barWidth, setBarWidth] = useState(1);
  const barPageX = useRef(0);
  const barRef = useRef<View>(null);

  const total = Math.max(1, focusMinutes + breakMinutes);
  const focusRatio = focusMinutes / total;
  const focusPercent = Math.round(focusRatio * 100);
  const breakPercent = 100 - focusPercent;

  const handleLeft = Math.max(0, Math.min(barWidth - HANDLE_W, barWidth * focusRatio - HANDLE_W / 2));

  const onLayout = (event: LayoutChangeEvent) => {
    const w = Math.max(1, event.nativeEvent.layout.width);
    setBarWidth(w);
    barRef.current?.measure((_x, _y, _bw, _bh, px) => {
      barPageX.current = px;
    });
  };

  const updateFromPageX = (pageX: number) => {
    const localX = pageX - barPageX.current;
    const ratio = Math.max(RATIO_MIN, Math.min(RATIO_MAX, localX / Math.max(1, barWidth)));
    onRatioChange(ratio);
  };

  return (
    <View style={styles.wrapper}>
      {/* Stat row */}
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, styles.statDotFocus]} />
          <Text style={styles.statText}>
            Focus <Text style={styles.statBold}>{focusMinutes}m</Text>
            <Text style={styles.statPercent}> {focusPercent}%</Text>
          </Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, styles.statDotBreak]} />
          <Text style={styles.statText}>
            Break <Text style={styles.statBold}>{breakMinutes}m</Text>
            <Text style={styles.statPercent}> {breakPercent}%</Text>
          </Text>
        </View>
      </View>

      {/* Touch target — always draggable */}
      <View
        ref={barRef}
        onLayout={onLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => updateFromPageX(e.nativeEvent.pageX)}
        onResponderMove={(e) => updateFromPageX(e.nativeEvent.pageX)}
        style={styles.touchTarget}>

        {/* Colored segments — clipped */}
        <View style={styles.barTrack}>
          <View style={[styles.focusSegment, { flex: focusMinutes }]} />
          <View style={[styles.breakSegment, { flex: breakMinutes }]} />
        </View>

        {/* Handle — floats above the bar, never clipped */}
        <View style={[styles.handle, { left: handleLeft }]}>
          <View style={styles.handleLine} />
          <View style={styles.handleLine} />
          <View style={styles.handleLine} />
        </View>
      </View>

      <Text style={styles.dragHint}>Drag to adjust ratio</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: space.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  statDotFocus: {
    backgroundColor: colors.mint,
  },
  statDotBreak: {
    backgroundColor: '#5F86FF',
  },
  statText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statBold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statPercent: {
    fontSize: 12,
    color: colors.textMuted,
  },
  touchTarget: {
    height: TOUCH_H,
    justifyContent: 'center',
    position: 'relative',
  },
  barTrack: {
    height: BAR_H,
    borderRadius: radii.md,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  focusSegment: {
    backgroundColor: colors.mint,
  },
  breakSegment: {
    backgroundColor: '#5F86FF',
  },
  handle: {
    position: 'absolute',
    width: HANDLE_W,
    height: TOUCH_H - 6,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  handleLine: {
    width: 10,
    height: 2,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  dragHint: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
