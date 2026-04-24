import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, space } from '@/src/theme/tokens';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  style?: StyleProp<ViewStyle>;
};

export function GhostButton({ title, style, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.base, pressed && styles.pressed, style]}
      {...rest}>
      <Text style={styles.label}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    borderColor: colors.outline,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  pressed: {
    backgroundColor: 'rgba(66,255,169,0.08)',
  },
  label: {
    color: colors.mint,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
