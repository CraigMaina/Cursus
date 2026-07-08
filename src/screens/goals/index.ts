/**
 * Goals area (Frontend-owned, D16). The orchestrator points the routing map at these:
 *   /goals           -> <GoalsList />
 *   /goals/:goalId   -> <GoalDetail />
 * One area, three kinds (metric | reading | routine). Both screens consume the DAL ONLY
 * through `useData()` (via the goals hooks). No Supabase import anywhere in this module.
 */
export { GoalsList } from './GoalsList';
export { GoalDetail } from './GoalDetail';
