import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { destabilizeOnFocusExit } from '@/src/features/session/domain/destabilize';
import { buildHistoryRecord } from '@/src/features/session/domain/history';
import { reconcileSession } from '@/src/features/session/domain/reconcile';
import { createFocusSession, startNextSessionAfterCompleted } from '@/src/features/session/domain/startSession';
import type { PulsarSession, SessionHistoryRecord } from '@/src/features/session/domain/types';
import { IDLE_SESSION, breakEndsAt } from '@/src/features/session/domain/types';
import * as NotificationService from '@/src/features/session/notifications/notificationService';
import { GRACE_PERIOD_MS } from '@/src/features/session/notifications/notificationService';

export type SessionSlice = {
  hasSeenWelcome: boolean;
  session: PulsarSession;
  history: SessionHistoryRecord[];
  /** In-memory only — tracks when the user backgrounded the app during focus. */
  backgroundedAt: number | null;
  setHasSeenWelcome: (v: boolean) => void;
  startSessionFromPreset: (presetId: string, focusMinutes: number, breakMinutes: number) => void;
  /** Whole minutes; persisted session uses ms. */
  startSessionCustomMinutes: (focusMinutes: number, breakMinutes: number, cycles?: number) => void;
  /** Called when focus timer elapses and user taps "Start break". */
  startBreak: () => void;
  /** Called when user confirms X exit during focus — immediately begins break. */
  skipToBreak: () => void;
  reconcile: () => void;
  /** Called when the app is backgrounded. Starts grace period if focusing, schedules break-end alarm if on break. */
  onAppBackground: () => void;
  /** Called when the app returns to foreground. Resumes or destabilizes based on elapsed time. */
  onReturnFromBackground: () => void;
  resetSessionToIdle: () => void;
  /** Skips the current break and immediately starts the next focus round. */
  skipBreak: () => void;
  /** Starts a new focus round using the same durations as the completed session. */
  startNextRound: () => void;
};

/**
 * Only cancels stale notifications when state changes.
 * Background-only notifications (focus-complete, break-end) are scheduled
 * in onAppBackground so they never fire while the app is open.
 */
function cancelStaleNotifications(session: PulsarSession) {
  void (async () => {
    if (session.state === 'break_active') {
      // Entering break — cancel any leftover focus/grace notifications
      await NotificationService.cancelFocusCompleteNotification();
      await NotificationService.cancelGraceNotifications();
    } else if (
      session.state === 'idle' ||
      session.state === 'focus_complete' ||
      session.state === 'completed' ||
      session.state === 'destabilized'
    ) {
      await NotificationService.cancelAllPulsarNotifications();
      if (session.state === 'destabilized') {
        const granted = await NotificationService.ensureNotificationPermission();
        if (granted) void NotificationService.scheduleDestabilizationNudge();
      }
    }
  })();
}

