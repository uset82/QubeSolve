import {
  COLOR_CSS_MAP,
  FACE_CENTER_COLORS,
  FACE_NAMES,
} from '@/lib/constants';
import type { MoveData } from '@/lib/moveParser';

import styles from './MoveArrow.module.css';

interface MoveArrowProps {
  move: MoveData | null;
}

const DIRECTION_GLYPHS = {
  CW: '↻',
  CCW: '↺',
  '180': '⟲',
} as const;

const DIRECTION_LABELS = {
  CW: 'Clockwise quarter turn',
  CCW: 'Counter-clockwise quarter turn',
  '180': 'Half turn',
} as const;

export default function MoveArrow({ move }: MoveArrowProps) {
  if (!move) {
    return (
      <section className={styles.card}>
        <p className={styles.eyebrow}>Move Direction</p>
        <p className={styles.empty}>
          No queued move. The cube is either solved or waiting for the next step.
        </p>
      </section>
    );
  }

  const faceLabel = FACE_NAMES[move.face].replace(/\s+\(.+\)$/, '');
  const badgeColor = COLOR_CSS_MAP[FACE_CENTER_COLORS[move.face]];
  const badgeTextColor = move.face === 'U' || move.face === 'D' ? '#111624' : '#f7fbff';

  return (
    <section className={styles.card}>
      <p className={styles.eyebrow}>Move Direction</p>
      <div className={styles.row}>
        <span
          className={styles.faceBadge}
          style={{ backgroundColor: badgeColor, color: badgeTextColor }}
        >
          {move.face}
        </span>
        <div className={styles.arrowGroup}>
          <span className={styles.arrowGlyph}>{DIRECTION_GLYPHS[move.direction]}</span>
          {move.direction === '180' ? <span className={styles.twice}>2x</span> : null}
        </div>
      </div>
      <p className={styles.caption}>
        {DIRECTION_LABELS[move.direction]} on the {faceLabel.toLowerCase()} face.
      </p>
    </section>
  );
}
