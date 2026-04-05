import {
  COLOR_HEX_MAP,
  FACE_CENTER_COLORS,
  type Face,
} from '@/lib/constants';

import styles from './PedagogicalRotationVisualizer.module.css';

interface RotationVisualizerProps {
  currentFace: Face;
}

// Isometric Projection Coordinates mapping
const POLYGONS = {
  U: '50,48 88,26 50,4 12,26',
  R: '50,48 88,26 88,70 50,92',
  F: '50,48 12,26 12,70 50,92',
};

// Arrow paths indicating the rotation of the PHYSICAL cube in space
const CUBE_ROTATION_ARROWS: Record<Face, string | null> = {
  F: null, // Initial face, no flip
  R: 'M 85,55 Q 50,85 15,55', // Swipe right-to-left
  B: 'M 85,55 Q 50,85 15,55', // Swipe right-to-left
  L: 'M 85,55 Q 50,85 15,55', // Swipe right-to-left
  U: 'M 50,15 Q 85,50 50,85', // Tilt downward (Top to Front)
  D: 'M 50,90 Q 15,50 50,15', // Tip upward (Bottom to Front)
};

const KID_FRIENDLY_SCANS: Record<Face, string> = {
  F: 'Hold Green in front, White on top.',
  R: 'Flip the cube LEFT so Red is in front.',
  B: 'Flip LEFT again so Blue is front.',
  L: 'Flip LEFT again so Orange is front.',
  U: 'Tip the cube DOWN so White is front.',
  D: 'Tip the cube UP twice so Yellow is front.',
};

export default function PedagogicalRotationVisualizer({ currentFace }: RotationVisualizerProps) {
  const activeColor = COLOR_HEX_MAP[FACE_CENTER_COLORS[currentFace]];
  const arrowPath = CUBE_ROTATION_ARROWS[currentFace];
  
  // Highlighting:
  // For the camera scanner rotation, we want to pulse the "target" color
  // However, because we only see standard F, R, U faces in the flat iso view,
  // we can simply use the activeColor to tint the entire cube wireframe.
  const getFaceFill = (f: Face) => (f === currentFace ? activeColor : '#1e2433');
  const getFaceOpacity = (f: Face) => (f === currentFace ? 0.9 : 0.4);

  return (
    <div className={styles.container}>
      <div className={styles.graphicBox}>
        <svg viewBox="0 0 100 100" className={styles.svgCube} overflow="visible">
          {/* Arrowhead Def */}
          <defs>
            <marker id="rotation-arrowhead" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto">
              <polygon points="0 0, 8 4, 0 8" fill={activeColor} />
            </marker>
          </defs>

          {/* Base ISO Faces */}
          <polygon points={POLYGONS.U} fill={getFaceFill('U')} opacity={getFaceOpacity('U')} stroke="#0a0f18" strokeWidth="2" strokeLinejoin="round" />
          <polygon points={POLYGONS.F} fill={getFaceFill('F')} opacity={getFaceOpacity('F')} stroke="#0a0f18" strokeWidth="2" strokeLinejoin="round" />
          <polygon points={POLYGONS.R} fill={getFaceFill('R')} opacity={getFaceOpacity('R')} stroke="#0a0f18" strokeWidth="2" strokeLinejoin="round" />

          {/* Core Target Center Marker */}
          {(currentFace === 'F' || currentFace === 'R' || currentFace === 'U') && (
            <circle cx="50" cy="48" r="4" fill="#000" opacity="0.3" transform={
               currentFace === 'F' ? 'translate(-18, 11) scale(1, 1.2)' :
               currentFace === 'R' ? 'translate(18, 11) scale(1, 1.2)' :
               'translate(0, -22) scale(1.4, 0.7)'
            } />
          )}

          {/* Highlight Rotation Arrow */}
          {arrowPath && (
            <path 
              d={arrowPath} 
              fill="none" 
              stroke={activeColor} 
              strokeWidth="5" 
              strokeLinecap="round" 
              markerEnd="url(#rotation-arrowhead)"
              className={styles.animatedArrow}
            />
          )}
        </svg>
      </div>
      
      <div className={styles.instruction}>
        <div className={styles.actionBadge} style={{ backgroundColor: activeColor, color: (currentFace === 'U' || currentFace === 'D') ? '#000' : '#fff' }}>
          {FACE_CENTER_COLORS[currentFace].toUpperCase()}
        </div>
        <p className={styles.kidFriendlyText}>
          {KID_FRIENDLY_SCANS[currentFace]}
        </p>
      </div>
    </div>
  );
}
