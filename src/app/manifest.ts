import type { MetadataRoute } from "next";

const ICON_SIZES = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QubeSolve — Rubik's Cube Solver",
    short_name: "QubeSolve",
    description:
      "Scan your Rubik's cube and solve it step by step with animated 3D instructions.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#0F0F1A",
    background_color: "#0F0F1A",
    categories: ["education", "games", "utilities"],
    icons: ICON_SIZES.map((size) => ({
      src: `/icons/${size}`,
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose: size >= 192 ? "maskable" : "any",
    })),
  };
}
