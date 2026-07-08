import { useSyncExternalStore } from 'react';
import { onlineManager, useMutationState } from '@tanstack/react-query';

/**
 * Online/offline state, sourced from TanStack Query's `onlineManager` (which tracks
 * `navigator.onLine` and the window online/offline events). When offline, mutations
 * pause after their optimistic update and resume automatically on reconnect.
 */
export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
    () => true,
  );
}

/** How many mutations are paused (queued while offline), for a sync indicator. */
export function usePausedMutationCount(): number {
  return useMutationState({
    filters: { predicate: (m) => m.state.isPaused },
    select: () => 1 as const,
  }).length;
}
