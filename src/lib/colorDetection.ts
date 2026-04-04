/**
 * QubeSolve — Color Detection Engine
 *
 * Ported from QBR (kkoomen/qbr, MIT license) Python/OpenCV approach.
 * Adapted to TypeScript + Canvas API for browser-based processing.
 */

import {
  CUBE_COLORS,
  type CubeColor,
  DEFAULT_HSV_THRESHOLDS,
  type HSVThreshold,
  SAMPLE_REGION_SIZE,
} from './constants';

/** HSV color value */
export interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

/** RGB color value */
export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/** Detection result for a single cell */
export interface ColorDetectionResult {
  color: CubeColor | 'unknown';
  confidence: number; // 0-1
  hsv: HSV;
  rgb: RGB;
}

/** Grid cell position on the camera frame */
export interface GridCell {
  x: number;
  y: number;
  size: number;
}

export interface CalibrationSample {
  hsv: HSV;
  rgb: RGB;
}

export type CalibrationSamples = Partial<Record<CubeColor, HSV[]>>;

/**
 * Convert RGB to HSV color space.
 *
 * @param r - Red channel (0-255)
 * @param g - Green channel (0-255)
 * @param b - Blue channel (0-255)
 * @returns HSV values with H in [0-360], S in [0-100], V in [0-100]
 */
export function rgbToHsv(r: number, g: number, b: number): HSV {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const v = max * 100;

  if (delta !== 0) {
    s = (delta / max) * 100;

    if (max === rNorm) {
      h = 60 * (((gNorm - bNorm) / delta) % 6);
    } else if (max === gNorm) {
      h = 60 * ((bNorm - rNorm) / delta + 2);
    } else {
      h = 60 * ((rNorm - gNorm) / delta + 4);
    }

    if (h < 0) h += 360;
  }

  return { h, s, v };
}

/**
 * Sample the average RGB color from a rectangular region on a canvas.
 *
 * @param ctx - Canvas 2D rendering context
 * @param x - Center X position
 * @param y - Center Y position
 * @param size - Sample region size (width & height)
 * @returns Average RGB color
 */
export function getAverageColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number = SAMPLE_REGION_SIZE
): RGB {
  const halfSize = Math.floor(size / 2);
  const startX = Math.max(0, x - halfSize);
  const startY = Math.max(0, y - halfSize);

  const imageData = ctx.getImageData(startX, startY, size, size);
  const data = imageData.data;
  const pixelCount = data.length / 4;

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;

  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
  }

  return {
    r: Math.round(totalR / pixelCount),
    g: Math.round(totalG / pixelCount),
    b: Math.round(totalB / pixelCount),
  };
}

/**
 * Calculate how close an HSV value is to the center of a threshold range.
 * Returns a confidence score from 0 (at boundary) to 1 (at center).
 */
function calculateConfidence(hsv: HSV, threshold: HSVThreshold): number {
  const { h, s, v } = hsv;

  // Handle hue wrapping for red
  let hueConfidence: number;
  const hueSpan = threshold.hMin > threshold.hMax
    ? 360 - threshold.hMin + threshold.hMax
    : threshold.hMax - threshold.hMin;

  if (hueSpan >= 360) {
    // White can span the full hue wheel, so hue should not lower confidence.
    hueConfidence = 1;
  } else if (threshold.hMin > threshold.hMax) {
    // Wrapping case (e.g., red: 340-20)
    const hCenter = ((threshold.hMin + threshold.hMax + 360) / 2) % 360;
    let hDist = Math.abs(h - hCenter);
    if (hDist > 180) hDist = 360 - hDist;
    const hRange = (360 - threshold.hMin + threshold.hMax) / 2;
    hueConfidence = Math.max(0, 1 - hDist / Math.max(hRange, 1));
  } else {
    const hCenter = (threshold.hMin + threshold.hMax) / 2;
    const hRange = (threshold.hMax - threshold.hMin) / 2;
    hueConfidence = Math.max(0, 1 - Math.abs(h - hCenter) / Math.max(hRange, 1));
  }

  const sCenter = (threshold.sMin + threshold.sMax) / 2;
  const sRange = (threshold.sMax - threshold.sMin) / 2;
  const sConfidence = Math.max(0, 1 - Math.abs(s - sCenter) / Math.max(sRange, 1));

  const vCenter = (threshold.vMin + threshold.vMax) / 2;
  const vRange = (threshold.vMax - threshold.vMin) / 2;
  const vConfidence = Math.max(0, 1 - Math.abs(v - vCenter) / Math.max(vRange, 1));

  // Weight: hue is most important, then saturation, then value
  return hueConfidence * 0.5 + sConfidence * 0.3 + vConfidence * 0.2;
}

