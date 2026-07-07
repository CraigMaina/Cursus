import { z } from 'zod';

/**
 * Auth form schemas (Frontend-owned, local to the auth screens). These validate the
 * credential FORM before it reaches the DAL; they are not domain entities, so they
 * live here rather than in the shared schemas file. The DAL's auth methods take
 * plain (email, password) — these just guard the inputs and drive field errors via
 * @hookform/resolvers.
 */

const email = z.string().min(1, 'Enter your email').email('Enter a valid email');
const password = z.string().min(8, 'Use at least 8 characters');

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    email,
    password,
    confirm: z.string().min(1, 'Re-enter your password'),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  });
export type SignUpValues = z.infer<typeof signUpSchema>;
