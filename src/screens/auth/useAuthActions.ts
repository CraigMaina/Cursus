import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/app/data-context';

/**
 * Auth actions hook. Wires the auth screens to the DAL (via `useData()`) through
 * TanStack Query mutations — the ONLY path to Supabase from the UI. No component
 * imports `@supabase/supabase-js`. Until the Architect's `src/data` lands, the
 * placeholder DAL throws at call time, so `error` populates and the screens show it.
 *
 * Password flows navigate to the landing route on success. Google OAuth performs a
 * provider redirect inside the DAL, so there is nothing to navigate to here.
 */
export function useAuthActions() {
  const data = useData();
  const navigate = useNavigate();

  const signIn = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      data.signInWithPassword(email, password),
    onSuccess: () => navigate('/', { replace: true }),
  });

  const signUp = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      data.signUpWithPassword(email, password),
    onSuccess: () => navigate('/', { replace: true }),
  });

  const google = useMutation({
    mutationFn: () => data.signInWithGoogle(),
  });

  return { signIn, signUp, google };
}

/** Normalize an unknown thrown value into a user-facing line (no stack, no jargon). */
export function authErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
