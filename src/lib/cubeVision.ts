import "server-only";

import { CUBE_COLORS, type CubeColor, type Face } from "@/lib/constants";
import { getOpenRouterClient, getOpenRouterModel } from "@/lib/openrouter";

const COLOR_SET = new Set(CUBE_COLORS);
const FALLBACK_VISION_NOTES = "AI assist analyzed the current frame.";

const CUBE_FACE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    colors: {
      type: "array",
      minItems: 9,
      maxItems: 9,
      items: {
        type: "string",
        enum: CUBE_COLORS,
      },
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
    },
    notes: {
      type: "string",
    },
  },
  required: ["colors", "confidence", "notes"],
} as const;

const CUBE_REPAIR_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    suggestedChanges: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          face: { type: "string", enum: ["U", "D", "F", "B", "L", "R"] },
          index: { type: "number", minimum: 0, maximum: 8 },
          oldColor: { type: "string", enum: CUBE_COLORS },
          newColor: { type: "string", enum: CUBE_COLORS },
          reason: { type: "string" },
        },
        required: ["face", "index", "oldColor", "newColor", "reason"],
      },
    },
    explanation: { type: "string" },
  },
  required: ["suggestedChanges", "explanation"],
} as const;

export interface CubeRepairSuggestion {
  face: Face;
  index: number;
  oldColor: CubeColor;
  newColor: CubeColor;
  reason: string;
}

export interface CubeRepairResult {
  suggestedChanges: CubeRepairSuggestion[];
  explanation: string;
  model: string;
}

export interface CubeVisionAnalysis {
  requestedFace: Face | null;
  colors: CubeColor[];
  confidence: number;
  notes: string;
  model: string;
}

interface AnalyzeCubeFaceOptions {
  imageDataUrl: string;
  faceHint?: Face;
}

function buildSystemPrompt(): string {
  return [
    "You analyze a single photo of one 3x3 Rubik's cube face.",
    "Read the visible stickers in row-major order from top-left to bottom-right.",
    "Use only these color names: white, yellow, red, orange, blue, green.",
    "If the image is partially ambiguous, still make the best estimate and lower the confidence score.",
    "Return JSON only.",
  ].join(" ");
}

function buildUserPrompt(faceHint?: Face): string {
  if (!faceHint) {
    return "Analyze the visible face in the image.";
  }

  return [
    `Analyze the face in the image. The caller expects face ${faceHint}.`,
    "Treat that hint as secondary context only; trust the image if the hint appears wrong.",
  ].join(" ");
}

function extractTextContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (
    typeof content === "object" &&
    content !== null &&
    "text" in content &&
    typeof content.text === "string"
  ) {
    return content.text;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (typeof item === "object" && item !== null) {
        if ("text" in item && typeof item.text === "string") {
          return item.text;
        }

        if (
          "type" in item &&
          item.type === "text" &&
          "text" in item &&
          typeof item.text === "string"
        ) {
          return item.text;
        }
      }

      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function collectNotesFragments(
  value: unknown,
  seen: WeakSet<object> = new WeakSet()
): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectNotesFragments(entry, seen));
  }

  if (typeof value !== "object") {
    return [];
  }

  if (seen.has(value)) {
    return [];
  }

  seen.add(value);
  const record = value as Record<string, unknown>;

  const prioritizedKeys = [
    "notes",
    "text",
    "message",
    "summary",
    "reasoning",
    "content",
    "description",
  ] as const;
  const prioritizedFragments = prioritizedKeys.flatMap((key) =>
    key in record ? collectNotesFragments(record[key], seen) : []
  );

  if (prioritizedFragments.length > 0) {
    return prioritizedFragments;
  }

  return Object.values(record).flatMap((entry) =>
    collectNotesFragments(entry, seen)
  );
}

export function normalizeVisionNotes(value: unknown): string {
  const normalized = collectNotesFragments(value)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || FALLBACK_VISION_NOTES;
}

function normalizeCubeColors(value: unknown): CubeColor[] {
  if (!Array.isArray(value) || value.length !== 9) {
    throw new Error("OpenRouter returned an invalid colors array.");
  }

  const normalizedColors = value.map((color) =>
    typeof color === "string" ? color.trim().toLowerCase() : color
  );

  if (
    normalizedColors.some(
      (color) => typeof color !== "string" || !COLOR_SET.has(color as CubeColor)
    )
  ) {
    throw new Error("OpenRouter returned an invalid colors array.");
  }

  return normalizedColors as CubeColor[];
}

function normalizeConfidenceScore(value: unknown): number {
  const parsedConfidence =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (Number.isNaN(parsedConfidence)) {
    throw new Error("OpenRouter returned an invalid confidence score.");
  }

  return Math.max(0, Math.min(1, parsedConfidence));
}

