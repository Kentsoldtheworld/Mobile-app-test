import type { PulsarSession } from './types';

function newId(): string {
  try {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

export function createFocusSession(
  nowMs: number,
  params: { focusDurationMs: number; breakDurationMs: number; id?: string; presetId?: string }
): PulsarSession {
  return {
    id: params.id ?? newId(),
    presetId: params.presetId,
    state: 'focus_active',
    focusDurationMs: params.focusDurationMs,
    breakDurationMs: params.breakDurationMs,
    focusStartedAt: nowMs,
    breakStartedAt: null,
    destabilizedAt: null,
    completedAt: null,
    interruptions: [],
  };
}

/**
 * PRD: next session requires explicit user action after completed.
 * Only valid from completed.
 */
export function startNextSessionAfterCompleted(
  nowMs: number,
  completed: PulsarSession,
  next: { focusDurationMs: number; breakDurationMs: number; presetId?: string }
): PulsarSession | null {
  if (completed.state !== 'completed') return null;
  return createFocusSession(nowMs, next);
}
