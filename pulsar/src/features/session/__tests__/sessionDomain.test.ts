import { destabilizeOnFocusExit } from '@/src/features/session/domain/destabilize';
import { reconcileSession } from '@/src/features/session/domain/reconcile';
import { createFocusSession, startNextSessionAfterCompleted } from '@/src/features/session/domain/startSession';
import { IDLE_SESSION } from '@/src/features/session/domain/types';

describe('reconcileSession', () => {
  it('advances focus_active to break_active when focus window elapsed', () => {
    const t0 = 1_000_000;
    const session = createFocusSession(t0, { focusDurationMs: 10_000, breakDurationMs: 5_000 });
    const { session: next, applied } = reconcileSession(t0 + 10_000, session);
    expect(applied).toContain('focus_elapsed_to_break');
    expect(next.state).toBe('break_active');
    expect(next.breakStartedAt).toBe(t0 + 10_000);
  });

  it('advances break_active to completed when break window elapsed', () => {
    const t0 = 2_000_000;
    let session = createFocusSession(t0, { focusDurationMs: 1_000, breakDurationMs: 3_000 });
    session = reconcileSession(t0 + 1_000, session).session;
    expect(session.state).toBe('break_active');
    const { session: done, applied } = reconcileSession(t0 + 1_000 + 3_000, session);
    expect(applied).toContain('break_elapsed_to_completed');
    expect(done.state).toBe('completed');
    expect(done.completedAt).toBe(t0 + 1_000 + 3_000);
  });

  it('does not auto-start a new focus session after completed', () => {
    const t0 = 3_000_000;
    let session = createFocusSession(t0, { focusDurationMs: 1_000, breakDurationMs: 1_000 });
    session = reconcileSession(t0 + 1_000, session).session;
    session = reconcileSession(t0 + 2_000, session).session;
    expect(session.state).toBe('completed');
    const later = reconcileSession(t0 + 9_000_000, session);
    expect(later.session.state).toBe('completed');
    expect(later.applied).toHaveLength(0);
  });
});

describe('destabilizeOnFocusExit', () => {
  it('destabilizes only from focus_active', () => {
    const t0 = 4_000_000;
    const session = createFocusSession(t0, { focusDurationMs: 60_000, breakDurationMs: 5_000 });
    const res = destabilizeOnFocusExit(t0 + 5_000, session);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.session.state).toBe('destabilized');
      expect(res.session.interruptions).toHaveLength(1);
    }
    const bad = destabilizeOnFocusExit(t0 + 6_000, IDLE_SESSION);
    expect(bad.ok).toBe(false);
  });
});

describe('startNextSessionAfterCompleted', () => {
  it('returns null unless previous session is completed', () => {
    const t0 = 5_000_000;
    const running = createFocusSession(t0, { focusDurationMs: 1_000, breakDurationMs: 1_000 });
    expect(startNextSessionAfterCompleted(t0 + 2, running, { focusDurationMs: 1, breakDurationMs: 1 })).toBeNull();
  });

  it('starts a new focus session only after completed', () => {
    const t0 = 6_000_000;
    let session = createFocusSession(t0, { focusDurationMs: 1_000, breakDurationMs: 1_000 });
    session = reconcileSession(t0 + 1_000, session).session;
    session = reconcileSession(t0 + 2_000, session).session;
    const next = startNextSessionAfterCompleted(t0 + 3_000, session, {
      focusDurationMs: 2_000,
      breakDurationMs: 500,
      presetId: 'frequent',
    });
    expect(next).not.toBeNull();
    expect(next!.state).toBe('focus_active');
    expect(next!.focusDurationMs).toBe(2_000);
  });
});
