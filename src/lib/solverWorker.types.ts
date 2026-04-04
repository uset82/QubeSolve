export interface SolverInitRequest {
  id: number;
  type: 'init';
}

export interface SolverSolveRequest {
  id: number;
  type: 'solve';
  facelets: string;
}

export type SolverWorkerRequest = SolverInitRequest | SolverSolveRequest;

export interface SolverInitResponse {
  id: number;
  type: 'init';
  success: boolean;
  error?: string;
}

export interface SolverSolveResponse {
  id: number;
  type: 'solve';
  success: boolean;
  raw?: string;
  computeTimeMs?: number;
  error?: string;
}

export type SolverWorkerResponse = SolverInitResponse | SolverSolveResponse;
