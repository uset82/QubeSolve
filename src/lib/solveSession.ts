import type { CubeState } from "@/lib/cubeState";
import type { Solution } from "@/lib/solver";

const SOLVE_SESSION_KEY = "qubesolve-solve-session";

export interface SolveSession {
  cubeState: CubeState;
  facelets: string;
  solution: Solution;
  createdAt: string;
}

export function loadSolveSession(): SolveSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(SOLVE_SESSION_KEY);
    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as SolveSession;
  } catch {
    return null;
  }
}

export function saveSolveSession(session: SolveSession): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SOLVE_SESSION_KEY, JSON.stringify(session));
}

export function clearSolveSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SOLVE_SESSION_KEY);
}
