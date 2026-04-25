import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { GhostButton } from '@/src/components/GhostButton';
import { Screen } from '@/src/components/Screen';
import { SessionSummaryCard } from '@/src/components/SessionSummaryCard';
import type { SessionHistoryRecord } from '@/src/features/session/domain/types';
import { useSessionStore } from '@/src/features/session/state/sessionStore';
import { colors, space } from '@/src/theme/tokens';

export default function HistoryScreen() {
  const router = useRouter();
  const history = useSessionStore((s) => s.history);
  const reversed = [...history].reverse();

  return (
    <Screen>
      <FlatList
        data={reversed}
        keyExtractor={(item) => item.id + item.endedAt}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.heading}>Session history</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyBody}>Complete or lose a session and it'll show up here.</Text>
            <GhostButton title="Choose a mode" onPress={() => router.push('/modes')} style={styles.emptyBtn} />
          </View>
        }
        renderItem={({ item }: { item: SessionHistoryRecord }) => (
          <View style={styles.cardWrap}>
            <SessionSummaryCard record={item} compact />
          </View>
        )}
        ListFooterComponent={history.length > 0 ? (
          <GhostButton
            title="Choose a mode"
            onPress={() => router.push('/modes')}
            style={styles.footer}
          />
        ) : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: space.xl,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: space.lg,
  },
  cardWrap: {
    marginBottom: space.md,
  },
  emptyWrap: {
    marginTop: space.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  emptyBody: {
    marginTop: space.xs,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: space.xl,
  },
  footer: {
    marginTop: space.md,
  },
});
