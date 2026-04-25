import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { GhostButton } from '@/src/components/GhostButton';
import { Screen } from '@/src/components/Screen';
import { SessionSummaryCard } from '@/src/components/SessionSummaryCard';
import type { SessionHistoryRecord } from '@/src/features/session/domain/types';
import { useSessionStore } from '@/src/features/session/state/sessionStore';
import { colors, radii, space } from '@/src/theme/tokens';

// ─── View mode ───────────────────────────────────────────────────────────────

type ViewMode = 'session' | 'day' | 'week' | 'month';

const TABS: { key: ViewMode; label: string }[] = [
  { key: 'session', label: 'Session' },
  { key: 'day',     label: 'Day' },
  { key: 'week',    label: 'Week' },
  { key: 'month',   label: 'Month' },
];

// ─── Block constants (must match SessionSummaryCard) ─────────────────────────

const BLOCK_MS = 5 * 60 * 1000;
const BLOCK_GAP = 3;
const TILE_MIN = 6;
const TILE_MAX = 28;

// ─── Period grouping ──────────────────────────────────────────────────────────

type PeriodGroup = {
  key: string;
  label: string;
  records: SessionHistoryRecord[];
  // Aggregate focus time (ms) actually achieved across the period
  totalFocusMs: number;
  completed: number;
  lost: number;
  // Aggregate block counts — same semantics as SessionSummaryCard
  focusBlocks: number;       // achieved focus (green)
  lostBlocks: number;        // red, 1 per lost session (the block they were in)
  missedBlocks: number;      // planned but not reached (dim green)
  breakBlocks: number;       // from completed sessions (solid yellow)
  dimBreakBlocks: number;    // from lost sessions (dim yellow — break never reached)
};

