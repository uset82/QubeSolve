import { ImageResponse } from "next/og";

import { renderBrandImage } from "@/lib/brandImage";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(renderBrandImage(size.width), size);
}
