import { Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { colors, radii, space } from '@/src/theme/tokens';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function GhostButton({ title, icon, style, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.base, pressed && styles.pressed, style]}
      {...rest}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
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
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pressed: {
    backgroundColor: 'rgba(66,255,169,0.08)',
  },
  iconWrap: {
    marginRight: 8,
  },
  label: {
    color: colors.mint,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
