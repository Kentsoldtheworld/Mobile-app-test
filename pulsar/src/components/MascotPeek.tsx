import { StyleSheet, View } from 'react-native';

import { colors } from '@/src/theme/tokens';

/** Simple decorative “alien” peek — swap for an asset when ready */
export function MascotPeek() {
  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.head}>
        <View style={styles.eye} />
        <View style={styles.eye} />
      </View>
      <View style={styles.antenna} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: -8,
    top: '22%',
    width: 72,
    height: 88,
    justifyContent: 'center',
  },
  head: {
    width: 64,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.mint,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    shadowColor: colors.mint,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  eye: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background,
  },
  antenna: {
    position: 'absolute',
    top: 4,
    right: 22,
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.mintPressed,
  },
});
