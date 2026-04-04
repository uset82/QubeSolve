/**
 * QubeSolve — Cube State Validation
 *
 * Validates that 54 scanned facelets form a physically legal Rubik's cube.
 */

import {
  type CubeColor,
  type Face,
  CUBE_COLORS,
  FACELETS_PER_FACE,
  FACE_CENTER_COLORS,
} from './constants';
import { cubeStateToString, getColorCounts, type CubeState } from './cubeState';

/** Validation error with user-friendly message */
export interface ValidationError {
  type: 'color_count' | 'center' | 'duplicate_piece' | 'orientation' | 'parity';
  message: string;
  face?: Face;
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

type FaceLetter = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

interface DecodedCubePieces {
  cp: number[];
  co: number[];
  ep: number[];
  eo: number[];
  invalidCornerPositions: number[];
  invalidEdgePositions: number[];
}

const CORNER_FACELETS: number[][] = [
  [8, 9, 20],
  [6, 18, 38],
  [0, 36, 47],
  [2, 45, 11],
  [29, 26, 15],
  [27, 44, 24],
  [33, 53, 42],
  [35, 17, 51],
];

const EDGE_FACELETS: number[][] = [
  [5, 10],
  [7, 19],
  [3, 37],
  [1, 46],
  [32, 16],
  [28, 25],
  [30, 43],
  [34, 52],
  [23, 12],
  [21, 41],
  [50, 39],
  [48, 14],
];

const CORNER_COLORS: FaceLetter[][] = [
  ['U', 'R', 'F'],
  ['U', 'F', 'L'],
  ['U', 'L', 'B'],
  ['U', 'B', 'R'],
  ['D', 'F', 'R'],
  ['D', 'L', 'F'],
  ['D', 'B', 'L'],
  ['D', 'R', 'B'],
];

const EDGE_COLORS: FaceLetter[][] = [
  ['U', 'R'],
  ['U', 'F'],
  ['U', 'L'],
  ['U', 'B'],
  ['D', 'R'],
  ['D', 'F'],
  ['D', 'L'],
  ['D', 'B'],
  ['F', 'R'],
  ['F', 'L'],
  ['B', 'L'],
  ['B', 'R'],
];

function permutationParity(values: number[]): number {
  let inversions = 0;

  for (let index = 0; index < values.length; index += 1) {
    for (let inner = index + 1; inner < values.length; inner += 1) {
      if (values[index] > values[inner]) {
        inversions += 1;
      }
    }
  }

  return inversions % 2;
}

function decodeCubePieces(facelets: string): DecodedCubePieces {
  const cp: number[] = [];
  const co: number[] = [];
  const ep: number[] = [];
  const eo: number[] = [];
  const invalidCornerPositions: number[] = [];
  const invalidEdgePositions: number[] = [];

  for (let position = 0; position < CORNER_FACELETS.length; position += 1) {
    let orientation = 0;

    while (orientation < 3) {
      const sticker = facelets[CORNER_FACELETS[position][orientation]];
      if (sticker === 'U' || sticker === 'D') {
        break;
      }

      orientation += 1;
    }

    if (orientation === 3) {
      invalidCornerPositions.push(position);
      continue;
    }

    const color1 = facelets[CORNER_FACELETS[position][(orientation + 1) % 3]] as FaceLetter;
    const color2 = facelets[CORNER_FACELETS[position][(orientation + 2) % 3]] as FaceLetter;
    const pieceIndex = CORNER_COLORS.findIndex(
      (pieceColors) => color1 === pieceColors[1] && color2 === pieceColors[2]
    );

    if (pieceIndex === -1) {
      invalidCornerPositions.push(position);
      continue;
    }

    cp.push(pieceIndex);
    co.push(orientation % 3);
  }

  for (let position = 0; position < EDGE_FACELETS.length; position += 1) {
    const [a, b] = EDGE_FACELETS[position];
    const stickerA = facelets[a] as FaceLetter;
    const stickerB = facelets[b] as FaceLetter;
    const directIndex = EDGE_COLORS.findIndex(
      (pieceColors) => stickerA === pieceColors[0] && stickerB === pieceColors[1]
    );

    if (directIndex !== -1) {
      ep.push(directIndex);
      eo.push(0);
      continue;
    }

    const flippedIndex = EDGE_COLORS.findIndex(
      (pieceColors) => stickerA === pieceColors[1] && stickerB === pieceColors[0]
    );

    if (flippedIndex === -1) {
      invalidEdgePositions.push(position);
      continue;
    }

    ep.push(flippedIndex);
    eo.push(1);
  }

  return {
    cp,
    co,
    ep,
    eo,
    invalidCornerPositions,
    invalidEdgePositions,
  };
}

/**
 * Validate a complete cube state.
 *
 * Checks:
 * 1. Exactly 9 of each color
 * 2. Center pieces match expected face assignments
 * 3. All 8 corners and 12 edges are legal and unique
 * 4. Corner/edge orientations are physically reachable
 * 5. Corner and edge permutation parity match
 *
 * @param state - The cube state to validate
 * @returns Validation result with any errors
 */
export function validateCubeState(state: CubeState): ValidationResult {
  const errors: ValidationError[] = [];

  const counts = getColorCounts(state);
  for (const color of CUBE_COLORS) {
    if (counts[color] !== FACELETS_PER_FACE) {
      const colorName = color.charAt(0).toUpperCase() + color.slice(1);
      errors.push({
        type: 'color_count',
        message: `Found ${counts[color]} ${colorName} stickers (expected 9). Check your scan!`,
      });
    }
  }

  const faces: Face[] = ['U', 'D', 'F', 'B', 'L', 'R'];
  for (const face of faces) {
    const centerColor = state[face][4];
    const expectedColor = FACE_CENTER_COLORS[face];
    if (centerColor !== expectedColor) {
      errors.push({
        type: 'center',
        message: `The center of the ${face} face should be ${expectedColor}, but found ${centerColor}. Try re-scanning this face.`,
        face,
      });
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  const facelets = cubeStateToString(state);
  const {
    cp,
    co,
    ep,
    eo,
    invalidCornerPositions,
    invalidEdgePositions,
  } = decodeCubePieces(facelets);

  if (invalidCornerPositions.length > 0) {
    errors.push({
      type: 'duplicate_piece',
      message: 'Found an impossible corner piece. One or more corner stickers do not form a legal 3-color combination.',
    });
  }

  if (invalidEdgePositions.length > 0) {
    errors.push({
      type: 'duplicate_piece',
      message: 'Found an impossible edge piece. One or more edge stickers do not form a legal 2-color combination.',
    });
  }

  if (new Set(cp).size !== 8) {
    errors.push({
      type: 'duplicate_piece',
      message: 'Corner pieces are duplicated or missing. Check that each corner was scanned and edited correctly.',
    });
  }

  if (new Set(ep).size !== 12) {
    errors.push({
      type: 'duplicate_piece',
      message: 'Edge pieces are duplicated or missing. Check that each edge was scanned and edited correctly.',
    });
  }

  if (errors.length === 0 && co.reduce((sum, value) => sum + value, 0) % 3 !== 0) {
    errors.push({
      type: 'orientation',
      message: 'A corner is twisted in a physically impossible way. Re-check the affected corner stickers.',
    });
  }

  if (errors.length === 0 && eo.reduce((sum, value) => sum + value, 0) % 2 !== 0) {
    errors.push({
      type: 'orientation',
      message: 'An edge is flipped in a physically impossible way. Re-check the affected edge stickers.',
    });
  }

  if (
    errors.length === 0 &&
    permutationParity(cp) !== permutationParity(ep)
  ) {
    errors.push({
      type: 'parity',
      message: 'The cube has a permutation parity mismatch. This usually means two pieces were swapped during scanning or manual entry.',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Quick validation — just checks color counts.
 * Used for real-time feedback during scanning.
 */
export function quickValidate(
  scannedColors: CubeColor[]
): { valid: boolean; message: string } {
  if (scannedColors.length !== 54) {
    return {
      valid: false,
      message: `Need all 6 faces scanned (have ${Math.floor(scannedColors.length / 9)} of 6)`,
    };
  }

  const counts: Record<string, number> = {};
  for (const color of scannedColors) {
    counts[color] = (counts[color] || 0) + 1;
  }

  for (const color of CUBE_COLORS) {
    const count = counts[color] || 0;
    if (count !== 9) {
      return {
        valid: false,
        message: `Found ${count} ${color} stickers (need exactly 9)`,
      };
    }
  }

  return { valid: true, message: 'All colors look good!' };
}
