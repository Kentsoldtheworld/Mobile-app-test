import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/src/components/Screen';
import { colors, space } from '@/src/theme/tokens';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Text style={styles.title}>This screen does not exist.</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Back to welcome</Text>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  link: {
    marginTop: space.lg,
    paddingVertical: space.md,
    alignSelf: 'center',
  },
  linkText: {
    fontSize: 16,
    color: colors.mint,
    fontWeight: '600',
  },
});
