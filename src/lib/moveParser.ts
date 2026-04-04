/**
 * QubeSolve — Move Parser
 *
 * Parses Rubik's cube move notation strings into structured animation data.
 */

import {
  type Face,
  type MoveDirection,
  type RotationAxis,
  MOVE_LABELS,
} from './constants';

/** Fully parsed move data for animation and display */
export interface MoveData {
  /** Original notation string (e.g., "R'") */
  notation: string;
  /** Which face */
  face: Face;
  /** Direction: clockwise, counter-clockwise, or 180° */
  direction: MoveDirection;
  /** Rotation axis in 3D space */
  axis: RotationAxis;
  /** Rotation angle in radians */
  angle: number;
  /** Layer indices to rotate (which cubies) */
  layerIndex: number;
  /** Plain-English description */
  label: string;
  /** Step number in the solution (1-indexed) */
  stepNumber: number;
}

/** Axis mapping for each face */
const FACE_AXIS_MAP: Record<Face, RotationAxis> = {
  R: 'x',
  L: 'x',
  U: 'y',
  D: 'y',
  F: 'z',
  B: 'z',
};

/** Layer index for each face (0 = negative end, 1 = middle, 2 = positive end) */
const FACE_LAYER_MAP: Record<Face, number> = {
  R: 2,
  L: 0,
  U: 2,
  D: 0,
  F: 2,
  B: 0,
};

/**
 * Direction sign for each face.
 * Positive = standard CW looking at the face.
 * Some faces rotate in the negative direction for a "CW" move from the standard view.
 */
const FACE_DIRECTION_SIGN: Record<Face, number> = {
  R: -1,
  L: 1,
  U: -1,
  D: 1,
  F: -1,
  B: 1,
};

/**
 * Parse a single move notation string into structured MoveData.
 *
 * @param notation - Move notation (e.g., "R", "U'", "F2")
 * @param stepNumber - Step number in the solution sequence
 * @returns Parsed MoveData object
 * @throws If the notation is invalid
 */
export function parseMove(notation: string, stepNumber: number = 1): MoveData {
  const trimmed = notation.trim();
  if (!trimmed) {
    throw new Error('Empty move notation');
  }

  const face = trimmed[0].toUpperCase() as Face;
  const validFaces: Face[] = ['U', 'D', 'F', 'B', 'L', 'R'];

  if (!validFaces.includes(face)) {
    throw new Error(`Invalid face in notation: "${trimmed}"`);
  }

  const isPrime = trimmed.includes("'");
  const isDouble = trimmed.includes('2');

  let direction: MoveDirection;
  if (isDouble) {
    direction = '180';
  } else if (isPrime) {
    direction = 'CCW';
  } else {
    direction = 'CW';
  }

  const axis = FACE_AXIS_MAP[face];
  const sign = FACE_DIRECTION_SIGN[face];

  let angle: number;
  switch (direction) {
    case 'CW':
      angle = sign * (Math.PI / 2);
      break;
    case 'CCW':
      angle = -sign * (Math.PI / 2);
      break;
    case '180':
      angle = Math.PI;
      break;
  }

  const label = MOVE_LABELS[trimmed] || `Perform move: ${trimmed}`;

  return {
    notation: trimmed,
    face,
    direction,
    axis,
    angle,
    layerIndex: FACE_LAYER_MAP[face],
    label,
    stepNumber,
  };
}

/**
 * Parse a full solution string into an array of MoveData.
 *
 * @param solutionString - Space-separated move notation (e.g., "R U' F2 D")
 * @returns Array of parsed MoveData objects
 */
export function parseSolution(solutionString: string): MoveData[] {
  if (!solutionString.trim()) return [];

  return solutionString
    .trim()
    .split(/\s+/)
    .map((notation, index) => parseMove(notation, index + 1));
}

/**
 * Get the inverse of a move notation.
 * Used for "Previous" step functionality.
 *
 * @param notation - Original move notation
 * @returns Inverse move notation
 */
export function getInverseNotation(notation: string): string {
  const trimmed = notation.trim();
  if (trimmed.includes('2')) return trimmed; // 180° is its own inverse
  if (trimmed.includes("'")) return trimmed.replace("'", ''); // CCW → CW
  return trimmed + "'"; // CW → CCW
}
