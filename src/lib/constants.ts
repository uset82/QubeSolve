/**
 * QubeSolve — Constants
 *
 * Central source of truth for cube colors, HSV thresholds,
 * face scanning order, and move notation mappings.
 */

/** The 6 standard Rubik's cube colors */
export type CubeColor = 'white' | 'yellow' | 'red' | 'orange' | 'blue' | 'green';

/** The 6 faces of a Rubik's cube */
export type Face = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';

/** Move direction */
export type MoveDirection = 'CW' | 'CCW' | '180';

/** Rotation axis */
export type RotationAxis = 'x' | 'y' | 'z';

/** All possible cube colors */
export const CUBE_COLORS: CubeColor[] = [
  'white', 'yellow', 'red', 'orange', 'blue', 'green',
];

/** Map cube colors to CSS custom property values */
export const COLOR_CSS_MAP: Record<CubeColor, string> = {
  white: 'var(--cube-white)',
  yellow: 'var(--cube-yellow)',
  red: 'var(--cube-red)',
  orange: 'var(--cube-orange)',
  blue: 'var(--cube-blue)',
  green: 'var(--cube-green)',
};

/** Map cube colors to hex values (for Three.js materials) */
export const COLOR_HEX_MAP: Record<CubeColor, string> = {
  white: '#F0F0F0',
  yellow: '#FFD93D',
  red: '#FF4444',
  orange: '#FF8C00',
  blue: '#4488FF',
  green: '#44CC44',
};

/** Standard center colors for each face */
export const FACE_CENTER_COLORS: Record<Face, CubeColor> = {
  U: 'white',
  D: 'yellow',
  F: 'green',
  B: 'blue',
  L: 'orange',
  R: 'red',
};

export const CENTER_COLOR_TO_FACE: Record<CubeColor, Face> = {
  white: 'U',
  yellow: 'D',
  green: 'F',
  blue: 'B',
  orange: 'L',
  red: 'R',
};

/** Human-readable face names */
export const FACE_NAMES: Record<Face, string> = {
  U: 'Top (White)',
  D: 'Bottom (Yellow)',
  F: 'Front (Green)',
  B: 'Back (Blue)',
  L: 'Left (Orange)',
  R: 'Right (Red)',
};

/**
 * Scanning order as defined in QBR.
 * User scans in this order for correct state mapping.
 */
export const SCAN_ORDER: Face[] = ['F', 'R', 'B', 'L', 'U', 'D'];

/** Instructions for rotating the cube between scans */
export const SCAN_INSTRUCTIONS: Record<Face, string> = {
  F: 'Hold the cube with the green center facing you and white on top.',
  R: 'Rotate the cube 90° to the right.',
  B: 'Rotate the cube 90° to the right again.',
  L: 'Rotate the cube 90° to the right one more time.',
  U: 'Tilt the cube forward so the white center faces you.',
  D: 'Tilt the cube backward so the yellow center faces you.',
};

/**
 * Default HSV thresholds for color classification.
 * Ported from QBR's calibration ranges.
 *
 * H: 0-360 (hue angle)
 * S: 0-100 (saturation percentage)
 * V: 0-100 (value/brightness percentage)
 */
export interface HSVThreshold {
  hMin: number;
  hMax: number;
  sMin: number;
  sMax: number;
  vMin: number;
  vMax: number;
}

export const DEFAULT_HSV_THRESHOLDS: Record<CubeColor, HSVThreshold> = {
  white: {
    hMin: 0, hMax: 360,
    sMin: 0, sMax: 40,
    vMin: 70, vMax: 100,
  },
  yellow: {
    hMin: 40, hMax: 80,
    sMin: 40, sMax: 100,
    vMin: 50, vMax: 100,
  },
  red: {
    hMin: 340, hMax: 20, // wraps around 0
    sMin: 40, sMax: 100,
    vMin: 30, vMax: 100,
  },
  orange: {
    hMin: 10, hMax: 40,
    sMin: 50, sMax: 100,
    vMin: 40, vMax: 100,
  },
  blue: {
    hMin: 170, hMax: 260,
    sMin: 30, sMax: 100,
    vMin: 25, vMax: 100,
  },
  green: {
    hMin: 80, hMax: 170,
    sMin: 30, sMax: 100,
    vMin: 25, vMax: 100,
  },
};

/**
 * Move notation to plain-English label mapping.
 * Covers all 18 standard moves.
 */
export const MOVE_LABELS: Record<string, string> = {
  'R':  'Turn the right face clockwise',
  "R'": 'Turn the right face counter-clockwise',
  'R2': 'Turn the right face twice',
  'L':  'Turn the left face clockwise',
  "L'": 'Turn the left face counter-clockwise',
  'L2': 'Turn the left face twice',
  'U':  'Turn the top clockwise',
  "U'": 'Turn the top counter-clockwise',
  'U2': 'Turn the top twice',
  'D':  'Turn the bottom clockwise',
  "D'": 'Turn the bottom counter-clockwise',
  'D2': 'Turn the bottom twice',
  'F':  'Turn the front face clockwise',
  "F'": 'Turn the front face counter-clockwise',
  'F2': 'Turn the front face twice',
  'B':  'Turn the back face clockwise',
  "B'": 'Turn the back face counter-clockwise',
  'B2': 'Turn the back face twice',
};

/** Number of facelets per face */
export const FACELETS_PER_FACE = 9;

/** Total facelets on a cube */
export const TOTAL_FACELETS = 54;

/** Maximum solution length (God's number) */
export const MAX_SOLUTION_LENGTH = 20;

/** Default animation duration for moves in ms */
export const MOVE_ANIMATION_DURATION = 500;

/** Camera frame processing interval in ms */
export const CAMERA_PROCESS_INTERVAL = 100;

/** Color detection sample region size in pixels */
export const SAMPLE_REGION_SIZE = 20;
