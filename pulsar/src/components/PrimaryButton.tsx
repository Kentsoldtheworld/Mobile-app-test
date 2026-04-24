import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, space } from '@/src/theme/tokens';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ title, style, ...rest }: Props) {
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
    backgroundColor: colors.mint,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  pressed: {
    backgroundColor: colors.mintPressed,
  },
  label: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
