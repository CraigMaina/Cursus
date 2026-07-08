/**
 * Stats dashboard (Frontend-owned). The orchestrator points the routing map at this:
 *   /stats -> <Stats />
 * It consumes the DAL ONLY through `useData()` (via `useStats`). No Supabase import.
 */
export { Stats } from './Stats';
