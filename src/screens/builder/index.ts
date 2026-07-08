/**
 * Challenge builder (Frontend-owned). The orchestrator points the routing map at this:
 *   /builder                -> <Builder />   (create from scratch)
 *   /builder/:challengeId    -> <Builder />   (edit an existing challenge)
 * It consumes the DAL ONLY through `useData()` (via `useBuilder`). No Supabase import.
 */
export { Builder } from './Builder';
