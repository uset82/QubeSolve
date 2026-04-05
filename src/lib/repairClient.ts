import { type CubeColor, type Face } from "@/lib/constants";
import { type CubeRepairResult } from "@/lib/cubeVision";

export async function requestRepairAssist(
  cubeState: Record<Face, CubeColor[]>,
  validationErrors: string[]
): Promise<CubeRepairResult> {
  const response = await fetch("/api/repair", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cubeState,
      validationErrors,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "AI repair assistant failed.");
  }

  return payload;
}
