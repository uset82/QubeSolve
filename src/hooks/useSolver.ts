'use client';

/**
 * QubeSolve — useSolver Hook
 *
 * React hook wrapping the Kociemba solver with loading/error states.
 */

import { useState, useCallback, useEffect } from 'react';
import { type Solution, initSolver, solveCube, isSolverReady } from '@/lib/solver';

export interface UseSolverReturn {
  /** Solve a cube from its facelet string */
  solve: (facelets: string) => Promise<Solution>;
  /** Whether the solver engine is initialized */
  isInitialized: boolean;
  /** Whether a solve is currently in progress */
  isSolving: boolean;
  /** Error message from the last solve attempt */
  error: string | null;
  /** Last computed solution */
  solution: Solution | null;
}

/**
 * Hook for the Kociemba solving engine.
 *
 * Auto-initializes the solver on mount (preloads lookup tables).
 * Provides solve(), loading, and error states.
 */
export function useSolver(): UseSolverReturn {
  const [isInitialized, setIsInitialized] = useState(isSolverReady());
  const [isSolving, setIsSolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solution, setSolution] = useState<Solution | null>(null);

  // Auto-initialize on mount
  useEffect(() => {
    if (!isInitialized) {
      initSolver()
        .then(() => setIsInitialized(true))
        .catch((err) => {
          console.error('Solver init failed:', err);
          // Don't set error — solver can be lazily initialized on first solve
        });
    }
  }, [isInitialized]);

  const solve = useCallback(async (facelets: string): Promise<Solution> => {
    setIsSolving(true);
    setError(null);

    try {
      // Ensure solver is initialized
      if (!isSolverReady()) {
        await initSolver();
        setIsInitialized(true);
      }

      const result = await solveCube(facelets);
      setSolution(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Solving failed';
      setError(message);
      throw err;
    } finally {
      setIsSolving(false);
    }
  }, []);

  return {
    solve,
    isInitialized,
    isSolving,
    error,
    solution,
  };
}
