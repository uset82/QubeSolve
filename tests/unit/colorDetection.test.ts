import { describe, expect, test } from 'vitest';

import {
  calculateGridPositions,
  classifyColor,
  rgbToHsv,
} from '../../src/lib/colorDetection';

describe('colorDetection', () => {
  test('converts RGB to HSV', () => {
    expect(rgbToHsv(255, 0, 0)).toMatchObject({ h: 0, s: 100, v: 100 });
    expect(rgbToHsv(0, 255, 0)).toMatchObject({ h: 120, s: 100, v: 100 });
  });

  test('classifies common cube colors', () => {
    expect(classifyColor(rgbToHsv(255, 255, 255)).color).toBe('white');
    expect(classifyColor(rgbToHsv(255, 220, 0)).color).toBe('yellow');
    expect(classifyColor(rgbToHsv(0, 90, 255)).color).toBe('blue');
    expect(classifyColor(rgbToHsv(255, 0, 0)).color).toBe('red');
  });

  test('calculates 3x3 grid positions', () => {
    const cells = calculateGridPositions(300, 300);

    expect(cells).toHaveLength(9);
    expect(cells[0].x).toBeLessThan(cells[1].x);
    expect(cells[0].y).toBe(cells[1].y);
    expect(cells[3].y).toBeGreaterThan(cells[0].y);
  });
});
