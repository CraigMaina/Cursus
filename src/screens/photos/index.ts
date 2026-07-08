/**
 * Progress-photo timeline (Frontend-owned). The orchestrator points the routing map
 * at this:
 *   /photos/:challengeId  -> <Photos />
 * Consumes the DAL ONLY through `useData()` (via `usePhotos`). No Supabase import.
 */
export { Photos } from './Photos';
