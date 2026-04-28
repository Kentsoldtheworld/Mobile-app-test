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

  if (
    session.state === 'idle' ||
    session.state === 'focus_complete' ||
    session.state === 'break_complete' ||
    session.state === 'destabilized' ||
    session.state === 'completed'
  ) {
    return { session, applied };
  }

  if (session.state === 'focus_active') {
    const end = focusEndsAt(session);
    if (end != null && nowMs >= end) {
      // Sessions always end on the last focus timer — never on a break.
      if (session.currentCycle >= session.plannedCycles) {
        applied.push('focus_elapsed_to_completed');
        return {
          session: { ...session, state: 'completed', completedAt: end },
          applied,
        };
      }
      applied.push('focus_elapsed_to_focus_complete');
      return {
        session: { ...session, state: 'focus_complete' },
        applied,
      };
    }
    return { session, applied };
  }

  if (session.state === 'break_active') {
    const end = breakEndsAt(session);
    if (end != null && nowMs >= end) {
      // Break done — prompt user to start the next focus period.
      applied.push('break_elapsed_to_break_complete');
      return {
        session: { ...session, state: 'break_complete' },
        applied,
      };
    }
    return { session, applied };
  }

  return { session, applied };
}