function startOfDay(ts: number): Date {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns the Monday of the week containing the given date. */
function mondayOf(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function bucketKey(ts: number, mode: ViewMode): string {
  const d = new Date(ts);
  if (mode === 'day') {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  if (mode === 'week') {
    const mon = mondayOf(d);
    return `${mon.getFullYear()}-${pad2(mon.getMonth() + 1)}-${pad2(mon.getDate())}`;
  }
  // month
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function formatDuration(ms: number): string {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
}

function periodLabel(key: string, mode: ViewMode): string {
  const now = new Date();
  if (mode === 'day') {
    const d = new Date(key);
    const todayKey = bucketKey(now.getTime(), 'day');
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterdayKey = bucketKey(yesterdayDate.getTime(), 'day');
    if (key === todayKey) return 'Today';
    if (key === yesterdayKey) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }
  if (mode === 'week') {
    const monday = new Date(key);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const thisMonday = mondayOf(now);
    const thisMondayKey = bucketKey(now.getTime(), 'week');
    if (key === thisMondayKey) return 'This week';
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);
    const lastMondayKey = `${lastMonday.getFullYear()}-${pad2(lastMonday.getMonth() + 1)}-${pad2(lastMonday.getDate())}`;
    if (key === lastMondayKey) return 'Last week';
    const startStr = monday.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const endStr = sunday.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${startStr} – ${endStr}`;
  }
  // month
  const [year, month] = key.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  const thisMonthKey = bucketKey(now.getTime(), 'month');
  if (key === thisMonthKey) return 'This month';
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = bucketKey(lastMonth.getTime(), 'month');
  if (key === lastMonthKey) return 'Last month';
  return d.toLocaleDateString([], { month: 'long', year: 'numeric' });
}

function groupByPeriod(records: SessionHistoryRecord[], mode: ViewMode): PeriodGroup[] {
  const map = new Map<string, PeriodGroup>();

  for (const r of records) {
    const key = bucketKey(r.endedAt, mode);
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: periodLabel(key, mode),
        records: [],
        totalFocusMs: 0,
        completed: 0,
        lost: 0,
        focusBlocks: 0,
        lostBlocks: 0,
        missedBlocks: 0,
        breakBlocks: 0,
        dimBreakBlocks: 0,
      });
    }
    const g = map.get(key)!;
    g.records.push(r);

    const plannedFocus = Math.max(1, Math.ceil(r.focusDurationMs / BLOCK_MS));
    const plannedBreak = Math.max(1, Math.ceil(r.breakDurationMs / BLOCK_MS));

    if (r.outcome === 'completed') {
      g.completed += 1;
      g.totalFocusMs += r.focusDurationMs;
      g.focusBlocks += plannedFocus;
      g.breakBlocks += plannedBreak;
    } else {
      g.lost += 1;
      const actualFocusMs = Math.max(0, r.endedAt - r.startedAt);
      g.totalFocusMs += actualFocusMs;
      // Mirror the logic in SessionSummaryCard
      const completedFullBlocks = Math.min(plannedFocus - 1, Math.floor(actualFocusMs / BLOCK_MS));
      const achieved = Math.max(0, completedFullBlocks);
      g.focusBlocks += achieved;
      g.lostBlocks += plannedFocus > achieved ? 1 : 0;
      g.missedBlocks += Math.max(0, plannedFocus - achieved - 1);
      g.dimBreakBlocks += plannedBreak;
    }
  }

  // Sort newest-first (lexicographic key order works for YYYY-MM-DD / YYYY-MM)
  return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
}

// ─── Segmented control ────────────────────────────────────────────────────────

function SegmentedControl({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <View style={sc.strip}>
      {TABS.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[sc.pill, active && sc.pillActive]}
          >
            <Text style={[sc.label, active && sc.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const sc = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.pill,
    padding: 3,
    marginBottom: space.lg,
  },
  pill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  pillActive: {
    backgroundColor: colors.mint,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.background,
  },
});

// ─── Period block bar ─────────────────────────────────────────────────────────

type PeriodBlockBarProps = {
  focusBlocks: number;
  lostBlocks: number;
  missedBlocks: number;
  breakBlocks: number;
  dimBreakBlocks: number;
};

function PeriodBlockBar({
  focusBlocks,
  lostBlocks,
  missedBlocks,
  breakBlocks,
  dimBreakBlocks,
}: PeriodBlockBarProps) {
  const [width, setWidth] = useState(0);

  const total =
    focusBlocks + lostBlocks + missedBlocks + breakBlocks + dimBreakBlocks;

  // Dynamically size tiles to fill the row; smaller range than per-session
  // view to handle potentially large block counts (week/month periods)
  const size = useMemo(() => {
    if (width === 0 || total === 0) return 0;
    const maxPerRow = Math.min(total, 20);
    const computed = (width - BLOCK_GAP * (maxPerRow - 1)) / maxPerRow;
    return Math.min(TILE_MAX, Math.max(TILE_MIN, Math.floor(computed)));
  }, [width, total]);

  const onLayout = (e: LayoutChangeEvent) =>
    setWidth(e.nativeEvent.layout.width);

  const tile = (key: string, style: object) => (
    <View
      key={key}
      style={[
        {
          width: size,
          height: size,
          borderRadius: Math.max(2, size / 5),
          marginRight: BLOCK_GAP,
          marginBottom: BLOCK_GAP,
        },
        style,
      ]}
    />
  );

  const tiles: React.ReactElement[] = [];
  for (let i = 0; i < focusBlocks; i++) tiles.push(tile(`f-${i}`, pb.tileFocus));
  for (let i = 0; i < lostBlocks; i++) tiles.push(tile(`l-${i}`, pb.tileLost));
  for (let i = 0; i < missedBlocks; i++) tiles.push(tile(`m-${i}`, pb.tileMissed));
  if (breakBlocks + dimBreakBlocks > 0) {
    tiles.push(<View key="sep" style={{ width: BLOCK_GAP * 2 }} />);
    for (let i = 0; i < breakBlocks; i++) tiles.push(tile(`b-${i}`, pb.tileBreak));
    for (let i = 0; i < dimBreakBlocks; i++) tiles.push(tile(`db-${i}`, pb.tileBreakDim));
  }

  return (
    <View style={pb.row} onLayout={onLayout}>
      {size > 0 ? tiles : null}
    </View>
  );
}

// ─── Period card ──────────────────────────────────────────────────────────────

function PeriodCard({ group }: { group: PeriodGroup }) {
  const total = group.completed + group.lost;
  const hasBlocks =
    group.focusBlocks + group.lostBlocks + group.missedBlocks +
    group.breakBlocks + group.dimBreakBlocks > 0;

  return (
    <View style={pb.card}>
      {/* Header */}
      <View style={pb.headerRow}>
        <Text style={pb.label}>{group.label}</Text>
        <Text style={pb.sessionCount}>
          {total} session{total !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Block grid */}
      {hasBlocks && (
        <PeriodBlockBar
          focusBlocks={group.focusBlocks}
          lostBlocks={group.lostBlocks}
          missedBlocks={group.missedBlocks}
          breakBlocks={group.breakBlocks}
          dimBreakBlocks={group.dimBreakBlocks}
        />
      )}

      {/* Legend + summary */}
      <View style={pb.legendRow}>
        {group.focusBlocks > 0 && (
          <View style={pb.legendItem}>
            <View style={[pb.legendDot, pb.tileFocus]} />
            <Text style={pb.legendText}>Focus</Text>
          </View>
        )}
        {group.lostBlocks > 0 && (
          <View style={pb.legendItem}>
            <View style={[pb.legendDot, pb.tileLost]} />
            <Text style={pb.legendText}>Lost</Text>
          </View>
        )}
        {group.missedBlocks > 0 && (
          <View style={pb.legendItem}>
            <View style={[pb.legendDot, pb.tileMissed]} />
            <Text style={pb.legendText}>Planned</Text>
          </View>
        )}
        {(group.breakBlocks > 0 || group.dimBreakBlocks > 0) && (
          <View style={pb.legendItem}>
            <View style={[pb.legendDot, pb.tileBreak]} />
            <Text style={pb.legendText}>Break</Text>
          </View>
        )}
        <Text style={[pb.legendText, pb.legendSummary]}>
          {formatDuration(group.totalFocusMs)} focus
          {group.completed > 0 ? ` · ${group.completed} done` : ''}
          {group.lost > 0 ? ` · ${group.lost} lost` : ''}
        </Text>
      </View>
    </View>
  );
}

const pb = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: space.md,
    marginBottom: space.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sessionCount: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Block grid
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: space.sm,
  },
  tileFocus: {
    backgroundColor: colors.mint,
    opacity: 0.85,
  },
  tileMissed: {
    backgroundColor: colors.mint,
    opacity: 0.15,
  },
  tileLost: {
    backgroundColor: colors.error,
    opacity: 0.9,
  },
  tileBreak: {
    backgroundColor: colors.cosmicLatte,
    opacity: 0.7,
  },
  tileBreakDim: {
    backgroundColor: colors.cosmicLatte,
    opacity: 0.15,
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  legendSummary: {
    flex: 1,
    textAlign: 'right',
    fontWeight: '400',
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const router = useRouter();
  const history = useSessionStore((s) => s.history);
  const [mode, setMode] = useState<ViewMode>('session');

  // Newest-first list (session mode)
  const reversed = useMemo(() => [...history].reverse(), [history]);

  // Grouped list (day / week / month modes)
  const groups = useMemo(
    () => (mode !== 'session' ? groupByPeriod(reversed, mode) : []),
    [reversed, mode],
  );

  const isEmpty = history.length === 0;

  const Header = (
    <View>
      <Text style={styles.heading}>Session history</Text>
      <SegmentedControl value={mode} onChange={setMode} />
    </View>
  );

  const EmptyComponent = (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>No sessions yet</Text>
      <Text style={styles.emptyBody}>
        Complete or lose a session and it'll show up here.
      </Text>
      <GhostButton
        title="Choose a mode"
        onPress={() => router.push('/modes')}
        style={styles.emptyBtn}
      />
    </View>
  );

  const Footer =
    !isEmpty ? (
      <GhostButton
        title="Choose a mode"
        onPress={() => router.push('/modes')}
        style={styles.footer}
      />
    ) : null;

  if (mode === 'session') {
    return (
      <Screen>
        <FlatList
          data={reversed}
          keyExtractor={(item) => item.id + item.endedAt}
          contentContainerStyle={styles.list}
          ListHeaderComponent={Header}
          ListEmptyComponent={EmptyComponent}
          ListFooterComponent={Footer}
          renderItem={({ item }: { item: SessionHistoryRecord }) => (
            <View style={styles.cardWrap}>
              <SessionSummaryCard record={item} compact />
            </View>
          )}
        />
      </Screen>
    );
  }

  // Aggregated views (day / week / month)
  return (
    <Screen>
      <FlatList
        data={groups}
        keyExtractor={(g) => g.key}
        contentContainerStyle={styles.list}
        ListHeaderComponent={Header}
        ListEmptyComponent={EmptyComponent}
        ListFooterComponent={Footer}
        renderItem={({ item }: { item: PeriodGroup }) => (
          <PeriodCard group={item} />
        )}
      />
    </Screen>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  list: {
    paddingBottom: space.xl,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: space.md,
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
