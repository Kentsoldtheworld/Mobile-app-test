import type { PulsarSession, SessionHistoryRecord } from './types';

export function buildHistoryRecord(
  session: PulsarSession,
  outcome: 'completed' | 'destabilized'
): SessionHistoryRecord {
  const endedAt =
    outcome === 'completed'
      ? (session.completedAt ?? session.focusStartedAt ?? Date.now())
      : (session.destabilizedAt ?? Date.now());

  return {
    id: session.id,
    startedAt: session.focusStartedAt ?? endedAt,
    endedAt,
    presetId: session.presetId,
    focusDurationMs: session.focusDurationMs,
    breakDurationMs: session.breakDurationMs,
    plannedCycles: session.plannedCycles,
    interruptionCount: session.interruptions.length,
    outcome,
  };
}
