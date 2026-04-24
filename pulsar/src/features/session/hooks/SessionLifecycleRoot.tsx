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
        // App went to background — schedule background-only notifications
        useSessionStore.getState().onAppBackground();
      }

      if (prev !== 'active' && next === 'active') {
        // App returned — check grace period, then reconcile
        useSessionStore.getState().onReturnFromBackground();
      }
    });
    return () => sub.remove();
  }, []);

  return <>{children}</>;
}