export function parseCubeVisionPayload(rawContent: string): {
  colors: CubeColor[];
  confidence: number;
  notes: string;
} {
  const unfenced = stripCodeFence(rawContent);
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  const jsonText =
    start >= 0 && end > start ? unfenced.slice(start, end + 1) : unfenced;

  const parsed = JSON.parse(jsonText) as {
    colors?: unknown;
    confidence?: unknown;
    notes?: unknown;
  };

  return {
    colors: normalizeCubeColors(parsed.colors),
    confidence: normalizeConfidenceScore(parsed.confidence),
    notes: normalizeVisionNotes(parsed.notes),
  };
}

async function requestCubeAnalysis(
  imageDataUrl: string,
  faceHint?: Face,
  useStructuredOutput: boolean = true
) {
  const client = getOpenRouterClient();
  const model = getOpenRouterModel();

  return client.chat.send({
    chatRequest: {
      model,
      stream: false,
      temperature: 0.1,
      maxCompletionTokens: 250,
      provider: {
        allowFallbacks: true,
        sort: "price",
      },
      reasoning: {
        effort: "low",
      },
      ...(useStructuredOutput
        ? {
            responseFormat: {
              type: "json_schema" as const,
              jsonSchema: {
                name: "cube_face_analysis",
                description:
                  "Color classification for a single visible Rubik's cube face.",
                schema: CUBE_FACE_SCHEMA,
                strict: true,
              },
            },
          }
        : {}),
      messages: [
        {
          role: "system" as const,
          content: buildSystemPrompt(),
        },
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: buildUserPrompt(faceHint),
            },
            {
              type: "image_url" as const,
              imageUrl: {
                url: imageDataUrl,
                detail: "high" as const,
              },
            },
          ],
        },
      ],
    },
  });
}

export async function analyzeCubeFaceWithOpenRouter({
  imageDataUrl,
  faceHint,
}: AnalyzeCubeFaceOptions): Promise<CubeVisionAnalysis> {
  let response;

  try {
    response = await requestCubeAnalysis(imageDataUrl, faceHint, true);
  } catch {
    response = await requestCubeAnalysis(imageDataUrl, faceHint, false);
  }

  const rawContent = extractTextContent(response.choices[0]?.message.content);

  if (!rawContent) {
    throw new Error("OpenRouter returned an empty response.");
  }

  const analysis = parseCubeVisionPayload(rawContent);

  return {
    requestedFace: faceHint ?? null,
    colors: analysis.colors,
    confidence: analysis.confidence,
    notes: analysis.notes,
    model: response.model,
  };
}

export async function repairCubeStateWithOpenRouter(
  cubeState: Record<Face, CubeColor[]>,
  validationErrors: string[]
): Promise<CubeRepairResult> {
  const client = getOpenRouterClient();
  const model = getOpenRouterModel();

  const stateString = Object.entries(cubeState)
    .map(([face, colors]) => `${face}: ${colors.join(", ")}`)
    .join("\n");

  const systemPrompt = [
    "You are a Rubik's Cube expert assistant.",
    "The user has a cube scan that is physically illegal (impossible color combinations or counts).",
    "Analyze the provided cube state and validation errors.",
    "Suggest the MINIMUM number of sticker color changes to make the cube physically legal.",
    "Prioritize changing colors that are likely misread (e.g., Red/Orange, White/Yellow).",
    "Ensure each face has exactly 9 stickers of each color in the final state.",
    "Return JSON only.",
  ].join(" ");

  const userPrompt = [
    "Current Cube State:",
    stateString,
    "\nValidation Errors:",
    validationErrors.join("\n"),
    "\nProvide a list of suggested changes to make this cube legal.",
  ].join("\n");

  const response = await client.chat.send({
    chatRequest: {
      model,
      stream: false,
      temperature: 0.2,
      responseFormat: {
        type: "json_schema",
        jsonSchema: {
          name: "cube_repair",
          description: "Suggestions to fix an illegal Rubik's cube scan.",
          schema: CUBE_REPAIR_SCHEMA,
          strict: true,
        },
      },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    },
  });

  const rawContent = extractTextContent(response.choices[0]?.message.content);
  if (!rawContent) {
    throw new Error("AI repair returned an empty response.");
  }

  const parsed = JSON.parse(stripCodeFence(rawContent)) as {
    suggestedChanges: CubeRepairSuggestion[];
    explanation: string;
  };

  return {
    suggestedChanges: parsed.suggestedChanges,
    explanation: parsed.explanation,
    model: response.model,
  };
}
