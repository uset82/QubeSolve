/**
 * QubeSolve — Cube State Management
 *
 * Represents the full state of a 3×3×3 Rubik's cube as 54 facelets.
 * Provides conversion to/from Kociemba solver format and move application.
 */

import {
  type CubeColor,
  type Face,
  FACE_CENTER_COLORS,
  FACELETS_PER_FACE,
} from './constants';

/** Colors of a single face (9 facelets in row-major order) */
export type FaceColors = [
  CubeColor, CubeColor, CubeColor,
  CubeColor, CubeColor, CubeColor,
  CubeColor, CubeColor, CubeColor,
];

/** Complete cube state: 6 faces × 9 facelets each */
export interface CubeState {
  U: FaceColors;
  D: FaceColors;
  F: FaceColors;
  B: FaceColors;
  L: FaceColors;
  R: FaceColors;
}

/** Data from scanning a single face */
export interface ScannedFace {
  face: Face;
  colors: CubeColor[];
}

const SEQUENTIAL_SCAN_FACE_ROTATIONS_CW: Record<Face, number> = {
  F: 0,
  R: 0,
  B: 0,
  L: 0,
  U: 1,
  D: -1,
};

const UI_TO_CANONICAL_FACE_ROTATIONS_CW: Record<Face, number> = {
  U: 1,
  R: 1,
  F: 1,
  D: -1,
  L: 1,
  B: 1,
};

/** Map from CubeColor to Kociemba face letter */
const COLOR_TO_FACE: Record<CubeColor, string> = {
  white: 'U',
  yellow: 'D',
  green: 'F',
  blue: 'B',
  orange: 'L',
  red: 'R',
};

/**
 * Create a solved cube state.
 */
export function createSolvedCube(): CubeState {
  const makeFace = (color: CubeColor): FaceColors =>
    Array(FACELETS_PER_FACE).fill(color) as FaceColors;

  return {
    U: makeFace('white'),
    D: makeFace('yellow'),
    F: makeFace('green'),
    B: makeFace('blue'),
    L: makeFace('orange'),
    R: makeFace('red'),
  };
}

/**
 * Create a CubeState from scanned face data.
 *
 * @param scannedFaces - Array of 6 scanned faces (one per face)
 * @returns Complete CubeState
 * @throws If not all 6 faces are provided
 */
export function createCubeStateFromScans(
  scannedFaces: ScannedFace[]
): CubeState {
  if (scannedFaces.length !== 6) {
    throw new Error(`Expected 6 scanned faces, got ${scannedFaces.length}`);
  }

  const state = createSolvedCube();

  for (const scan of scannedFaces) {
    if (scan.colors.length !== FACELETS_PER_FACE) {
      throw new Error(
        `Face ${scan.face} has ${scan.colors.length} colors, expected ${FACELETS_PER_FACE}`
      );
    }
    state[scan.face] = scan.colors as FaceColors;
  }

  return state;
}

/**
 * Convert CubeState to Kociemba solver input string.
 *
 * The Kociemba string format uses 54 characters in URFDLB order.
 * Each character represents the face that color belongs to.
 *
 * @param state - Current cube state
 * @returns 54-character string for Kociemba solver
 */
export function cubeStateToString(state: CubeState): string {
  const order: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  let result = '';

  for (const face of order) {
    for (const color of state[face]) {
      result += COLOR_TO_FACE[color];
    }
  }

  return result;
}

/**
 * Check if a cube state represents a solved cube.
 */
export function isSolved(state: CubeState): boolean {
  const faces: Face[] = ['U', 'D', 'F', 'B', 'L', 'R'];
  return faces.every((face) => {
    const expectedColor = FACE_CENTER_COLORS[face];
    return state[face].every((color) => color === expectedColor);
  });
}

/**
 * Get the total count of each color in the cube state.
 */
export function getColorCounts(
  state: CubeState
): Record<CubeColor, number> {
  const counts: Record<CubeColor, number> = {
    white: 0,
    yellow: 0,
    red: 0,
    orange: 0,
    blue: 0,
    green: 0,
  };

  const faces: Face[] = ['U', 'D', 'F', 'B', 'L', 'R'];
  for (const face of faces) {
    for (const color of state[face]) {
      counts[color]++;
    }
  }

  return counts;
}

