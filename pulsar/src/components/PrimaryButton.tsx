import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, space } from '@/src/theme/tokens';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Override the background colour shown while the button is pressed. */
  pressedStyle?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ title, icon, style, pressedStyle, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        style,
        pressed && (pressedStyle ?? styles.pressed),
      ]}
      {...rest}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
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
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.mintPressed,
  },
  iconWrap: {
    marginRight: 8,
  },
  label: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
