import {
  COLOR_HEX_MAP,
  FACE_CENTER_COLORS,
  FACE_NAMES,
  type Face,
  type MoveDirection,
} from '@/lib/constants';
import type { MoveData } from '@/lib/moveParser';

import styles from './PedagogicalMoveVisualizer.module.css';

interface MoveVisualizerProps {
  move: MoveData | null;
}

// Isometric Projection Coordinates
// Center is (50, 48). Top is (50, 4). Left is (12, 26). Right is (88, 26).
// Bottom Center is (50, 92). Bottom Left is (12, 70). Bottom Right is (88, 70).

const POLYGONS = {
  // Visible faces
  U: '50,48 88,26 50,4 12,26',
  R: '50,48 88,26 88,70 50,92',
  F: '50,48 12,26 12,70 50,92',
  // Hidden faces (simulated by showing their edge/glow or drawing them "behind")
  // We represent D as a shape under the cube
  D: '50,92 88,70 50,114 12,70', 
  // L and B are "behind"
  L: '12,26 12,70 -10,48 -10,4',
  B: '88,26 88,70 110,48 110,4',
};

// SVG Paths for arrows based on face and direction
// We'll draw a prominent curved arrow indicating the turn.
const ARROWS: Record<Face, Record<MoveDirection, string>> = {
  U: {
    CW: 'M 15,15 Q 50,-10 85,15',
    CCW: 'M 85,15 Q 50,-10 15,15',
    '180': 'M 15,15 Q 50,-15 85,15',
  },
  D: {
    CW: 'M 85,85 Q 50,110 15,85',
    CCW: 'M 15,85 Q 50,110 85,85',
    '180': 'M 15,85 Q 50,115 85,85',
  },
  F: {
    CW: 'M 5,60 Q 30,100 65,85',
    CCW: 'M 65,85 Q 30,100 5,60',
    '180': 'M 5,60 Q 35,110 65,85',
  },
  R: {
    CW: 'M 35,85 Q 70,100 95,60',
    CCW: 'M 95,60 Q 70,100 35,85',
    '180': 'M 35,85 Q 65,110 95,60',
  },
  L: {
    CW: 'M -5,40 Q 5,10 35,0',
    CCW: 'M 35,0 Q 5,10 -5,40',
    '180': 'M 35,0 Q -5,-5 -5,40',
  },
  B: {
    CW: 'M 65,0 Q 95,10 105,40',
    CCW: 'M 105,40 Q 95,10 65,0',
    '180': 'M 105,40 Q 95,-5 65,0',
  },
};

const KID_FRIENDLY_LABELS: Record<Face, string> = {
  U: 'the TOP face (White)',
  D: 'the BOTTOM face (Yellow)',
  F: 'the FRONT face (Green)',
  B: 'the BACK face (Blue)',
  L: 'the LEFT face (Orange)',
  R: 'the RIGHT face (Red)',
};

const KID_FRIENDLY_DIRECTIONS: Record<MoveDirection, string> = {
  CW: 'to the right (clockwise)',
  CCW: 'to the left (counter-clockwise)',
  '180': 'all the way around (half turn)',
};

export default function PedagogicalMoveVisualizer({ move }: MoveVisualizerProps) {
  if (!move) return null;

  const activeColor = COLOR_HEX_MAP[FACE_CENTER_COLORS[move.face]];
  
  // To keep it simple, we draw a generic cube, but color the active face brightly.
  // We use dark styling for the inactive faces.
  const getFaceFill = (f: Face) => (f === move.face ? activeColor : '#1e2433');
  const getFaceOpacity = (f: Face) => (f === move.face ? 0.9 : 0.4);

  return (
    <div className={styles.container}>
      <div className={styles.graphicBox}>
        <svg viewBox="0 0 100 100" className={styles.svgCube} overflow="visible">
          {/* Defs for arrowheads */}
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto">
              <polygon points="0 0, 8 4, 0 8" fill={activeColor} />
            </marker>
          </defs>

          {/* Base Cube Faces */}
          <polygon points={POLYGONS.U} fill={getFaceFill('U')} opacity={getFaceOpacity('U')} stroke="#0a0f18" strokeWidth="2" strokeLinejoin="round" />
          <polygon points={POLYGONS.L} fill={getFaceFill('L')} opacity={getFaceOpacity('L')} stroke="#0a0f18" strokeWidth="2" strokeLinejoin="round" />
          <polygon points={POLYGONS.B} fill={getFaceFill('B')} opacity={getFaceOpacity('B')} stroke="#0a0f18" strokeWidth="2" strokeLinejoin="round" />
          <polygon points={POLYGONS.D} fill={getFaceFill('D')} opacity={getFaceOpacity('D')} stroke="#0a0f18" strokeWidth="2" strokeLinejoin="round" />
          <polygon points={POLYGONS.F} fill={getFaceFill('F')} opacity={getFaceOpacity('F')} stroke="#0a0f18" strokeWidth="2" strokeLinejoin="round" />
          <polygon points={POLYGONS.R} fill={getFaceFill('R')} opacity={getFaceOpacity('R')} stroke="#0a0f18" strokeWidth="2" strokeLinejoin="round" />

          {/* Highlight Arrow */}
          <path 
            d={ARROWS[move.face][move.direction]} 
            fill="none" 
            stroke={activeColor} 
            strokeWidth="5" 
            strokeLinecap="round" 
            markerEnd="url(#arrowhead)"
            className={styles.animatedArrow}
          />
        </svg>
      </div>
      
      <div className={styles.instruction}>
        <div className={styles.actionBadge} style={{ backgroundColor: activeColor, color: (move.face === 'U' || move.face === 'D') ? '#000' : '#fff' }}>
          {move.notation}
        </div>
        <p className={styles.kidFriendlyText}>
          Turn <strong>{KID_FRIENDLY_LABELS[move.face]}</strong><br/>
          {KID_FRIENDLY_DIRECTIONS[move.direction]}.
        </p>
      </div>
    </div>
  );
}
