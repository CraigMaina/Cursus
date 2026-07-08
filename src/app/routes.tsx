import { createBrowserRouter } from 'react-router-dom';
import { ScaffoldScreen } from '@/app/ScaffoldScreen';
import { SignIn, SignUp } from '@/screens/auth';
import { Today } from '@/screens/today';
import { Library } from '@/screens/library';
import { Builder } from '@/screens/builder';

/**
 * Routing map (PRD sections 4 and 8). Orchestrator-owned contract.
 *
 * Each route currently renders a ScaffoldScreen placeholder. As the Frontend agent
 * delivers a screen, the orchestrator swaps the `element` for the real component at
 * integration time. Paths and nesting are the stable contract; screens fill in.
 *
 * Route map:
 *   /                       Today view (default landing)
 *   /auth/sign-in           Email + password / Google OAuth
 *   /auth/sign-up
 *   /library                Challenge library (system templates as plaques)
 *   /builder                Challenge builder (new)
 *   /builder/:challengeId   Challenge builder (edit)
 *   /calendar/:challengeId  Progress calendar (mosaic)
 *   /vices                  Vice tracker list
 *   /vices/:viceId          Single vice detail (days-clean, relapses, savings)
 *   /stats                  Stats dashboard
 *   /settings               Settings and profile
 */
export const router = createBrowserRouter([
  { path: '/', element: <Today /> },
  { path: '/auth/sign-in', element: <SignIn /> },
  { path: '/auth/sign-up', element: <SignUp /> },
  { path: '/library', element: <Library /> },
  { path: '/builder', element: <Builder /> },
  { path: '/builder/:challengeId', element: <Builder /> },
  { path: '/calendar/:challengeId', element: <ScaffoldScreen title="Calendar" phase="Phase 3" /> },
  { path: '/vices', element: <ScaffoldScreen title="Vices" phase="Phase 4" /> },
  { path: '/vices/:viceId', element: <ScaffoldScreen title="Vice" phase="Phase 4" /> },
  { path: '/stats', element: <ScaffoldScreen title="Stats" phase="Phase 6" /> },
  { path: '/settings', element: <ScaffoldScreen title="Settings" phase="Phase 6" /> },
  { path: '*', element: <ScaffoldScreen title="Not found" phase="—" /> },
]);