/**
 * Check if an HSV value falls within a threshold range.
 */
function isInThreshold(hsv: HSV, threshold: HSVThreshold): boolean {
  const { h, s, v } = hsv;

  // Check saturation and value
  if (s < threshold.sMin || s > threshold.sMax) return false;
  if (v < threshold.vMin || v > threshold.vMax) return false;

  // Check hue (handle wrapping for red)
  if (threshold.hMin > threshold.hMax) {
    // Wrapping: e.g., 340 <= h OR h <= 20
    return h >= threshold.hMin || h <= threshold.hMax;
  }
  return h >= threshold.hMin && h <= threshold.hMax;
}

/**
 * Classify an HSV color into a Rubik's cube color.
 *
 * Uses threshold-based classification derived from QBR's calibration data.
 * Supports custom thresholds (from calibration mode) or defaults.
 *
 * @param hsv - The HSV color to classify
 * @param customThresholds - Optional custom thresholds from calibration
 * @returns Detection result with color, confidence, and raw values
 */
export function classifyColor(
  hsv: HSV,
  customThresholds?: Record<CubeColor, HSVThreshold>
): ColorDetectionResult {
  const thresholds = customThresholds || DEFAULT_HSV_THRESHOLDS;
  let bestColor: CubeColor | 'unknown' = 'unknown';
  let bestConfidence = -1;

  for (const [color, threshold] of Object.entries(thresholds)) {
    if (isInThreshold(hsv, threshold)) {
      const confidence = calculateConfidence(hsv, threshold);
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestColor = color as CubeColor;
      }
    }
  }

  return {
    color: bestColor,
    confidence: Math.max(bestConfidence, 0),
    hsv,
    rgb: { r: 0, g: 0, b: 0 }, // Will be filled by caller
  };
}

/**
 * Detect colors of all 9 cells on a Rubik's cube face from a canvas frame.
 *
 * @param ctx - Canvas 2D context with the current video frame drawn
 * @param gridCells - Array of 9 grid cell positions
 * @param customThresholds - Optional custom thresholds
 * @returns Array of 9 detection results
 */
export function detectFaceColors(
  ctx: CanvasRenderingContext2D,
  gridCells: GridCell[],
  customThresholds?: Record<CubeColor, HSVThreshold>
): ColorDetectionResult[] {
  return gridCells.map((cell) => {
    const rgb = getAverageColor(ctx, cell.x, cell.y, cell.size);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    const result = classifyColor(hsv, customThresholds);
    result.rgb = rgb;
    return result;
  });
}

/**
 * Calculate 9 grid cell positions for a 3×3 overlay.
 *
 * @param canvasWidth - Width of the canvas
 * @param canvasHeight - Height of the canvas
 * @param gridSizeRatio - How much of the canvas the grid occupies (0-1)
 * @returns Array of 9 GridCell positions (row-major order)
 */
export function calculateGridPositions(
  canvasWidth: number,
  canvasHeight: number,
  gridSizeRatio: number = 0.6
): GridCell[] {
  const gridSize = Math.min(canvasWidth, canvasHeight) * gridSizeRatio;
  const cellSize = gridSize / 3;
  const offsetX = (canvasWidth - gridSize) / 2;
  const offsetY = (canvasHeight - gridSize) / 2;
  const sampleSize = Math.max(10, Math.floor(cellSize * 0.4));

  const cells: GridCell[] = [];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      cells.push({
        x: Math.floor(offsetX + cellSize * col + cellSize / 2),
        y: Math.floor(offsetY + cellSize * row + cellSize / 2),
        size: sampleSize,
      });
    }
  }

  return cells;
}

