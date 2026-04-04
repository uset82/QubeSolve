import type { CSSProperties } from "react";

import styles from "./BrandMark.module.css";

const FRONT_FACE = [
  "#44CC44",
  "#44CC44",
  "#F0F0F0",
  "#44CC44",
  "#44CC44",
  "#FFD93D",
  "#FF8C00",
  "#44CC44",
  "#44CC44",
];

const TOP_FACE = [
  "#F0F0F0",
  "#F0F0F0",
  "#4488FF",
  "#F0F0F0",
  "#F0F0F0",
  "#FF4444",
  "#FFD93D",
  "#F0F0F0",
  "#F0F0F0",
];

const SIDE_FACE = [
  "#FF4444",
  "#FF4444",
  "#FFD93D",
  "#FF4444",
  "#FF4444",
  "#4488FF",
  "#FF8C00",
  "#FF4444",
  "#FF4444",
];

interface BrandMarkProps {
  className?: string;
  size?: number;
}

function renderFace(colors: string[], faceClassName: string) {
  return (
    <div className={`${styles.face} ${faceClassName}`} aria-hidden="true">
      {colors.map((color, index) => (
        <span
          key={`${faceClassName}-${index}`}
          className={styles.tile}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

export default function BrandMark({ className, size = 160 }: BrandMarkProps) {
  return (
    <div
      className={[styles.brand, className ?? ""].filter(Boolean).join(" ")}
      style={{ "--brand-size": `${size}px` } as CSSProperties}
    >
      <div className={styles.glow} />
      <div className={styles.cube}>
        {renderFace(TOP_FACE, styles.faceTop)}
        {renderFace(FRONT_FACE, styles.faceFront)}
        {renderFace(SIDE_FACE, styles.faceSide)}
      </div>
    </div>
  );
}
