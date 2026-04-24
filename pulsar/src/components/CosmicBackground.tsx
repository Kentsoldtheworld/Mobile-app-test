import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors } from '@/src/theme/tokens';

type Props = {
  children?: ReactNode;
};

type StarDef = {
  top: string;
  left: string;
  size: number;
  peak: number;
  dim: number;
  cycle: number;
  delay: number;
  color: string;
  blob?: true; // only a handful get the growing halo
};

const W = '#FFFFFF';
const G = '#F5E6A8';
const B = '#B8D4FF';

const STARS: StarDef[] = [
  // ── top band ─────────────────────────────────────────────────────────────
  { top: '3%',  left: '9%',  size: 1.5, peak: 0.85, dim: 0.15, cycle: 2600, delay: 400,  color: W },
  { top: '6%',  left: '28%', size: 1,   peak: 0.55, dim: 0.08, cycle: 3400, delay: 1700, color: W },
  { top: '4%',  left: '51%', size: 2,   peak: 0.9,  dim: 0.25, cycle: 2900, delay: 0,    color: G, blob: true },
  { top: '9%',  left: '72%', size: 1,   peak: 0.6,  dim: 0.1,  cycle: 3800, delay: 2200, color: W },
  { top: '2%',  left: '88%', size: 1.5, peak: 0.75, dim: 0.2,  cycle: 2400, delay: 900,  color: W },
  { top: '13%', left: '16%', size: 1,   peak: 0.5,  dim: 0.08, cycle: 4100, delay: 3100, color: W },
  { top: '11%', left: '42%', size: 2.5, peak: 0.95, dim: 0.3,  cycle: 3200, delay: 600,  color: W, blob: true },
  { top: '14%', left: '63%', size: 1,   peak: 0.45, dim: 0.07, cycle: 2700, delay: 2700, color: B },
  { top: '7%',  left: '94%', size: 1.5, peak: 0.7,  dim: 0.15, cycle: 3600, delay: 1400, color: W },
  // ── upper-mid ────────────────────────────────────────────────────────────
  { top: '18%', left: '5%',  size: 2,   peak: 0.8,  dim: 0.2,  cycle: 2800, delay: 500,  color: W },
  { top: '22%', left: '32%', size: 1,   peak: 0.5,  dim: 0.1,  cycle: 3900, delay: 2400, color: W },
  { top: '17%', left: '55%', size: 1.5, peak: 0.65, dim: 0.12, cycle: 2500, delay: 1100, color: G },
  { top: '25%', left: '79%', size: 1,   peak: 0.4,  dim: 0.06, cycle: 4300, delay: 3500, color: W },
  { top: '20%', left: '91%', size: 2,   peak: 0.85, dim: 0.22, cycle: 3100, delay: 800,  color: W },
  { top: '31%', left: '14%', size: 1.5, peak: 0.7,  dim: 0.15, cycle: 2200, delay: 200,  color: B },
  { top: '29%', left: '46%', size: 1,   peak: 0.55, dim: 0.09, cycle: 3700, delay: 2900, color: W },
  { top: '33%', left: '68%', size: 2.5, peak: 0.9,  dim: 0.28, cycle: 2700, delay: 700,  color: W, blob: true },
  { top: '27%', left: '83%', size: 1,   peak: 0.45, dim: 0.07, cycle: 4000, delay: 1600, color: W },
  // ── mid ──────────────────────────────────────────────────────────────────
  { top: '38%', left: '3%',  size: 1,   peak: 0.5,  dim: 0.08, cycle: 3300, delay: 3000, color: W },
  { top: '41%', left: '22%', size: 2,   peak: 0.8,  dim: 0.18, cycle: 2600, delay: 400,  color: G, blob: true },
  { top: '44%', left: '49%', size: 1.5, peak: 0.65, dim: 0.13, cycle: 3500, delay: 2100, color: W },
  { top: '37%', left: '74%', size: 1,   peak: 0.4,  dim: 0.06, cycle: 4200, delay: 1300, color: W },
  { top: '48%', left: '88%', size: 2,   peak: 0.85, dim: 0.2,  cycle: 2900, delay: 650,  color: W },
  { top: '51%', left: '11%', size: 1.5, peak: 0.7,  dim: 0.16, cycle: 3800, delay: 3300, color: W },
  { top: '53%', left: '37%', size: 1,   peak: 0.5,  dim: 0.09, cycle: 2400, delay: 1900, color: B },
  { top: '46%', left: '61%', size: 2.5, peak: 0.88, dim: 0.25, cycle: 3000, delay: 100,  color: W, blob: true },
  // ── lower-mid ────────────────────────────────────────────────────────────
  { top: '58%', left: '7%',  size: 2,   peak: 0.75, dim: 0.18, cycle: 2700, delay: 2600, color: W },
  { top: '62%', left: '29%', size: 1,   peak: 0.45, dim: 0.07, cycle: 3600, delay: 1000, color: W },
  { top: '60%', left: '54%', size: 1.5, peak: 0.7,  dim: 0.14, cycle: 2300, delay: 300,  color: G },
  { top: '64%', left: '77%', size: 1,   peak: 0.55, dim: 0.1,  cycle: 4100, delay: 2800, color: W },
  { top: '68%', left: '92%', size: 2,   peak: 0.82, dim: 0.2,  cycle: 3200, delay: 750,  color: W },
  { top: '71%', left: '18%', size: 1.5, peak: 0.6,  dim: 0.12, cycle: 3700, delay: 2000, color: W },
  { top: '73%', left: '43%', size: 2.5, peak: 0.92, dim: 0.28, cycle: 2800, delay: 450,  color: W, blob: true },
  { top: '67%', left: '65%', size: 1,   peak: 0.4,  dim: 0.06, cycle: 4400, delay: 3200, color: B },
  // ── bottom ───────────────────────────────────────────────────────────────
  { top: '78%', left: '6%',  size: 1,   peak: 0.5,  dim: 0.09, cycle: 3100, delay: 1500, color: W },
  { top: '82%', left: '26%', size: 2,   peak: 0.78, dim: 0.18, cycle: 2500, delay: 250,  color: W },
  { top: '80%', left: '58%', size: 1.5, peak: 0.65, dim: 0.13, cycle: 3900, delay: 2300, color: G },
  { top: '85%', left: '80%', size: 1,   peak: 0.45, dim: 0.07, cycle: 2600, delay: 900,  color: W },
  { top: '89%', left: '13%', size: 2.5, peak: 0.88, dim: 0.24, cycle: 3400, delay: 3400, color: W, blob: true },
  { top: '92%', left: '41%', size: 1,   peak: 0.5,  dim: 0.08, cycle: 2900, delay: 1800, color: B },
  { top: '87%', left: '68%', size: 2,   peak: 0.8,  dim: 0.2,  cycle: 2200, delay: 600,  color: W },
  { top: '94%', left: '90%', size: 1.5, peak: 0.7,  dim: 0.15, cycle: 3600, delay: 2500, color: W },
];

