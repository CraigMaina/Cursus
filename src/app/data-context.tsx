import { createContext, useContext, type ReactNode } from 'react';
import type { CursusDataAccess } from '@/lib/domain/dal';

/**
 * App-level data-access seam (orchestrator-owned). The Frontend consumes the DAL
 * ONLY through `useData()`, typed to the `CursusDataAccess` contract. The Architect
 * builds the concrete implementation in `src/data` and the orchestrator wires it in
 * at `main.tsx` via `<DataProvider value={realImpl}>`.
 *
 * This decouples the UI and backend worktrees: Frontend imports `useData()` today
 * against the contract; the concrete impl is swapped in at integration.
 */
const DataContext = createContext<CursusDataAccess | null>(null);

export function DataProvider({
  value,
  children,
}: {
  value: CursusDataAccess;
  children: ReactNode;
}) {
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): CursusDataAccess {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData() called outside <DataProvider>. Wire the DAL in main.tsx.');
  }
  return ctx;
}

/**
 * Temporary stand-in used until the Architect's `src/data` implementation is merged.
 * Every method throws, so the scaffold builds and runs but any real data call fails
 * loudly. The orchestrator replaces this with the concrete impl at integration.
 * Frontend may also import this to render screens in isolation for layout work.
 */
export const placeholderDataAccess: CursusDataAccess = new Proxy(
  {} as CursusDataAccess,
  {
    get(_t, prop) {
      return () => {
        throw new Error(
          `DAL not wired yet: ${String(prop)}(). Provide a DataProvider value.`,
        );
      };
    },
  },
);
