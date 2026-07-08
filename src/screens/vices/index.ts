/**
 * Vice tracker (Frontend-owned). The orchestrator points the routing map at these:
 *   /vices           -> <Vices />
 *   /vices/:viceId   -> <ViceDetail />
 * Both consume the DAL ONLY through `useData()` (via `useVices` / `useVice`). No
 * Supabase import anywhere in this module.
 */
export { Vices } from './Vices';
export { ViceDetail } from './ViceDetail';
