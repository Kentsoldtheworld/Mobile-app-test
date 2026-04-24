import { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type GestureResponderEvent,
} from 'react-native';

import { colors, radii, space } from '@/src/theme/tokens';

type DurationSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function getSteppedValue(raw: number, min: number, max: number, step: number): number {
  const normalized = clamp(raw, min, max);
  return min + Math.round((normalized - min) / step) * step;
}

export function DurationSlider({ label, value, min, max, step = 1, onChange }: DurationSliderProps) {
  const [trackWidth, setTrackWidth] = useState(1);
  const [dragging, setDragging] = useState(false);
  const trackPageX = useRef(0);
  const trackRef = useRef<View>(null);

  const fraction = (value - min) / Math.max(1, max - min);
  const thumbLeft = fraction * trackWidth;

  const updateFromPageX = (pageX: number) => {
    const localX = pageX - trackPageX.current;
    const clampedX = clamp(localX, 0, trackWidth);
    const ratio = clampedX / Math.max(1, trackWidth);
    const raw = min + ratio * (max - min);
    onChange(getSteppedValue(raw, min, max, step));
  };

  const onTrackLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.max(1, event.nativeEvent.layout.width);
    setTrackWidth(nextWidth);
    trackRef.current?.measure((_x, _y, _w, _h, px) => {
      trackPageX.current = px;
    });
  };

  const onTrackPress = (event: GestureResponderEvent) => {
    updateFromPageX(event.nativeEvent.pageX);
  };

  const decrement = () => onChange(getSteppedValue(value - step, min, max, step));
  const increment = () => onChange(getSteppedValue(value + step, min, max, step));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueChip}>
          <Text style={styles.valueChipText}>{value} min</Text>
        </View>
      </View>

      <View style={styles.sliderRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          onPress={decrement}
          style={({ pressed }) => [styles.adjustButton, pressed && styles.adjustButtonPressed]}>
          <Text style={styles.adjustButtonText}>−</Text>
        </Pressable>

        <View
          ref={trackRef}
          accessibilityRole="adjustable"
          accessibilityLabel={`${label} duration slider`}
          accessibilityHint={`Swipe to adjust between ${min} and ${max} minutes.`}
          accessibilityValue={{ min, max, now: value, text: `${value} minutes` }}
          onLayout={onTrackLayout}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(event) => {
            setDragging(true);
            updateFromPageX(event.nativeEvent.pageX);
          }}
          onResponderMove={(event) => {
            updateFromPageX(event.nativeEvent.pageX);
          }}
          onResponderRelease={() => {
            setDragging(false);
          }}
          onResponderTerminate={() => {
            setDragging(false);
          }}
          style={styles.trackTouchable}>
          <Pressable onPress={onTrackPress} style={StyleSheet.absoluteFill} />
          <View style={styles.trackBase} />
          <View style={[styles.trackFill, { width: thumbLeft }]} />
          <View
            style={[
              styles.thumb,
              { left: thumbLeft - 11 },
              dragging && styles.thumbDragging,
            ]}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          onPress={increment}
          style={({ pressed }) => [styles.adjustButton, pressed && styles.adjustButtonPressed]}>
          <Text style={styles.adjustButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: space.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mint,
  },
  valueChip: {
    borderRadius: radii.pill,
    backgroundColor: 'rgba(66,255,169,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(66,255,169,0.45)',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  valueChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sliderRow: {
    marginTop: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  adjustButton: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  adjustButtonPressed: {
    backgroundColor: 'rgba(66,255,169,0.18)',
  },
  adjustButtonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  trackTouchable: {
    flex: 1,
    height: 34,
    justifyContent: 'center',
  },
  trackBase: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.mint,
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    backgroundColor: colors.mint,
    borderWidth: 2,
    borderColor: colors.background,
  },
  thumbDragging: {
    backgroundColor: colors.mintPressed,
    borderColor: 'rgba(255,255,255,0.75)',
  },
});
