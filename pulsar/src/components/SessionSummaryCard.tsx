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
  lostBlock: boolean;       // show one red block for destabilized
  missedFocusBlocks: number;
  breakBlocks: number;
  breakDim: boolean;        // true = break not reached (dim), false = completed (solid)
};

function BlockRow({ achievedFocusBlocks, lostBlock, missedFocusBlocks, breakBlocks, breakDim }: BlockRowProps) {
  const [width, setWidth] = useState(0);
  const total = achievedFocusBlocks + (lostBlock ? 1 : 0) + missedFocusBlocks + breakBlocks;
  const size = width > 0 ? tileSize(total, width) : 0;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const tile = (key: string, style: object) => (
    <View
      key={key}
      style={[{ width: size, height: size, borderRadius: 4, marginRight: GAP, marginBottom: GAP }, style]}
    />
  );

  const tiles: React.ReactElement[] = [];
  for (let i = 0; i < achievedFocusBlocks; i++) tiles.push(tile(`af-${i}`, s.tileFocus));
  if (lostBlock) tiles.push(tile('lost', s.tileLost));
  for (let i = 0; i < missedFocusBlocks; i++) tiles.push(tile(`mf-${i}`, s.tileMissed));
  if (breakBlocks > 0) {
    // small gap between focus and break groups
    tiles.push(<View key="sep" style={{ width: GAP * 2 }} />);
    for (let i = 0; i < breakBlocks; i++) {
      tiles.push(tile(`b-${i}`, breakDim ? s.tileBreakDim : s.tileBreak));
    }
  }

  return (
    <View style={s.blockRow} onLayout={onLayout}>
      {size > 0 ? tiles : null}
    </View>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

export function SessionSummaryCard({ record, compact = false }: Props) {
  const isComplete = record.outcome === 'completed';

  const cycles = record.plannedCycles ?? 1;
  const focusBlocksPerCycle = Math.max(1, Math.ceil(record.focusDurationMs / (5 * 60 * 1000)));
  const breakBlocksPerCycle = Math.max(1, Math.ceil(record.breakDurationMs / (5 * 60 * 1000)));
  // Sessions end on focus: N focus periods, (N-1) break periods
  const plannedFocusBlocks = focusBlocksPerCycle * cycles;
  const plannedBreakBlocks = breakBlocksPerCycle * Math.max(0, cycles - 1);
  const plannedFocusMin = Math.round((record.focusDurationMs * cycles) / 60000);

  const actualFocusMs = isComplete
    ? record.focusDurationMs
    : Math.max(0, record.endedAt - record.startedAt);
  const actualFocusMin = Math.round(actualFocusMs / 60000);

  // Blocks completed fully before the session ended
  const completedFocusBlocks = isComplete
    ? plannedFocusBlocks
    : Math.min(plannedFocusBlocks - 1, Math.floor(actualFocusMs / (5 * 60 * 1000)));
  const achievedFocusBlocks = Math.max(isComplete ? 1 : 0, completedFocusBlocks);

  // The one block they were actively in when the session broke (shown in red)
  const lostBlock = !isComplete && plannedFocusBlocks > achievedFocusBlocks;

  const missedFocusBlocks = isComplete
    ? 0
    : Math.max(0, plannedFocusBlocks - achievedFocusBlocks - (lostBlock ? 1 : 0));

  const breakBlocks = plannedBreakBlocks;
  const breakDim = !isComplete; // dim if break was never reached

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
        lostBlock={lostBlock}
        missedFocusBlocks={missedFocusBlocks}
        breakBlocks={breakBlocks}
        breakDim={breakDim}
      />

      {/* Legend */}
      <View style={s.legendRow}>
        {achievedFocusBlocks > 0 && (
          <View style={s.legendItem}>
            <View style={[s.legendDot, s.tileFocus]} />
            <Text style={s.legendText}>Focus</Text>
          </View>
        )}
        {lostBlock && (
          <View style={s.legendItem}>
            <View style={[s.legendDot, s.tileLost]} />
            <Text style={s.legendText}>Lost</Text>
          </View>
        )}
        {missedFocusBlocks > 0 && (
          <View style={s.legendItem}>
            <View style={[s.legendDot, s.tileMissed]} />
            <Text style={s.legendText}>Planned</Text>
          </View>
        )}
        {breakBlocks > 0 && (
          <View style={s.legendItem}>
            <View style={[s.legendDot, breakDim ? s.tileBreakDim : s.tileBreak]} />
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
    alignSelf: 'stretch',
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
    color: colors.cosmicLatte,
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
