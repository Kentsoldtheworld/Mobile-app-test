import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useState } from 'react';

import type { SessionHistoryRecord } from '@/src/features/session/domain/types';
import { colors, radii, space } from '@/src/theme/tokens';

type Props = {
  record: SessionHistoryRecord;
  /** Compact mode for use inside a history list */
  compact?: boolean;
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today at ${time}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` at ${time}`;
}

function formatDuration(ms: number): string {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
}

// ── Block grid ────────────────────────────────────────────────────────────────

const GAP = 3;
const TILE_MAX = 44;
const TILE_MIN = 8;
// How many tiles to target per row before wrapping
const TILES_PER_ROW = 12;

function tileSize(totalBlocks: number, availableWidth: number): number {
  // Size tiles so up to TILES_PER_ROW fit neatly in a row
  const perRow = Math.min(totalBlocks, TILES_PER_ROW);
  const computed = (availableWidth - GAP * (perRow - 1)) / perRow;
  return Math.min(TILE_MAX, Math.max(TILE_MIN, Math.floor(computed)));
}

type BlockRowProps = {
  achievedFocusBlocks: number;
  missedFocusBlocks: number;
  breakBlocks: number;
};

function BlockRow({ achievedFocusBlocks, missedFocusBlocks, breakBlocks }: BlockRowProps) {
  const [width, setWidth] = useState(0);
  const total = achievedFocusBlocks + missedFocusBlocks + breakBlocks;
  const size = width > 0 ? tileSize(total, width) : 0;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const tile = (key: string, style: object) => (
    <View
      key={key}
      style={[
        {
          width: size,
          height: size,
          borderRadius: 4,
          marginRight: GAP,
          marginBottom: GAP,
        },
        style,
      ]}
    />
  );

  const tiles: React.ReactElement[] = [];
  for (let i = 0; i < achievedFocusBlocks; i++) tiles.push(tile(`af-${i}`, s.tileFocus));
  for (let i = 0; i < missedFocusBlocks; i++) tiles.push(tile(`mf-${i}`, s.tileMissed));
  for (let i = 0; i < breakBlocks; i++) tiles.push(tile(`b-${i}`, s.tileBreak));

  return (
    <View style={s.blockRow} onLayout={onLayout}>
      {size > 0 ? tiles : null}
    </View>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

export function SessionSummaryCard({ record, compact = false }: Props) {
  const isComplete = record.outcome === 'completed';

  const plannedFocusMin = Math.round(record.focusDurationMs / 60000);
  const actualFocusMin = isComplete
    ? plannedFocusMin
    : Math.max(0, Math.round((record.endedAt - record.startedAt) / 60000));

  const achievedFocusBlocks = Math.max(1, Math.round(Math.max(1, actualFocusMin) / 5));
  const missedFocusBlocks = isComplete
    ? 0
    : Math.max(0, Math.round(plannedFocusMin / 5) - achievedFocusBlocks);
  const breakBlocks = isComplete
    ? Math.max(1, Math.round(record.breakDurationMs / 60000 / 5))
    : 0;

  const legendText = isComplete
    ? `Focus ${formatDuration(record.focusDurationMs)} · Break ${formatDuration(record.breakDurationMs)}`
    : actualFocusMin > 0
      ? `${actualFocusMin}m of ${plannedFocusMin}m focus completed`
      : `Session ended before focus began`;

  return (
    <View style={[s.card, compact && s.cardCompact]}>
      {/* Outcome badge */}
      <View style={s.badgeRow}>
        <View style={[s.badge, isComplete ? s.badgeComplete : s.badgeLost]}>
          <Text style={[s.badgeText, isComplete ? s.badgeTextComplete : s.badgeTextLost]}>
            {isComplete ? 'complete' : 'session lost'}
          </Text>
        </View>
        <Text style={s.timestamp}>{formatTime(record.endedAt)}</Text>
      </View>

      {/* 5-minute block visualization */}
      <BlockRow
        achievedFocusBlocks={achievedFocusBlocks}
        missedFocusBlocks={missedFocusBlocks}
        breakBlocks={breakBlocks}
      />

      {/* Legend */}
      <View style={s.legendRow}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, s.tileFocus]} />
          <Text style={s.legendText}>Focus</Text>
        </View>
        {missedFocusBlocks > 0 && (
          <View style={s.legendItem}>
            <View style={[s.legendDot, s.tileMissed]} />
            <Text style={s.legendText}>Planned</Text>
          </View>
        )}
        {breakBlocks > 0 && (
          <View style={s.legendItem}>
            <View style={[s.legendDot, s.tileBreak]} />
            <Text style={s.legendText}>Break</Text>
          </View>
        )}
        <Text style={[s.legendText, s.legendSummary]}>{legendText}</Text>
      </View>

      {/* Stats row */}
      {!compact && record.interruptionCount > 0 && (
        <Text style={s.statText}>
          {record.interruptionCount} interruption{record.interruptionCount !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: space.lg,
  },
  cardCompact: {
    padding: space.md,
  },

  // badge
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  badgeComplete: {
    backgroundColor: 'rgba(66,255,169,0.12)',
    borderColor: 'rgba(66,255,169,0.4)',
  },
  badgeLost: {
    backgroundColor: 'rgba(245,230,168,0.12)',
    borderColor: 'rgba(245,230,168,0.4)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeTextComplete: {
    color: colors.mint,
  },
  badgeTextLost: {
    color: colors.starYellow,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // blocks
  blockRow: {
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
  tileBreak: {
    backgroundColor: colors.starYellow,
    opacity: 0.7,
  },

  // legend
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
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

  // stats
  statText: {
    marginTop: space.sm,
    fontSize: 12,
    color: colors.textMuted,
  },
});
