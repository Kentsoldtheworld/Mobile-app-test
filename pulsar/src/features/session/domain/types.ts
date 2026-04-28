export type SessionState =
  | 'idle'
  | 'focus_active'
  | 'focus_complete'   // focus timer done, break not yet started (only when cycle < plannedCycles)
  | 'break_active'
  | 'break_complete'   // break timer done, waiting for user to start next focus
  | 'destabilized'
  | 'completed';       // last focus timer done (session always ends on focus, never break)

export type PulsarSession = {
  id: string;
  /** Optional label for analytics / history (e.g. pomodoro) */
  presetId?: string;
  state: SessionState;
  focusDurationMs: number;
  breakDurationMs: number;
  /**
   * Number of focus periods planned.  Sessions always end on a focus timer.
   * Pattern: F (B F) × (plannedCycles - 1)
   * e.g. plannedCycles=3 → F B F B F
   */
  plannedCycles: number;
  /** Which focus period we are currently on (1-indexed). */
  currentCycle: number;
  focusStartedAt: number | null;
  breakStartedAt: number | null;
  destabilizedAt: number | null;
  completedAt: number | null;
  interruptions: number[];
};

export type SessionHistoryRecord = {
  id: string;
  startedAt: number;
  endedAt: number;
  presetId?: string;
  focusDurationMs: number;
  breakDurationMs: number;
  /** Number of focus periods planned (= plannedCycles from PulsarSession). */
  plannedCycles: number;
  interruptionCount: number;
  outcome: 'completed' | 'destabilized';
};

export const IDLE_SESSION: PulsarSession = {
  id: '',
  state: 'idle',
  focusDurationMs: 0,
  breakDurationMs: 0,
  plannedCycles: 1,
  currentCycle: 1,
  focusStartedAt: null,
  breakStartedAt: null,
  destabilizedAt: null,
  completedAt: null,
  interruptions: [],
};

export function focusEndsAt(session: PulsarSession): number | null {
  if (session.focusStartedAt == null) return null;
  return session.focusStartedAt + session.focusDurationMs;
}

export function breakEndsAt(session: PulsarSession): number | null {
  if (session.breakStartedAt == null) return null;
  return session.breakStartedAt + session.breakDurationMs;
}
