import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CosmicBackground } from '@/src/components/CosmicBackground';
import { space } from '@/src/theme/tokens';

type Props = ViewProps & {
  children: React.ReactNode;
  /** Extra bottom padding for scroll-free screens with CTAs */
  padded?: boolean;
};

export function Screen({ children, style, padded = true, ...rest }: Props) {
  return (
    <CosmicBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={[styles.inner, padded && styles.padded, style]} {...rest}>
          {children}
        </View>
      </SafeAreaView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  inner: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },
});