// Base size of the halo relative to the star dot
const BLOB_BASE = 7;

function TwinklingStar({ def }: { def: StarDef }) {
  const opacity = useRef(new Animated.Value(def.dim)).current;

  // Blob halo: grows as the star brightens (scale 0.3 → 1.8), fixed low opacity
  const blobScale = def.blob
    ? opacity.interpolate({
        inputRange: [def.dim, def.peak],
        outputRange: [0.75, 1.2],
        extrapolate: 'clamp',
      })
    : null;

  const blobSize = def.size * BLOB_BASE;
  const blobOffset = -(blobSize / 2 - def.size / 2);

  useEffect(() => {
    const half = def.cycle / 2;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: def.peak, duration: half, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: def.dim,  duration: half, useNativeDriver: true }),
      ])
    );
    const t = setTimeout(() => anim.start(), def.delay);
    return () => { clearTimeout(t); anim.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Growing halo — only rendered for blob stars */}
      {blobScale ? (
        <Animated.View
          style={{
            position: 'absolute',
            top: def.top,
            left: def.left,
            width: blobSize,
            height: blobSize,
            borderRadius: blobSize / 2,
            backgroundColor: def.color,
            opacity: 0.06,
            transform: [
              { translateX: blobOffset },
              { translateY: blobOffset },
              { scale: blobScale },
            ],
          }}
        />
      ) : null}

      {/* Star dot */}
      <Animated.View
        style={{
          position: 'absolute',
          top: def.top,
          left: def.left,
          width: def.size,
          height: def.size,
          borderRadius: def.size,
          backgroundColor: def.color,
          opacity,
        }}
      />
    </>
  );
}

export function CosmicBackground({ children }: Props) {
  return (
    <View style={styles.root}>
      {STARS.map((def, i) => (
        <TwinklingStar key={i} def={def} />
      ))}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
});
