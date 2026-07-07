import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { SealButton } from '@/components/primitives';
import { cx } from '@/theme';
import { AuthLayout } from './AuthLayout';
import { AuthField } from './AuthField';
import { GoogleButton } from './GoogleButton';
import { signUpSchema, type SignUpValues } from './authForms';
import { authErrorMessage, useAuthActions } from './useAuthActions';

/**
 * Sign-up screen (PRD 4.1 #1). Sign-up is required to use the app; no anonymous
 * session in v1. Email + password (with confirmation) and a Google option, validated
 * with react-hook-form + zod, wired to Supabase Auth ONLY through the DAL.
 */
export function SignUp() {
  const { signUp, google } = useAuthActions();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirm: '' },
  });

  const formError = authErrorMessage(signUp.error) ?? authErrorMessage(google.error);

  return (
    <AuthLayout
      heading="Begin"
      intro="Create an account to start your first challenge. Day one is a single stamp."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/auth/sign-in" className="font-medium text-pompeian-red underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form
        noValidate
        onSubmit={handleSubmit((values) => signUp.mutate({ email: values.email, password: values.password }))}
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
          id="signup-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <AuthField
          id="signup-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <AuthField
          id="signup-confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />

        <SealButton type="submit" size="lg" fullWidth loading={signUp.isPending} className="mt-2">
          Create account
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
