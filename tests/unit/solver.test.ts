import { beforeAll, describe, expect, test } from 'vitest';

import {
  applyMove,
  createSolvedCube,
  cubeStateToString,
  isSolved,
} from '../../src/lib/cubeState';
import { initSolver, solveCube } from '../../src/lib/solver';

describe('solver', () => {
  beforeAll(async () => {
    await initSolver();
  }, 20000);

  test('returns an empty solution for a solved cube', async () => {
    const result = await solveCube(cubeStateToString(createSolvedCube()));

    expect(result.moves).toEqual([]);
    expect(result.totalSteps).toBe(0);
  }, 20000);

  test('solves a simple scramble', async () => {
    let scrambled = createSolvedCube();
    for (const move of ['R', 'U', "R'", "U'", 'F2']) {
      scrambled = applyMove(scrambled, move);
    }

    const solution = await solveCube(cubeStateToString(scrambled));

    let replay = scrambled;
    for (const move of solution.moves) {
      replay = applyMove(replay, move);
    }

    expect(solution.totalSteps).toBeGreaterThan(0);
    expect(isSolved(replay)).toBe(true);
  }, 20000);
});
