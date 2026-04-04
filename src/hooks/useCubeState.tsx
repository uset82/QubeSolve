'use client';

/**
 * QubeSolve — useCubeState Hook
 *
 * Global state management for the cube scanning and solving flow.
 * Uses React Context to share state across pages.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { CubeColor, Face } from '@/lib/constants';
import {
  type CubeState,
  type ScannedFace,
  createCubeStateFromScans,
} from '@/lib/cubeState';
import type { Solution } from '@/lib/solver';
import type { MoveData } from '@/lib/moveParser';

/** Full app state for the solving flow */
interface CubeStateContextValue {
  /** Scanned faces accumulated during scanning */
  scannedFaces: ScannedFace[];
  /** Complete cube state (built from scans) */
  cubeState: CubeState | null;
  /** Computed solution */
  solution: Solution | null;
  /** Parsed solution moves */
  parsedMoves: MoveData[];
  /** Current step in the solution (0-indexed) */
  currentStep: number;
  /** Add a scanned face */
  addScannedFace: (face: Face, colors: CubeColor[]) => void;
  /** Replace a scanned face (re-scan) */
  replaceScannedFace: (face: Face, colors: CubeColor[]) => void;
  /** Build cube state from scanned faces */
  buildCubeState: () => CubeState;
  /** Set the cube state directly (e.g., from manual entry) */
  setCubeState: (state: CubeState) => void;
  /** Set the computed solution */
  setSolution: (solution: Solution) => void;
  /** Set parsed moves */
  setParsedMoves: (moves: MoveData[]) => void;
  /** Go to next step */
  nextStep: () => void;
  /** Go to previous step */
  prevStep: () => void;
  /** Jump to a specific step */
  goToStep: (step: number) => void;
  /** Reset all state */
  reset: () => void;
}

const CubeStateContext = createContext<CubeStateContextValue | null>(null);

/** Provider component */
export function CubeStateProvider({ children }: { children: ReactNode }) {
  const [scannedFaces, setScannedFaces] = useState<ScannedFace[]>([]);
  const [cubeState, setCubeStateInternal] = useState<CubeState | null>(null);
  const [solution, setSolutionInternal] = useState<Solution | null>(null);
  const [parsedMoves, setParsedMovesInternal] = useState<MoveData[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const addScannedFace = useCallback((face: Face, colors: CubeColor[]) => {
    setScannedFaces((prev) => [...prev.filter((f) => f.face !== face), { face, colors }]);
  }, []);

  const replaceScannedFace = useCallback((face: Face, colors: CubeColor[]) => {
    setScannedFaces((prev) =>
      prev.map((f) => (f.face === face ? { face, colors } : f))
    );
  }, []);

  const buildCubeState = useCallback((): CubeState => {
    if (scannedFaces.length !== 6) {
      throw new Error(`Need 6 faces, have ${scannedFaces.length}`);
    }
    const state = createCubeStateFromScans(scannedFaces);
    setCubeStateInternal(state);
    return state;
  }, [scannedFaces]);

  const setCubeState = useCallback((state: CubeState) => {
    setCubeStateInternal(state);
  }, []);

  const setSolution = useCallback((sol: Solution) => {
    setSolutionInternal(sol);
    setCurrentStep(0);
  }, []);

  const setParsedMoves = useCallback((moves: MoveData[]) => {
    setParsedMovesInternal(moves);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, parsedMoves.length));
  }, [parsedMoves.length]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, parsedMoves.length)));
  }, [parsedMoves.length]);

  const reset = useCallback(() => {
    setScannedFaces([]);
    setCubeStateInternal(null);
    setSolutionInternal(null);
    setParsedMovesInternal([]);
    setCurrentStep(0);
  }, []);

  return (
    <CubeStateContext.Provider
      value={{
        scannedFaces,
        cubeState,
        solution,
        parsedMoves,
        currentStep,
        addScannedFace,
        replaceScannedFace,
        buildCubeState,
        setCubeState,
        setSolution,
        setParsedMoves,
        nextStep,
        prevStep,
        goToStep,
        reset,
      }}
    >
      {children}
    </CubeStateContext.Provider>
  );
}

/** Hook to access cube state */
export function useCubeState(): CubeStateContextValue {
  const context = useContext(CubeStateContext);
  if (!context) {
    throw new Error('useCubeState must be used within a CubeStateProvider');
  }
  return context;
}
