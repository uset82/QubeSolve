import { describe, expect, test } from 'vitest';

import {
  applyMove,
  createCubeStateFromScans,
  createSolvedCube,
  cubeStateToString,
  isSolved,
} from '../../src/lib/cubeState';

describe('cubeState', () => {
  test('creates the solved facelet string', () => {
    expect(cubeStateToString(createSolvedCube())).toBe(
      'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB'
    );
  });

  test('creates a state from scanned faces', () => {
    const solved = createSolvedCube();
    const state = createCubeStateFromScans([
      { face: 'U', colors: [...solved.U] },
      { face: 'D', colors: [...solved.D] },
      { face: 'F', colors: [...solved.F] },
      { face: 'B', colors: [...solved.B] },
      { face: 'L', colors: [...solved.L] },
      { face: 'R', colors: [...solved.R] },
    ]);

    expect(state).toEqual(solved);
  });

  test('applies a move and its inverse back to solved', () => {
    const moved = applyMove(createSolvedCube(), 'R');
    const restored = applyMove(moved, "R'");

    expect(isSolved(moved)).toBe(false);
    expect(isSolved(restored)).toBe(true);
  });

  test('double turns behave consistently', () => {
    const state = applyMove(applyMove(createSolvedCube(), 'F2'), 'F2');
    expect(isSolved(state)).toBe(true);
  });
});
