import type { PulsarSession } from './types';

export type DestabilizeResult =
  | { ok: true; session: PulsarSession }
  | { ok: false; reason: 'not_focus_active' };

/**
 * Leaving the app during focus destabilizes the commitment (PRD).
 * Call when AppState transitions away from active while in focus_active.
 */
export function destabilizeOnFocusExit(nowMs: number, session: PulsarSession): DestabilizeResult {
  if (session.state !== 'focus_active') {
    return { ok: false, reason: 'not_focus_active' };
  }

  return {
    ok: true,
    session: {
      ...session,
      state: 'destabilized',
      destabilizedAt: nowMs,
      interruptions: [...session.interruptions, nowMs],
    },
  };
}
