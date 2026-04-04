import { describe, expect, test } from 'vitest';

import {
  getInverseNotation,
  parseMove,
  parseSolution,
} from '../../src/lib/moveParser';

describe('moveParser', () => {
  test('parses a clockwise quarter turn', () => {
    const move = parseMove('R', 2);

    expect(move.face).toBe('R');
    expect(move.direction).toBe('CW');
    expect(move.axis).toBe('x');
    expect(move.stepNumber).toBe(2);
  });

  test('parses prime and double turns', () => {
    expect(parseMove("U'").direction).toBe('CCW');
    expect(parseMove('F2').direction).toBe('180');
  });

  test('parses a solution string and inverse notation', () => {
    const moves = parseSolution("R U' F2");

    expect(moves).toHaveLength(3);
    expect(moves[1].notation).toBe("U'");
    expect(getInverseNotation("U'")).toBe('U');
    expect(getInverseNotation('F2')).toBe('F2');
  });
});
