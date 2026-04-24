import type { PulsarSession } from './types';
import { breakEndsAt, focusEndsAt } from './types';

export type ReconcileResult = {
  session: PulsarSession;
  /** Human-readable steps for tests / debugging */
  applied: string[];
};

/**
 * Derives correct session phase from persisted timestamps + now.
 * Does not apply lifecycle-only transitions (e.g. destabilize on background).
 */
export function reconcileSession(nowMs: number, session: PulsarSession): ReconcileResult {
  const applied: string[] = [];

  if (session.state === 'idle' || session.state === 'destabilized' || session.state === 'completed') {
    return { session, applied };
  }

  if (session.state === 'focus_active') {
    const end = focusEndsAt(session);
    if (end != null && nowMs >= end) {
      applied.push('focus_elapsed_to_break');
      return {
        session: {
          ...session,
          state: 'break_active',
          breakStartedAt: end,
        },
        applied,
      };
    }
    return { session, applied };
  }

  if (session.state === 'break_active') {
    const end = breakEndsAt(session);
    if (end != null && nowMs >= end) {
      applied.push('break_elapsed_to_completed');
      return {
        session: {
          ...session,
          state: 'completed',
          completedAt: end,
        },
        applied,
      };
    }
    return { session, applied };
  }

  return { session, applied };
}
