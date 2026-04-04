import { ImageResponse } from "next/og";

import { renderBrandImage } from "@/lib/brandImage";

export const size = {
  width: 256,
  height: 256,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(renderBrandImage(size.width), size);
}
