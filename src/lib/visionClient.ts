import { type CubeColor, type Face } from "@/lib/constants";

export interface VisionAssistResult {
  confidence: number;
  colors: CubeColor[];
  model: string;
  notes: string;
  requestedFace: Face | null;
}

interface VisionAssistPayload {
  details?: unknown;
  error?: unknown;
}

export async function requestVisionAssist(
  imageDataUrl: string,
  face: Face
): Promise<VisionAssistResult> {
  const response = await fetch("/api/vision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageDataUrl,
      face,
    }),
  });

  const payload = (await response.json()) as VisionAssistResult & VisionAssistPayload;

  if (!response.ok) {
    const message =
      typeof payload.error === "string"
        ? payload.error
        : "AI detection could not analyze this frame.";
    const details =
      typeof payload.details === "string" ? ` ${payload.details}` : "";
    throw new Error(`${message}${details}`.trim());
  }

  return payload;
}
