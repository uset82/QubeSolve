import {
  COLOR_CSS_MAP,
  CUBE_COLORS,
  FACE_NAMES,
  type CubeColor,
  type Face,
} from "@/lib/constants";

import styles from "./CubeNet2D.module.css";

type FaceletSelection = {
  face: Face;
  index: number;
};

export type CubeNetState = Record<Face, ReadonlyArray<CubeColor | null>>;

interface CubeNet2DProps {
  cubeState: CubeNetState;
  editable?: boolean;
  selectedColor?: CubeColor | null;
  selectedFacelet?: FaceletSelection | null;
  onSelectColor?: (color: CubeColor) => void;
  onFaceletClick?: (face: Face, index: number) => void;
}

const FACE_LAYOUT: Array<{ face: Face; className: string }> = [
  { face: "U", className: styles.faceTop },
  { face: "L", className: styles.faceLeft },
  { face: "F", className: styles.faceFront },
  { face: "R", className: styles.faceRight },
  { face: "B", className: styles.faceBack },
  { face: "D", className: styles.faceBottom },
];

function getFaceLabel(face: Face): string {
  return FACE_NAMES[face].split(" ")[0];
}

export default function CubeNet2D({
  cubeState,
  editable = false,
  selectedColor = null,
  selectedFacelet = null,
  onSelectColor,
  onFaceletClick,
}: CubeNet2DProps) {
  return (
    <div className={styles.wrapper}>
      {editable && onSelectColor && (
        <div className={styles.legend} aria-label="Color palette">
          {CUBE_COLORS.map((color) => {
            const isActive = selectedColor === color;

            return (
              <button
                key={color}
                type="button"
                className={`${styles.legendButton}${isActive ? ` ${styles.legendButtonActive}` : ""}`}
                onClick={() => onSelectColor(color)}
              >
                <span
                  className={styles.legendSwatch}
                  style={{ backgroundColor: COLOR_CSS_MAP[color] }}
                />
                <span>{color}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className={styles.net}>
        {FACE_LAYOUT.map(({ face, className }) => (
          <section key={face} className={`${styles.face} ${className}`}>
            <h3 className={styles.faceLabel}>{getFaceLabel(face)}</h3>
            <div className={styles.grid}>
              {cubeState[face].map((color, index) => {
                const isCenter = index === 4;
                const isSelected =
                  selectedFacelet?.face === face && selectedFacelet.index === index;
                const cellClassName = [
                  styles.cell,
                  editable && !isCenter ? styles.cellEditable : styles.cellLocked,
                  isSelected ? styles.cellSelected : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    key={`${face}-${index}`}
                    type="button"
                    className={cellClassName}
                    style={{
                      backgroundColor: color
                        ? COLOR_CSS_MAP[color]
                        : "rgba(255, 255, 255, 0.06)",
                    }}
                    onClick={() => onFaceletClick?.(face, index)}
                    disabled={!editable || isCenter}
                    aria-label={`${FACE_NAMES[face]} sticker ${index + 1}: ${color ?? "empty"}`}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