function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

function getThresholdHueCenter(threshold: HSVThreshold): number {
  if (threshold.hMin > threshold.hMax) {
    return normalizeHue((threshold.hMin + threshold.hMax + 360) / 2);
  }

  return normalizeHue((threshold.hMin + threshold.hMax) / 2);
}

function normalizeHueToReference(hue: number, reference: number): number {
  let adjusted = hue;

  while (adjusted - reference > 180) {
    adjusted -= 360;
  }

  while (reference - adjusted > 180) {
    adjusted += 360;
  }

  return adjusted;
}

function getMean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getStandardDeviation(values: number[], mean: number): number {
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    values.length;

  return Math.sqrt(variance);
}

export function sampleCenterColor(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  sampleSize: number = SAMPLE_REGION_SIZE * 2
): CalibrationSample {
  const rgb = getAverageColor(
    ctx,
    Math.floor(canvasWidth / 2),
    Math.floor(canvasHeight / 2),
    sampleSize
  );

  return {
    rgb,
    hsv: rgbToHsv(rgb.r, rgb.g, rgb.b),
  };
}

export function buildThresholdsFromSamples(
  samples: CalibrationSamples,
  fallbackThresholds: Record<CubeColor, HSVThreshold> = DEFAULT_HSV_THRESHOLDS
): Record<CubeColor, HSVThreshold> {
  const calibratedThresholds = { ...fallbackThresholds };

  for (const color of CUBE_COLORS) {
    const colorSamples = samples[color];

    if (!colorSamples || colorSamples.length === 0) {
      calibratedThresholds[color] = { ...fallbackThresholds[color] };
      continue;
    }

    const hueReference = getThresholdHueCenter(fallbackThresholds[color]);
    const adjustedHues = colorSamples.map((sample) =>
      normalizeHueToReference(sample.h, hueReference)
    );
    const saturations = colorSamples.map((sample) => sample.s);
    const values = colorSamples.map((sample) => sample.v);

    const hueMean = getMean(adjustedHues);
    const saturationMean = getMean(saturations);
    const valueMean = getMean(values);

    const hueStd = getStandardDeviation(adjustedHues, hueMean);
    const saturationStd = getStandardDeviation(saturations, saturationMean);
    const valueStd = getStandardDeviation(values, valueMean);

    const hueHalfSpan = clampValue(Math.ceil(hueStd * 2 + 8), 10, 90);
    const saturationHalfSpan = clampValue(
      Math.ceil(saturationStd * 2 + 8),
      10,
      40
    );
    const valueHalfSpan = clampValue(Math.ceil(valueStd * 2 + 8), 10, 40);

    const rawHueMin = hueMean - hueHalfSpan;
    const rawHueMax = hueMean + hueHalfSpan;
    const hueSpan = rawHueMax - rawHueMin;

    calibratedThresholds[color] = {
      hMin: hueSpan >= 360 ? 0 : Math.round(normalizeHue(rawHueMin)),
      hMax: hueSpan >= 360 ? 360 : Math.round(normalizeHue(rawHueMax)),
      sMin: Math.round(clampValue(saturationMean - saturationHalfSpan, 0, 100)),
      sMax: Math.round(clampValue(saturationMean + saturationHalfSpan, 0, 100)),
      vMin: Math.round(clampValue(valueMean - valueHalfSpan, 0, 100)),
      vMax: Math.round(clampValue(valueMean + valueHalfSpan, 0, 100)),
    };
  }

  return calibratedThresholds;
}

/**
 * Load custom thresholds from localStorage.
 */
export function loadCustomThresholds(): Record<CubeColor, HSVThreshold> | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('qubesolve-color-thresholds');
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Save custom thresholds to localStorage.
 */
export function saveCustomThresholds(
  thresholds: Record<CubeColor, HSVThreshold>
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    'qubesolve-color-thresholds',
    JSON.stringify(thresholds)
  );
}

/**
 * Clear custom thresholds so defaults are used again.
 */
export function clearCustomThresholds(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('qubesolve-color-thresholds');
}
