import { ImageResponse } from "next/og";

import { renderBrandImage } from "@/lib/brandImage";

const ALLOWED_SIZES = new Set([72, 96, 128, 144, 152, 167, 180, 192, 384, 512]);

export async function GET(
  _request: Request,
  context: RouteContext<"/icons/[size]">
) {
  const { size } = await context.params;
  const parsedSize = Number.parseInt(size, 10);

  if (!Number.isInteger(parsedSize) || !ALLOWED_SIZES.has(parsedSize)) {
    return new Response("Not Found", { status: 404 });
  }

  return new ImageResponse(renderBrandImage(parsedSize), {
    width: parsedSize,
    height: parsedSize,
  });
}
