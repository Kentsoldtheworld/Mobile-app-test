import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useSessionStore } from '@/src/features/session/state/sessionStore';

type Props = {
  children: React.ReactNode;
};

export function SessionLifecycleRoot({ children }: Props) {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (useSessionStore.persist.hasHydrated()) {
      useSessionStore.getState().reconcile();
    }
    const unsubHydrate = useSessionStore.persist.onFinishHydration(() => {
      useSessionStore.getState().reconcile();
    });
    return unsubHydrate;
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;
      if (prev === 'active' && next !== 'active') {
        useSessionStore.getState().onLeaveActiveDuringFocus();
      }
      if (prev !== 'active' && next === 'active') {
        useSessionStore.getState().reconcile();
      }
    });
    return () => sub.remove();
  }, []);

  return <>{children}</>;
}
