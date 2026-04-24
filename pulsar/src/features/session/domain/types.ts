export type SessionState =
  | 'idle'
  | 'focus_active'
  | 'break_active'
  | 'destabilized'
  | 'completed';

export type PulsarSession = {
  id: string;
  /** Optional label for analytics / history (e.g. pomodoro) */
  presetId?: string;
  state: SessionState;
  focusDurationMs: number;
  breakDurationMs: number;
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
  interruptionCount: number;
  outcome: 'completed' | 'destabilized';
};

export const IDLE_SESSION: PulsarSession = {
  id: '',
  state: 'idle',
  focusDurationMs: 0,
  breakDurationMs: 0,
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
