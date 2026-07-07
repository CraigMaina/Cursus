/**
 * Auth screens (Frontend-owned). The orchestrator points the routing map at these:
 *   /auth/sign-in -> <SignIn />
 *   /auth/sign-up -> <SignUp />
 * They consume Supabase Auth ONLY through the DAL (useData) via useAuthActions.
 */
export { SignIn } from './SignIn';
export { SignUp } from './SignUp';
