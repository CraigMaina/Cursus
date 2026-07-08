/**
 * Progress calendar (Frontend-owned). The orchestrator points the routing map at this:
 *   /calendar/:challengeId  -> <Calendar />
 * Consumes the DAL ONLY through `useData()` (via `useCalendar`). No Supabase import.
 */
export { Calendar } from './Calendar';
