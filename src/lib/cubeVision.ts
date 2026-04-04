import "server-only";

import { CUBE_COLORS, type CubeColor, type Face } from "@/lib/constants";
import { getOpenRouterClient, getOpenRouterModel } from "@/lib/openrouter";

const COLOR_SET = new Set(CUBE_COLORS);

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

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((item) => {
      if (
        typeof item === "object" &&
        item !== null &&
        "type" in item &&
        item.type === "text" &&
        "text" in item &&
        typeof item.text === "string"
      ) {
        return item.text;
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

function parseAnalysisPayload(rawContent: string): {
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

  if (
    !Array.isArray(parsed.colors) ||
    parsed.colors.length !== 9 ||
    parsed.colors.some(
      (color) => typeof color !== "string" || !COLOR_SET.has(color as CubeColor)
    )
  ) {
    throw new Error("OpenRouter returned an invalid colors array.");
  }

  if (typeof parsed.confidence !== "number" || Number.isNaN(parsed.confidence)) {
    throw new Error("OpenRouter returned an invalid confidence score.");
  }

  if (typeof parsed.notes !== "string") {
    throw new Error("OpenRouter returned invalid notes.");
  }

  return {
    colors: parsed.colors as CubeColor[],
    confidence: Math.max(0, Math.min(1, parsed.confidence)),
    notes: parsed.notes.trim(),
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

  const analysis = parseAnalysisPayload(rawContent);

  return {
    requestedFace: faceHint ?? null,
    colors: analysis.colors,
    confidence: analysis.confidence,
    notes: analysis.notes,
    model: response.model,
  };
}
