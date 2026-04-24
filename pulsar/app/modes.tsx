import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GhostButton } from '@/src/components/GhostButton';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { Screen } from '@/src/components/Screen';
import { useSessionStore } from '@/src/features/session/state/sessionStore';
import { PRESETS } from '@/src/features/session/presets';
import { colors, radii, space } from '@/src/theme/tokens';

const FOCUS_MIN = 1;
const FOCUS_MAX = 240;
const BREAK_MIN = 1;
const BREAK_MAX = 120;

function parsePositiveInt(raw: string): number | null {
  const t = raw.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n)) return null;
  return n;
}

export default function ModesScreen() {
  const router = useRouter();
  const startPreset = useSessionStore((s) => s.startSessionFromPreset);
  const startCustomMinutes = useSessionStore((s) => s.startSessionCustomMinutes);

  const [customOpen, setCustomOpen] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState('');
  const [breakMinutes, setBreakMinutes] = useState('');

  const openCustom = () => {
    setFocusMinutes('');
    setBreakMinutes('');
    setCustomOpen(true);
  };

  const startCustom = () => {
    const f = parsePositiveInt(focusMinutes);
    const b = parsePositiveInt(breakMinutes);
    if (f == null || b == null) {
      Alert.alert('Invalid input', 'Enter whole numbers for focus and break (minutes).');
      return;
    }
    if (f < FOCUS_MIN || f > FOCUS_MAX) {
      Alert.alert('Focus length', `Focus must be between ${FOCUS_MIN} and ${FOCUS_MAX} minutes.`);
      return;
    }
    if (b < BREAK_MIN || b > BREAK_MAX) {
      Alert.alert('Break length', `Break must be between ${BREAK_MIN} and ${BREAK_MAX} minutes.`);
      return;
    }
    startCustomMinutes(f, b);
    setCustomOpen(false);
    router.push('/session');
  };

  return (
    <Screen>
      <Text style={styles.subtitle}>Pick a preset to start a focus session (guest mode, on-device only).</Text>
      <View style={styles.list}>
        <PrimaryButton
          title={PRESETS.frequent.label}
          onPress={() => {
            startPreset('frequent');
            router.push('/session');
          }}
        />
        <PrimaryButton
          title={PRESETS.balanced.label}
          style={styles.gap}
          onPress={() => {
            startPreset('balanced');
            router.push('/session');
          }}
        />
        <PrimaryButton
          title={PRESETS.minimal.label}
          style={styles.gap}
          onPress={() => {
            startPreset('minimal');
            router.push('/session');
          }}
        />
        <GhostButton title="Custom focus & break" onPress={openCustom} style={styles.gap} />
      </View>

      <Modal visible={customOpen} animationType="fade" transparent onRequestClose={() => setCustomOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCustomOpen(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKb}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Custom session</Text>
              <Text style={styles.modalHint}>
                Focus {FOCUS_MIN}–{FOCUS_MAX} min · Break {BREAK_MIN}–{BREAK_MAX} min
              </Text>
              <Text style={styles.fieldLabel}>Focus (minutes)</Text>
              <TextInput
                value={focusMinutes}
                onChangeText={setFocusMinutes}
                keyboardType="number-pad"
                placeholder="e.g. 25"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                returnKeyType="next"
              />
              <Text style={styles.fieldLabel}>Break (minutes)</Text>
              <TextInput
                value={breakMinutes}
                onChangeText={setBreakMinutes}
                keyboardType="number-pad"
                placeholder="e.g. 5"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={startCustom}
              />
              <PrimaryButton title="Start session" onPress={startCustom} style={styles.modalPrimary} />
              <GhostButton title="Cancel" onPress={() => setCustomOpen(false)} style={styles.modalGhost} />
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  modalKb: {
    width: '100%',
  },
  modalCard: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: space.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalHint: {
    marginTop: space.xs,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  fieldLabel: {
    marginTop: space.md,
    fontSize: 13,
    fontWeight: '600',
    color: colors.mint,
  },
  input: {
    marginTop: space.xs,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radii.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  modalPrimary: {
    marginTop: space.lg,
  },
  modalGhost: {
    marginTop: space.md,
  },
});
