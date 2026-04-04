import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  normalizeVisionNotes,
  parseCubeVisionPayload,
} from "../../src/lib/cubeVision";

describe("cubeVision", () => {
  test("normalizes notes fragments from structured arrays", () => {
    const payload = parseCubeVisionPayload(`{
      "colors": ["BLUE", "red", "white", "white", "green", "green", "yellow", "orange", "blue"],
      "confidence": "0.82",
      "notes": ["Slight glare", { "text": "top-right sticker is partially occluded." }]
    }`);

    expect(payload.colors).toEqual([
      "blue",
      "red",
      "white",
      "white",
      "green",
      "green",
      "yellow",
      "orange",
      "blue",
    ]);
    expect(payload.confidence).toBe(0.82);
    expect(payload.notes).toBe(
      "Slight glare top-right sticker is partially occluded."
    );
  });

  test("falls back to a stable notes message when notes are missing", () => {
    expect(normalizeVisionNotes(null)).toBe(
      "AI assist analyzed the current frame."
    );
  });

  test("extracts notes text from nested objects", () => {
    expect(
      normalizeVisionNotes({
        summary: {
          content: ["Center is clear.", { text: "Bottom row is shadowed." }],
        },
      })
    ).toBe("Center is clear. Bottom row is shadowed.");
  });
});
