import { useCallback, useEffect, useState } from 'react';
import { useData } from '@/app/data-context';

/**
 * Web Push subscription lifecycle for the Settings screen (PRD 6). Bridges the browser
 * PushManager to the DAL: request permission, subscribe with the VAPID public key, and
 * persist the subscription (`savePushSubscription`) so the server-side alert pipeline can
 * reach this device. All Supabase access is via `useData()`.
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

/** VAPID keys are base64url; PushManager needs the raw bytes. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushState =
  | 'unsupported' // no service worker / PushManager
  | 'unconfigured' // no VAPID public key in this build
  | 'denied' // user blocked notifications
  | 'subscribed'
  | 'idle'; // supported, permitted or default, not yet subscribed

export function useNotifications() {
  const data = useData();
  const supported =
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  const [state, setState] = useState<PushState>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveState = useCallback(async () => {
    if (!supported) return setState('unsupported');
    if (!VAPID_PUBLIC_KEY) return setState('unconfigured');
    if (Notification.permission === 'denied') return setState('denied');
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setState(sub ? 'subscribed' : 'idle');
  }, [supported]);

  useEffect(() => {
    void resolveState();
  }, [resolveState]);

  const subscribe = useCallback(async () => {
    if (!supported || !VAPID_PUBLIC_KEY) return;
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'idle');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      // .buffer is a freshly allocated ArrayBuffer (BufferSource) for applicationServerKey.
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      const json = sub.toJSON();
      await data.savePushSubscription({
        endpoint: sub.endpoint,
        keys: {
          p256dh: json.keys?.p256dh ?? '',
          auth: json.keys?.auth ?? '',
        },
        userAgent: navigator.userAgent,
      });
      setState('subscribed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enable notifications.');
    } finally {
      setBusy(false);
    }
  }, [data, supported]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await data.deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not turn off notifications.');
    } finally {
      setBusy(false);
    }
  }, [data, supported]);

  return { state, busy, error, subscribe, unsubscribe };
}
