import { NextResponse } from "next/server";

import { type Face } from "@/lib/constants";
import { analyzeCubeFaceWithOpenRouter } from "@/lib/cubeVision";

export const runtime = "nodejs";

const VALID_FACES = new Set<Face>(["U", "D", "F", "B", "L", "R"]);
const MAX_IMAGE_DATA_URL_LENGTH = 4_000_000;

interface VisionRouteRequestBody {
  imageDataUrl?: unknown;
  face?: unknown;
}

function parseFace(value: unknown): Face | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toUpperCase() as Face;

  if (!VALID_FACES.has(normalized)) {
    return undefined;
  }

  return normalized;
}

export async function POST(request: Request) {
  let body: VisionRouteRequestBody;

  try {
    body = (await request.json()) as VisionRouteRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const imageDataUrl =
    typeof body.imageDataUrl === "string" ? body.imageDataUrl.trim() : "";
  const face = parseFace(body.face);

  if (!imageDataUrl) {
    return NextResponse.json(
      { error: "imageDataUrl is required." },
      { status: 400 }
    );
  }

  if (!imageDataUrl.startsWith("data:image/")) {
    return NextResponse.json(
      { error: "imageDataUrl must be a data URL for an image." },
      { status: 400 }
    );
  }

  if (imageDataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
    return NextResponse.json(
      { error: "imageDataUrl is too large." },
      { status: 413 }
    );
  }

  if (body.face !== undefined && !face) {
    return NextResponse.json(
      { error: "face must be one of U, D, F, B, L, or R." },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeCubeFaceWithOpenRouter({
      imageDataUrl,
      faceHint: face,
    });

    return NextResponse.json(analysis);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OpenRouter request failed.";
    const isConfigurationError = message.includes("OPENROUTER_API_KEY");

    return NextResponse.json(
      {
        error: isConfigurationError
          ? "Server is missing OPENROUTER_API_KEY."
          : "OpenRouter vision request failed.",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: isConfigurationError ? 500 : 502 }
    );
  }
}
