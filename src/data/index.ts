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