/**
 * Get all 54 facelets as a flat array.
 */
export function getFlatFacelets(state: CubeState): CubeColor[] {
  const order: Face[] = ['U', 'D', 'F', 'B', 'L', 'R'];
  const result: CubeColor[] = [];
  for (const face of order) {
    result.push(...state[face]);
  }
  return result;
}

export function rotateFaceColors<T>(
  face: ReadonlyArray<T>,
  quarterTurnsCW: number = 1
): T[] {
  if (face.length !== FACELETS_PER_FACE) {
    throw new Error(
      `Face has ${face.length} stickers, expected ${FACELETS_PER_FACE}`
    );
  }

  let rotated = [...face];
  const turns = ((quarterTurnsCW % 4) + 4) % 4;

  for (let turn = 0; turn < turns; turn += 1) {
    rotated = [
      rotated[6], rotated[3], rotated[0],
      rotated[7], rotated[4], rotated[1],
      rotated[8], rotated[5], rotated[2],
    ];
  }

  return rotated;
}

export function normalizeSequentialScanFaceColors(
  face: Face,
  colors: ReadonlyArray<CubeColor>
): CubeColor[] {
  return rotateFaceColors(colors, SEQUENTIAL_SCAN_FACE_ROTATIONS_CW[face]) as CubeColor[];
}

export function convertUiCubeStateToCanonical(state: CubeState): CubeState {
  return {
    U: rotateFaceColors(state.U, UI_TO_CANONICAL_FACE_ROTATIONS_CW.U) as FaceColors,
    D: rotateFaceColors(state.D, UI_TO_CANONICAL_FACE_ROTATIONS_CW.D) as FaceColors,
    F: rotateFaceColors(state.F, UI_TO_CANONICAL_FACE_ROTATIONS_CW.F) as FaceColors,
    B: rotateFaceColors(state.B, UI_TO_CANONICAL_FACE_ROTATIONS_CW.B) as FaceColors,
    L: rotateFaceColors(state.L, UI_TO_CANONICAL_FACE_ROTATIONS_CW.L) as FaceColors,
    R: rotateFaceColors(state.R, UI_TO_CANONICAL_FACE_ROTATIONS_CW.R) as FaceColors,
  };
}

export function convertCanonicalCubeStateToUi(state: CubeState): CubeState {
  return {
    U: rotateFaceColors(state.U, -UI_TO_CANONICAL_FACE_ROTATIONS_CW.U) as FaceColors,
    D: rotateFaceColors(state.D, -UI_TO_CANONICAL_FACE_ROTATIONS_CW.D) as FaceColors,
    F: rotateFaceColors(state.F, -UI_TO_CANONICAL_FACE_ROTATIONS_CW.F) as FaceColors,
    B: rotateFaceColors(state.B, -UI_TO_CANONICAL_FACE_ROTATIONS_CW.B) as FaceColors,
    L: rotateFaceColors(state.L, -UI_TO_CANONICAL_FACE_ROTATIONS_CW.L) as FaceColors,
    R: rotateFaceColors(state.R, -UI_TO_CANONICAL_FACE_ROTATIONS_CW.R) as FaceColors,
  };
}

/**
 * Rotate a face array 90° clockwise.
 * Indices: 0 1 2 / 3 4 5 / 6 7 8 → 6 3 0 / 7 4 1 / 8 5 2
 */
function rotateFaceCW(face: FaceColors): FaceColors {
  return rotateFaceColors(face) as FaceColors;
}

/**
 * Deep clone a cube state.
 */
export function cloneCubeState(state: CubeState): CubeState {
  return {
    U: [...state.U] as FaceColors,
    D: [...state.D] as FaceColors,
    F: [...state.F] as FaceColors,
    B: [...state.B] as FaceColors,
    L: [...state.L] as FaceColors,
    R: [...state.R] as FaceColors,
  };
}