export const useSessionStore = create<SessionSlice>()(
  persist(
    (set, get) => ({
      hasSeenWelcome: false,
      session: IDLE_SESSION,
      history: [],
      backgroundedAt: null,

      setHasSeenWelcome: (v) => set({ hasSeenWelcome: v }),

      startSessionFromPreset: (_presetId, focusMinutes, breakMinutes) => {
        const now = Date.now();
        const session = createFocusSession(now, {
          focusDurationMs: focusMinutes * 60 * 1000,
          breakDurationMs: breakMinutes * 60 * 1000,
        });
        set({ session, backgroundedAt: null });
        void NotificationService.cancelAllPulsarNotifications();
      },

      startSessionCustomMinutes: (focusMinutes, breakMinutes, cycles = 1) => {
        const focusClamped = Math.min(240, Math.max(1, Math.round(focusMinutes)));
        const breakClamped = Math.min(120, Math.max(1, Math.round(breakMinutes)));
        const cyclesClamped = Math.min(8, Math.max(1, Math.round(cycles)));
        const now = Date.now();
        const session = createFocusSession(now, {
          focusDurationMs: focusClamped * 60 * 1000,
          breakDurationMs: breakClamped * 60 * 1000,
          plannedCycles: cyclesClamped,
          currentCycle: 1,
        });
        set({ session, backgroundedAt: null });
        void NotificationService.cancelAllPulsarNotifications();
      },

      startBreak: () => {
        const now = Date.now();
        set((state) => {
          const { session } = state;
          if (session.state !== 'focus_complete') return state;
          return { session: { ...session, state: 'break_active', breakStartedAt: now } };
        });
        cancelStaleNotifications(get().session);
      },

      skipToBreak: () => {
        const now = Date.now();
        set((state) => {
          const { session } = state;
          if (session.state !== 'focus_active') return state;
          return {
            session: { ...session, state: 'break_active', breakStartedAt: now },
            backgroundedAt: null,
          };
        });
        cancelStaleNotifications(get().session);
      },

      reconcile: () => {
        const now = Date.now();
        set((state) => {
          const { session: next, applied } = reconcileSession(now, state.session);
          if (applied.length === 0) return state;
          let history = state.history;
          if (applied.includes('break_elapsed_to_completed')) {
            history = [...state.history, buildHistoryRecord(next, 'completed')];
          }
          return { session: next, history };
        });
        cancelStaleNotifications(get().session);
      },

      onAppBackground: () => {
        const { session } = get();
        void (async () => {
          const granted = await NotificationService.ensureNotificationPermission();
          if (!granted) return;

          if (session.state === 'focus_active') {
            // Start grace period: warn immediately, expire after 60s
            const now = Date.now();
            set({ backgroundedAt: now });
            await NotificationService.scheduleGraceNotifications();
          } else if (session.state === 'break_active') {
            // Schedule break-end alarm only now that user has left the app
            const breakEnd = breakEndsAt(session);
            if (breakEnd != null) {
              await NotificationService.scheduleBreakCompleteNotification(breakEnd);
            }
          }
        })();
      },

      onReturnFromBackground: () => {
        const { backgroundedAt, session } = get();

        // Cancel any background-only notifications — in-app alarm handles foreground
        void NotificationService.cancelBreakEndNotification();

        if (backgroundedAt != null && session.state === 'focus_active') {
          const elapsed = Date.now() - backgroundedAt;
          void NotificationService.cancelGraceNotifications();
          set({ backgroundedAt: null });

          if (elapsed >= GRACE_PERIOD_MS) {
            // Grace expired — break the session
            const now = Date.now();
            set((state) => {
              const res = destabilizeOnFocusExit(now, state.session);
              if (!res.ok) return state;
              const next = res.session;
              const history = [...state.history, buildHistoryRecord(next, 'destabilized')];
              return { session: next, history };
            });
            cancelStaleNotifications(get().session);
            return;
          }

          // Within grace — pause compensation: push focusStartedAt forward by
          // the time spent away so the countdown resumes exactly where it left off
          set((state) => {
            const s = state.session;
            if (s.state !== 'focus_active' || s.focusStartedAt == null) return state;
            return { session: { ...s, focusStartedAt: s.focusStartedAt + elapsed } };
          });
        } else {
          set({ backgroundedAt: null });
        }

        get().reconcile();
      },

      resetSessionToIdle: () => {
        set({ session: IDLE_SESSION, backgroundedAt: null });
        void NotificationService.cancelAllPulsarNotifications();
      },

      skipBreak: () => {
        const prev = get().session;
        if (prev.state !== 'break_active') return;
        const next = createFocusSession(Date.now(), {
          focusDurationMs: prev.focusDurationMs,
          breakDurationMs: prev.breakDurationMs,
          plannedCycles: prev.plannedCycles,
          currentCycle: Math.min(prev.currentCycle + 1, prev.plannedCycles),
          presetId: prev.presetId,
        });
        set({ session: next, backgroundedAt: null });
        void NotificationService.cancelAllPulsarNotifications();
      },

      startNextRound: () => {
        const prev = get().session;
        if (prev.state !== 'completed') return;
        const next = startNextSessionAfterCompleted(Date.now(), prev, {
          focusDurationMs: prev.focusDurationMs,
          breakDurationMs: prev.breakDurationMs,
          plannedCycles: prev.plannedCycles,
          currentCycle: Math.min(prev.currentCycle + 1, prev.plannedCycles),
          presetId: prev.presetId,
        });
        if (!next) return;
        set({ session: next, backgroundedAt: null });
        void NotificationService.cancelAllPulsarNotifications();
      },
    }),
    {
      name: 'pulsar-session-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        hasSeenWelcome: s.hasSeenWelcome,
        session: s.session,
        history: s.history,
        // backgroundedAt is intentionally NOT persisted — if the app is killed
        // during the grace window, a fresh open should just reconcile normally.
      }),
      version: 1,
    }
  )
);
