import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { Screen } from '@/src/components/Screen';
import { useSessionStore } from '@/src/features/session/state/sessionStore';
import type { SessionHistoryRecord } from '@/src/features/session/domain/types';
import { colors, space } from '@/src/theme/tokens';

export default function HistoryScreen() {
  const router = useRouter();
  const history = useSessionStore((s) => s.history);

  return (
    <Screen>
      <View style={styles.flex}>
        <Text style={styles.subtitle}>Local-only session outcomes (newest last in this MVP list).</Text>
        <FlatList
          style={styles.flex}
          data={[...history].reverse()}
          keyExtractor={(item) => item.id + item.endedAt}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No sessions yet. Complete or destabilize a run to see it here.</Text>
          }
          renderItem={({ item }) => <HistoryRow item={item} />}
        />
        <PrimaryButton title="Choose mode" onPress={() => router.push('/modes')} style={styles.footer} />
      </View>
    </Screen>
  );
}

function HistoryRow({ item }: { item: SessionHistoryRecord }) {
  const when = new Date(item.endedAt).toLocaleString();
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{item.outcome === 'completed' ? 'Completed' : 'Destabilized'}</Text>
      <Text style={styles.rowMeta}>
        {when} · focus {Math.round(item.focusDurationMs / 60000)}m · breaks {Math.round(item.breakDurationMs / 60000)}m ·
        interruptions {item.interruptionCount}
      </Text>
      {item.presetId ? <Text style={styles.rowPreset}>Preset: {item.presetId}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: space.md,
  },
  list: {
    paddingBottom: space.xl,
    gap: space.md,
  },
  empty: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: space.lg,
  },
  row: {
    padding: space.md,
    borderRadius: 12,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.starYellow,
  },
  rowMeta: {
    marginTop: space.xs,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  rowPreset: {
    marginTop: space.xs,
    fontSize: 12,
    color: colors.mint,
    fontWeight: '600',
  },
  footer: {
    marginTop: space.md,
  },
});