/**
 * Apply a single move notation to a cube state.
 * Returns a new state (does not mutate the input).
 *
 * @param state - Current cube state
 * @param move - Move notation (e.g., "R", "U'", "F2")
 * @returns New cube state after the move
 */
export function applyMove(state: CubeState, move: string): CubeState {
  const s = cloneCubeState(state);
  const face = move[0] as Face;
  const isPrime = move.includes("'");
  const isDouble = move.includes('2');

  if (isDouble) {
    return applyMove(applyMove(s, face), face);
  }

  if (isPrime) {
    // Apply 3 clockwise = 1 counter-clockwise
    return applyMove(applyMove(applyMove(s, face), face), face);
  }

  // Apply single CW rotation
  switch (face) {
    case 'R': {
      s.R = rotateFaceCW(s.R);
      const temp = [s.F[2], s.F[5], s.F[8]];
      [s.F[2], s.F[5], s.F[8]] = [s.D[2], s.D[5], s.D[8]];
      [s.D[2], s.D[5], s.D[8]] = [s.B[6], s.B[3], s.B[0]];
      [s.B[6], s.B[3], s.B[0]] = [s.U[2], s.U[5], s.U[8]];
      [s.U[2], s.U[5], s.U[8]] = temp;
      break;
    }
    case 'L': {
      s.L = rotateFaceCW(s.L);
      const temp = [s.F[0], s.F[3], s.F[6]];
      [s.F[0], s.F[3], s.F[6]] = [s.U[0], s.U[3], s.U[6]];
      [s.U[0], s.U[3], s.U[6]] = [s.B[8], s.B[5], s.B[2]];
      [s.B[8], s.B[5], s.B[2]] = [s.D[0], s.D[3], s.D[6]];
      [s.D[0], s.D[3], s.D[6]] = temp;
      break;
    }
    case 'U': {
      s.U = rotateFaceCW(s.U);
      const temp = [s.F[0], s.F[1], s.F[2]];
      [s.F[0], s.F[1], s.F[2]] = [s.R[0], s.R[1], s.R[2]];
      [s.R[0], s.R[1], s.R[2]] = [s.B[0], s.B[1], s.B[2]];
      [s.B[0], s.B[1], s.B[2]] = [s.L[0], s.L[1], s.L[2]];
      [s.L[0], s.L[1], s.L[2]] = temp;
      break;
    }
    case 'D': {
      s.D = rotateFaceCW(s.D);
      const temp = [s.F[6], s.F[7], s.F[8]];
      [s.F[6], s.F[7], s.F[8]] = [s.L[6], s.L[7], s.L[8]];
      [s.L[6], s.L[7], s.L[8]] = [s.B[6], s.B[7], s.B[8]];
      [s.B[6], s.B[7], s.B[8]] = [s.R[6], s.R[7], s.R[8]];
      [s.R[6], s.R[7], s.R[8]] = temp;
      break;
    }
    case 'F': {
      s.F = rotateFaceCW(s.F);
      const temp = [s.U[6], s.U[7], s.U[8]];
      [s.U[6], s.U[7], s.U[8]] = [s.L[8], s.L[5], s.L[2]];
      [s.L[2], s.L[5], s.L[8]] = [s.D[0], s.D[1], s.D[2]];
      [s.D[0], s.D[1], s.D[2]] = [s.R[6], s.R[3], s.R[0]];
      [s.R[0], s.R[3], s.R[6]] = temp;
      break;
    }
    case 'B': {
      s.B = rotateFaceCW(s.B);
      const temp = [s.U[0], s.U[1], s.U[2]];
      [s.U[0], s.U[1], s.U[2]] = [s.R[2], s.R[5], s.R[8]];
      [s.R[2], s.R[5], s.R[8]] = [s.D[8], s.D[7], s.D[6]];
      [s.D[6], s.D[7], s.D[8]] = [s.L[0], s.L[3], s.L[6]];
      [s.L[0], s.L[3], s.L[6]] = temp;
      break;
    }
  }

  return s;
}
