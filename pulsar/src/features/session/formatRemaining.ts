import type { PulsarSession } from '@/src/features/session/domain/types';
import { breakEndsAt, focusEndsAt } from '@/src/features/session/domain/types';

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

function formatMs(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

export function formatSessionRemaining(session: PulsarSession, nowMs: number): string | null {
  if (session.state === 'focus_active') {
    const end = focusEndsAt(session);
    if (end == null) return null;
    return formatMs(Math.max(0, end - nowMs));
  }
  if (session.state === 'break_active') {
    const end = breakEndsAt(session);
    if (end == null) return null;
    return formatMs(Math.max(0, end - nowMs));
  }
  return null;
}
