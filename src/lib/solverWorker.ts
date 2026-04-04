/// <reference lib="webworker" />

import type { SolverWorkerRequest, SolverWorkerResponse } from './solverWorker.types';

interface CubeJsInstance {
  solve(): string;
}

interface CubeJsApi {
  initSolver?: () => void;
  fromString: (facelets: string) => CubeJsInstance;
}

const workerScope = self as DedicatedWorkerGlobalScope;

let cubeModulePromise: Promise<CubeJsApi> | null = null;
let initialized = false;

async function getCubeModule(): Promise<CubeJsApi> {
  if (!cubeModulePromise) {
    cubeModulePromise = import('cubejs').then((module) => {
      const cubeApi = (module.default ?? module) as CubeJsApi;
      return cubeApi;
    });
  }

  return cubeModulePromise;
}

async function initializeSolver(): Promise<void> {
  if (initialized) {
    return;
  }

  const cubeApi = await getCubeModule();
  cubeApi.initSolver?.();
  initialized = true;
}

workerScope.onmessage = async (event: MessageEvent<SolverWorkerRequest>) => {
  const request = event.data;

  try {
    if (request.type === 'init') {
      await initializeSolver();

      workerScope.postMessage({
        id: request.id,
        type: 'init',
        success: true,
      } satisfies SolverWorkerResponse);

      return;
    }

    await initializeSolver();

    const cubeApi = await getCubeModule();
    const startTime = performance.now();
    const raw = cubeApi.fromString(request.facelets).solve().trim();

    workerScope.postMessage({
      id: request.id,
      type: 'solve',
      success: true,
      raw,
      computeTimeMs: Math.round(performance.now() - startTime),
    } satisfies SolverWorkerResponse);
  } catch (error) {
    workerScope.postMessage({
      id: request.id,
      type: request.type,
      success: false,
      error: error instanceof Error ? error.message : 'Worker solver failed',
    } satisfies SolverWorkerResponse);
  }
};

export {};
