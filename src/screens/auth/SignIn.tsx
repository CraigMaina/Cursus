import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { SealButton } from '@/components/primitives';
import { cx } from '@/theme';
import { AuthLayout } from './AuthLayout';
import { AuthField } from './AuthField';
import { GoogleButton } from './GoogleButton';
import { signInSchema, type SignInValues } from './authForms';
import { authErrorMessage, useAuthActions } from './useAuthActions';

/**
 * Sign-in screen (PRD 4.1 #1). Email + password and a Google option, validated with
 * react-hook-form + zod, wired to Supabase Auth ONLY through the DAL (useAuthActions
 * -> useData). No Supabase import here.
 */
export function SignIn() {
  const { signIn, google } = useAuthActions();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const formError = authErrorMessage(signIn.error) ?? authErrorMessage(google.error);

  return (
    <AuthLayout
      heading="Sign in"
      intro="Return to the course. Your streaks are where you left them."
      footer={
        <>
          New here?{' '}
          <Link to="/auth/sign-up" className="font-medium text-pompeian-red underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <form
        noValidate
        onSubmit={handleSubmit((values) => signIn.mutate(values))}
        className="flex flex-col gap-4"
      >
        {formError ? (
          <p
            role="alert"
            className="rounded-tessera border border-pompeian-red/40 bg-pompeian-red/10 px-3 py-2 font-sans text-sm text-pompeian-red"
          >
            {formError}
          </p>
        ) : null}

        <AuthField
          id="signin-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <AuthField
          id="signin-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password?.message}
          {...register('password')}
        />

        <SealButton type="submit" size="lg" fullWidth loading={signIn.isPending} className="mt-2">
          Sign in
        </SealButton>
      </form>

      <div className="my-6 flex items-center gap-3" aria-hidden>
        <span className={cx('h-px flex-1 bg-ink/15')} />
        <span className="font-sans text-xs uppercase tracking-[0.2em] text-ink/40">or</span>
        <span className={cx('h-px flex-1 bg-ink/15')} />
      </div>

      <GoogleButton onClick={() => google.mutate()} loading={google.isPending} />
    </AuthLayout>
  );
}
