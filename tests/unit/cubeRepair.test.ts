import { describe, expect, test } from 'vitest';

import { createSolvedCube } from '../../src/lib/cubeState';
import { attemptRepairCubeState } from '../../src/lib/cubeRepair';
import { validateCubeState } from '../../src/lib/validation';

describe('cubeRepair', () => {
  test('repairs a likely scan mix-up by permuting suspect stickers', () => {
    const brokenState = createSolvedCube();
    [brokenState.U[8], brokenState.R[1]] = [brokenState.R[1], brokenState.U[8]];

    const before = validateCubeState(brokenState);
    expect(before.valid).toBe(false);
    expect(before.suspectFacelets.length).toBeGreaterThan(0);

    const repaired = attemptRepairCubeState(brokenState);

    expect(repaired).not.toBeNull();
    expect(repaired?.changedFacelets).toHaveLength(2);
    expect(validateCubeState(repaired!.cubeState).valid).toBe(true);
    expect(repaired!.cubeState).toEqual(createSolvedCube());
  });
});
