import { createBrowserRouter } from 'react-router-dom';
import { ScaffoldScreen } from '@/app/ScaffoldScreen';
import { SignIn, SignUp } from '@/screens/auth';
import { Today } from '@/screens/today';
import { Library } from '@/screens/library';
import { Builder } from '@/screens/builder';
import { Calendar } from '@/screens/calendar';
import { Vices, ViceDetail } from '@/screens/vices';
import { GoalsList, GoalDetail } from '@/screens/goals';
import { Settings } from '@/screens/settings';
import { Photos } from '@/screens/photos';
import { Stats } from '@/screens/stats';

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
 *   /goals                  Goals list (metric | reading | routine)
 *   /goals/:goalId          Single goal detail (kind-specific panel)
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
  { path: '/calendar/:challengeId', element: <Calendar /> },
  { path: '/photos/:challengeId', element: <Photos /> },
  { path: '/vices', element: <Vices /> },
  { path: '/vices/:viceId', element: <ViceDetail /> },
  { path: '/goals', element: <GoalsList /> },
  { path: '/goals/:goalId', element: <GoalDetail /> },
  { path: '/stats', element: <Stats /> },
  { path: '/settings', element: <Settings /> },
  { path: '*', element: <ScaffoldScreen title="Not found" phase="—" /> },
]);
