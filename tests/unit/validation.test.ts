import { describe, expect, test } from 'vitest';

import { createSolvedCube } from '../../src/lib/cubeState';
import { validateCubeState } from '../../src/lib/validation';

describe('validation', () => {
  test('accepts a solved cube', () => {
    const result = validateCubeState(createSolvedCube());

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('rejects incorrect color counts', () => {
    const state = createSolvedCube();
    state.U[0] = 'yellow';

    const result = validateCubeState(state);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.type === 'color_count')).toBe(true);
  });

  test('rejects a flipped edge', () => {
    const state = createSolvedCube();
    [state.U[7], state.F[1]] = [state.F[1], state.U[7]];

    const result = validateCubeState(state);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.type === 'orientation')).toBe(true);
  });

  test('rejects a twisted corner', () => {
    const state = createSolvedCube();
    [state.U[8], state.R[0], state.F[2]] = [state.R[0], state.F[2], state.U[8]];

    const result = validateCubeState(state);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.type === 'orientation')).toBe(true);
  });

  test('rejects parity mismatch', () => {
    const state = createSolvedCube();
    [state.R[1], state.F[1]] = [state.F[1], state.R[1]];

    const result = validateCubeState(state);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.type === 'parity')).toBe(true);
  });
});
