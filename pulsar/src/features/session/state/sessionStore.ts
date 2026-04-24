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
import { CUSTOM_PLACEHOLDER_PRESET, PRESETS, type PresetId } from '@/src/features/session/presets';

export type SessionSlice = {
  hasSeenWelcome: boolean;
  session: PulsarSession;
  history: SessionHistoryRecord[];
  setHasSeenWelcome: (v: boolean) => void;
  startSessionFromPreset: (presetId: Exclude<PresetId, 'custom'>) => void;
  startSessionCustomPlaceholder: () => void;
  reconcile: () => void;
  onLeaveActiveDuringFocus: () => void;
  resetSessionToIdle: () => void;
  startNextSessionAfterCompletedFlow: (presetId: Exclude<PresetId, 'custom'>) => void;
};

function syncNotificationsForSession(session: PulsarSession) {
  void (async () => {
    const ok = await NotificationService.ensureNotificationPermission();
    if (!ok) return;
    if (session.state === 'break_active') {
      const end = breakEndsAt(session);
      if (end != null) await NotificationService.scheduleBreakCompleteNotification(end);
    } else {
      await NotificationService.cancelBreakEndNotification();
      if (session.state !== 'destabilized') {
        await NotificationService.cancelDestabilizeNotification();
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

      setHasSeenWelcome: (v) => set({ hasSeenWelcome: v }),

      startSessionFromPreset: (presetId) => {
        const preset = PRESETS[presetId];
        const now = Date.now();
        const session = createFocusSession(now, {
          focusDurationMs: preset.focusDurationMs,
          breakDurationMs: preset.breakDurationMs,
          presetId: preset.id,
        });
        set({ session });
        void NotificationService.cancelAllPulsarNotifications();
        void NotificationService.ensureNotificationPermission();
      },

      startSessionCustomPlaceholder: () => {
        const p = CUSTOM_PLACEHOLDER_PRESET;
        const now = Date.now();
        const session = createFocusSession(now, {
          focusDurationMs: p.focusDurationMs,
          breakDurationMs: p.breakDurationMs,
          presetId: p.id,
        });
        set({ session });
        void NotificationService.cancelAllPulsarNotifications();
        void NotificationService.ensureNotificationPermission();
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
        syncNotificationsForSession(get().session);
      },

      onLeaveActiveDuringFocus: () => {
        const now = Date.now();
        set((state) => {
          const res = destabilizeOnFocusExit(now, state.session);
          if (!res.ok) return state;
          const next = res.session;
          const history = [...state.history, buildHistoryRecord(next, 'destabilized')];
          return { session: next, history };
        });
        const s = get().session;
        if (s.state === 'destabilized') {
          void NotificationService.cancelBreakEndNotification();
          void NotificationService.ensureNotificationPermission().then((ok) => {
            if (ok) void NotificationService.scheduleDestabilizationNudge();
          });
        }
      },

      resetSessionToIdle: () => {
        set({ session: IDLE_SESSION });
        void NotificationService.cancelAllPulsarNotifications();
      },

      startNextSessionAfterCompletedFlow: (presetId) => {
        const prev = get().session;
        const preset = PRESETS[presetId];
        const next = startNextSessionAfterCompleted(Date.now(), prev, {
          focusDurationMs: preset.focusDurationMs,
          breakDurationMs: preset.breakDurationMs,
          presetId: preset.id,
        });
        if (!next) return;
        set({ session: next });
        void NotificationService.cancelAllPulsarNotifications();
        void NotificationService.ensureNotificationPermission();
      },
    }),
    {
      name: 'pulsar-session-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        hasSeenWelcome: s.hasSeenWelcome,
        session: s.session,
        history: s.history,
      }),
      version: 1,
    }
  )
);
