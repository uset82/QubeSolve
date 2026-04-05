import { NextResponse } from "next/server";
import { type CubeColor, type Face } from "@/lib/constants";
import { repairCubeStateWithOpenRouter } from "@/lib/cubeVision";

export const runtime = "nodejs";

interface RepairRequestBody {
  cubeState?: unknown;
  validationErrors?: unknown;
}

export async function POST(request: Request) {
  let body: RepairRequestBody;

  try {
    body = (await request.json()) as RepairRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const { cubeState, validationErrors } = body;

  if (!cubeState || typeof cubeState !== "object") {
    return NextResponse.json(
      { error: "cubeState is required and must be an object." },
      { status: 400 }
    );
  }

  if (!Array.isArray(validationErrors)) {
    return NextResponse.json(
      { error: "validationErrors is required and must be an array." },
      { status: 400 }
    );
  }

  try {
    const result = await repairCubeStateWithOpenRouter(
      cubeState as Record<Face, CubeColor[]>,
      validationErrors as string[]
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI repair failed.";
    return NextResponse.json(
      {
        error: "AI repair assistant failed.",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 502 }
    );
  }
}
