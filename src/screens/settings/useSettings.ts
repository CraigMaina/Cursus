import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useData } from '@/app/data-context';
import type { NotificationPrefs, Profile } from '@/lib/domain/schemas';

/**
 * Settings data layer (PRD 6, profile + notification preferences). Reads and writes the
 * profile (display name, timezone, evening threshold) and notification_prefs (email
 * toggle, quiet hours) exclusively through the DAL. The push toggle itself is handled by
 * `useNotifications`; `pushEnabled` here is the user's stated preference the server honors.
 */
export function useSettings() {
  const data = useData();
  const qc = useQueryClient();

  const session = useQuery({ queryKey: ['session'], queryFn: () => data.getSession() });
  const authed = Boolean(session.data);

  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: () => data.getProfile(),
    enabled: authed,
  });
  const prefs = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: () => data.getNotificationPrefs(),
    enabled: authed,
  });

  const saveProfile = useMutation({
    mutationFn: (patch: Partial<Omit<Profile, 'id' | 'createdAt'>>) =>
      data.updateProfile(patch),
    onSuccess: (next) => qc.setQueryData(['profile'], next),
  });

  const savePrefs = useMutation({
    mutationFn: (patch: Partial<Omit<NotificationPrefs, 'userId'>>) =>
      data.updateNotificationPrefs(patch),
    onSuccess: (next) => qc.setQueryData(['notification-prefs'], next),
  });

  return {
    authed,
    loading: session.isLoading || (authed && (profile.isLoading || prefs.isLoading)),
    error: session.error ?? profile.error ?? prefs.error ?? null,
    profile: profile.data ?? null,
    prefs: prefs.data ?? null,
    saveProfile: saveProfile.mutate,
    savingProfile: saveProfile.isPending,
    savePrefs: savePrefs.mutate,
    savingPrefs: savePrefs.isPending,
    saveError: saveProfile.error ?? savePrefs.error ?? null,
  };
}
