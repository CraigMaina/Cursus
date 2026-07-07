/**
 * Data-access layer entry point (Architect-owned).
 *
 * The orchestrator wires `dataAccess` into main.tsx's <DataProvider value={dataAccess}>,
 * replacing the placeholder. The Frontend consumes it only through `useData()` — never by
 * importing this module directly (ARCHITECTURE.md 3).
 */
import type { CursusDataAccess } from '@/lib/domain/dal';
import { SupabaseDataAccess } from './dataAccess';

/** Singleton concrete implementation of the DAL contract. */
export const dataAccess: CursusDataAccess = new SupabaseDataAccess();

export { SupabaseDataAccess } from './dataAccess';

/**
 * Derived reset helpers. The AUTHORITATIVE reset writer is the server (RPC via
 * evaluateResets); these are pure helpers so the UI can anchor "Day N of M" on the
 * effective start (day after the most recent reset) without reimplementing the rewind.
 */
export {
  effectiveStartDate,
  addDays,
  computeStrictResets,
  type ResetEvaluationInput,
} from './resetLogic';
