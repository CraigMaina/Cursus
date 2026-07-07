/**
 * Challenge library (Frontend-owned). The orchestrator points the routing map at this:
 *   /library -> <Library />
 * It consumes the DAL ONLY through `useData()` (via `useLibrary`). No Supabase import.
 */
export { Library } from './Library';
