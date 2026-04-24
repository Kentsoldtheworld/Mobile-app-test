import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { Screen } from '@/src/components/Screen';
import { useSessionStore } from '@/src/features/session/state/sessionStore';
import { CUSTOM_PLACEHOLDER_PRESET, PRESETS } from '@/src/features/session/presets';
import { colors, space } from '@/src/theme/tokens';

export default function ModesScreen() {
  const router = useRouter();
  const startPreset = useSessionStore((s) => s.startSessionFromPreset);
  const startCustom = useSessionStore((s) => s.startSessionCustomPlaceholder);

  return (
    <Screen>
      <Text style={styles.subtitle}>Pick a preset to start a focus session (guest mode, on-device only).</Text>
      <View style={styles.list}>
        <PrimaryButton
          title={`${PRESETS.pomodoro.label} focus`}
          onPress={() => {
            startPreset('pomodoro');
            router.push('/session');
          }}
        />
        <PrimaryButton
          title={`${PRESETS.long.label} focus`}
          style={styles.gap}
          onPress={() => {
            startPreset('long');
            router.push('/session');
          }}
        />
        <PrimaryButton
          title={CUSTOM_PLACEHOLDER_PRESET.label}
          style={styles.gap}
          onPress={() => {
            startCustom();
            router.push('/session');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: space.md,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  list: {
    marginTop: space.xl,
    gap: 0,
  },
  gap: {
    marginTop: space.md,
  },
});
