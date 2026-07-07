/**
 * Today view (Frontend-owned). The orchestrator points the routing map at this:
 *   / -> <Today />
 * It consumes the DAL ONLY through `useData()` (via `useToday`). No Supabase import.
 */
export { Today } from './Today';
