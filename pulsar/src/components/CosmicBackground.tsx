import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/src/theme/tokens';

type Props = {
  children?: ReactNode;
};

const stars = [
  { top: '8%', left: '12%', s: 3, o: 0.85 },
  { top: '18%', left: '78%', s: 2, o: 0.55 },
  { top: '28%', left: '44%', s: 2, o: 0.7 },
  { top: '42%', left: '18%', s: 2, o: 0.45 },
  { top: '52%', left: '88%', s: 3, o: 0.65 },
  { top: '62%', left: '56%', s: 2, o: 0.5 },
  { top: '72%', left: '30%', s: 2, o: 0.6 },
  { top: '84%', left: '70%', s: 3, o: 0.75 },
  { top: '12%', left: '52%', s: 2, o: 0.4 },
] as const;

export function CosmicBackground({ children }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.glowLarge} />
      <View style={styles.glowSmall} />
      {stars.map((star, i) => (
        <View
          key={i}
          style={[
            styles.star,
            {
              top: star.top,
              left: star.left,
              width: star.s,
              height: star.s,
              opacity: star.o,
            },
          ]}
        />
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
  glowLarge: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 999,
    backgroundColor: 'rgba(66,255,169,0.06)',
    top: -120,
    right: -100,
  },
  glowSmall: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(245,230,168,0.05)',
    bottom: -40,
    left: -80,
  },
  star: {
    position: 'absolute',
    borderRadius: 99,
    backgroundColor: colors.starYellow,
  },
});
