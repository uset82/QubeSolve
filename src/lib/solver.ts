/**
 * QubeSolve — Kociemba Solver Wrapper
 *
 * Wraps the cubejs library to compute optimal solutions.
 * Uses a Web Worker in the browser so the UI thread stays responsive.
 */

import type {
  SolverWorkerRequest,
  SolverWorkerResponse,
} from './solverWorker.types';

/** Solution result from the solver */
export interface Solution {
  /** Array of move notations (e.g., ["R", "U'", "F2"]) */
  moves: string[];
  /** Total number of steps */
  totalSteps: number;
  /** Computation time in milliseconds */
  computeTimeMs: number;
  /** The original solution string */
  raw: string;
}

/** Solver status */
export type SolverStatus = 'idle' | 'initializing' | 'ready' | 'solving' | 'error';

interface CubeJsInstance {
  solve(): string;
}

interface CubeJsApi {
  initSolver?: () => void;
  fromString: (facelets: string) => CubeJsInstance;
}

interface PendingRequest {
  resolve: (value: SolverWorkerResponse) => void;
  reject: (reason?: unknown) => void;
}

const SOLVED_FACELETS = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

let solverInitialized = false;
let cubeModulePromise: Promise<CubeJsApi> | null = null;
let worker: Worker | null = null;
let workerInitPromise: Promise<void> | null = null;
let requestCounter = 0;
const pendingRequests = new Map<number, PendingRequest>();

function canUseWorker(): boolean {
  return typeof window !== 'undefined' && typeof Worker !== 'undefined';
}

async function getCubeModule(): Promise<CubeJsApi> {
  if (!cubeModulePromise) {
    cubeModulePromise = import('cubejs').then((module) => {
      return (module.default ?? module) as CubeJsApi;
    });
  }

  return cubeModulePromise;
}

function parseSolution(raw: string, computeTimeMs: number): Solution {
  const moves = raw
    .trim()
    .split(/\s+/)
    .filter((move) => move.length > 0);

  return {
    moves,
    totalSteps: moves.length,
    computeTimeMs,
    raw,
  };
}

function resetWorkerState(errorMessage: string): void {
  worker?.terminate();
  worker = null;
  workerInitPromise = null;
  solverInitialized = false;

  for (const pendingRequest of pendingRequests.values()) {
    pendingRequest.reject(new Error(errorMessage));
  }

  pendingRequests.clear();
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./solverWorker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (event: MessageEvent<SolverWorkerResponse>) => {
      const response = event.data;
      const pendingRequest = pendingRequests.get(response.id);

      if (!pendingRequest) {
        return;
      }

      pendingRequests.delete(response.id);

      if (response.success) {
        if (response.type === 'init') {
          solverInitialized = true;
        }

        pendingRequest.resolve(response);
        return;
      }

      pendingRequest.reject(
        new Error(response.error || 'Worker solver failed unexpectedly.')
      );
    };

    worker.onerror = () => {
      resetWorkerState('The solving worker crashed. Please reload the app.');
    };
  }

  return worker;
}

function sendWorkerRequest(
  request: SolverWorkerRequest
): Promise<SolverWorkerResponse> {
  return new Promise((resolve, reject) => {
    pendingRequests.set(request.id, { resolve, reject });
    getWorker().postMessage(request);
  });
}

async function initSolverDirect(): Promise<void> {
  if (solverInitialized) {
    return;
  }

  try {
    const cubeApi = await getCubeModule();
    cubeApi.initSolver?.();
    solverInitialized = true;
  } catch (error) {
    console.error('Failed to initialize solver:', error);
    throw new Error('Could not initialize the solving engine. Please reload the app.');
  }
}

async function solveDirect(facelets: string): Promise<Solution> {
  const cubeApi = await getCubeModule();
  const startTime = performance.now();
  const raw = cubeApi.fromString(facelets).solve().trim();
  return parseSolution(raw, Math.round(performance.now() - startTime));
}

/**
 * Initialize the Kociemba solver.
 * Must be called before solveCube().
 */
export async function initSolver(): Promise<void> {
  if (solverInitialized) {
    return;
  }

  if (!canUseWorker()) {
    await initSolverDirect();
    return;
  }

  if (!workerInitPromise) {
    requestCounter += 1;

    workerInitPromise = sendWorkerRequest({
      id: requestCounter,
      type: 'init',
    }).then(() => {
      solverInitialized = true;
    }).catch((error) => {
      workerInitPromise = null;
      throw error;
    });
  }

  await workerInitPromise;
}

/**
 * Solve a Rubik's cube given its facelet string.
 *
 * @param facelets - 54-character string in URFDLB order
 * @returns Solution with moves array and timing info
 */
export async function solveCube(facelets: string): Promise<Solution> {
  if (facelets.length !== 54) {
    throw new Error(`Invalid facelet string length: ${facelets.length} (expected 54)`);
  }

  if (facelets === SOLVED_FACELETS) {
    return {
      moves: [],
      totalSteps: 0,
      computeTimeMs: 0,
      raw: '',
    };
  }

  await initSolver();

  try {
    if (!canUseWorker()) {
      return await solveDirect(facelets);
    }

    requestCounter += 1;
    const response = await sendWorkerRequest({
      id: requestCounter,
      type: 'solve',
      facelets,
    });

    if (response.type !== 'solve' || !response.raw) {
      throw new Error('Worker returned an invalid solve response.');
    }

    return parseSolution(response.raw, response.computeTimeMs ?? 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown solver error';
    throw new Error(`Could not solve this cube: ${message}. Check that all colors are scanned correctly.`);
  }
}

/**
 * Check if the solver is ready.
 */
export function isSolverReady(): boolean {
  return solverInitialized;
}
