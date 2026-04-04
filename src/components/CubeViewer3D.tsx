'use client';

import { OrbitControls, RoundedBox } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';

import { COLOR_HEX_MAP, MOVE_ANIMATION_DURATION, type Face } from '@/lib/constants';
import type { CubeState } from '@/lib/cubeState';
import type { MoveData } from '@/lib/moveParser';

type Coordinate = -1 | 0 | 1;
type Vector3Tuple = [number, number, number];

interface CubeViewer3DProps {
  cubeState: CubeState;
  activeMove?: MoveData | null;
  animationCommand?: CubeViewer3DAnimationCommand | null;
  onAnimationComplete?: (commandId: number) => void;
}

interface StickerDescriptor {
  face: Face;
  color: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  highlight: boolean;
}

interface CubieDescriptor {
  key: string;
  cubePosition: Vector3Tuple;
  stickers: StickerDescriptor[];
}

interface AnimationState {
  command: CubeViewer3DAnimationCommand;
  progress: number;
}

export interface CubeViewer3DAnimationCommand {
  id: number;
  move: MoveData;
  fromState: CubeState;
}

const AXIS_VALUES: Coordinate[] = [-1, 0, 1];
const CUBIE_SPACING = 1.05;
const CUBIE_SIZE = 0.92;
const STICKER_SIZE = 0.68;
const STICKER_OFFSET = 0.474;
const BODY_COLOR = '#111624';
const SHADOW_COLOR = '#05070b';

const STICKER_TRANSFORMS: Record<Face, { position: Vector3Tuple; rotation: Vector3Tuple }> = {
  U: { position: [0, STICKER_OFFSET, 0], rotation: [-Math.PI / 2, 0, 0] },
  D: { position: [0, -STICKER_OFFSET, 0], rotation: [Math.PI / 2, 0, 0] },
  F: { position: [0, 0, STICKER_OFFSET], rotation: [0, 0, 0] },
  B: { position: [0, 0, -STICKER_OFFSET], rotation: [0, Math.PI, 0] },
  L: { position: [-STICKER_OFFSET, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  R: { position: [STICKER_OFFSET, 0, 0], rotation: [0, Math.PI / 2, 0] },
};

function easeInOutCubic(value: number): number {
  if (value < 0.5) {
    return 4 * value * value * value;
  }

  return 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function getFaceletIndex(face: Face, x: Coordinate, y: Coordinate, z: Coordinate): number {
  switch (face) {
    case 'F':
      return (1 - y) * 3 + (x + 1);
    case 'B':
      return (1 - y) * 3 + (1 - x);
    case 'U':
      return (z + 1) * 3 + (x + 1);
    case 'D':
      return (1 - z) * 3 + (x + 1);
    case 'R':
      return (1 - y) * 3 + (1 - z);
    case 'L':
      return (1 - y) * 3 + (z + 1);
  }
}

function getFaceColor(state: CubeState, face: Face, x: Coordinate, y: Coordinate, z: Coordinate): string {
  return COLOR_HEX_MAP[state[face][getFaceletIndex(face, x, y, z)]];
}

function buildCubies(state: CubeState, activeFace: Face | null): CubieDescriptor[] {
  const cubies: CubieDescriptor[] = [];

  for (const x of AXIS_VALUES) {
    for (const y of AXIS_VALUES) {
      for (const z of AXIS_VALUES) {
        const stickers: StickerDescriptor[] = [];

        if (x === 1) {
          stickers.push({
            face: 'R',
            color: getFaceColor(state, 'R', x, y, z),
            position: STICKER_TRANSFORMS.R.position,
            rotation: STICKER_TRANSFORMS.R.rotation,
            highlight: activeFace === 'R',
          });
        }

        if (x === -1) {
          stickers.push({
            face: 'L',
            color: getFaceColor(state, 'L', x, y, z),
            position: STICKER_TRANSFORMS.L.position,
            rotation: STICKER_TRANSFORMS.L.rotation,
            highlight: activeFace === 'L',
          });
        }

        if (y === 1) {
          stickers.push({
            face: 'U',
            color: getFaceColor(state, 'U', x, y, z),
            position: STICKER_TRANSFORMS.U.position,
            rotation: STICKER_TRANSFORMS.U.rotation,
            highlight: activeFace === 'U',
          });
        }

        if (y === -1) {
          stickers.push({
            face: 'D',
            color: getFaceColor(state, 'D', x, y, z),
            position: STICKER_TRANSFORMS.D.position,
            rotation: STICKER_TRANSFORMS.D.rotation,
            highlight: activeFace === 'D',
          });
        }

        if (z === 1) {
          stickers.push({
            face: 'F',
            color: getFaceColor(state, 'F', x, y, z),
            position: STICKER_TRANSFORMS.F.position,
            rotation: STICKER_TRANSFORMS.F.rotation,
            highlight: activeFace === 'F',
          });
        }

        if (z === -1) {
          stickers.push({
            face: 'B',
            color: getFaceColor(state, 'B', x, y, z),
            position: STICKER_TRANSFORMS.B.position,
            rotation: STICKER_TRANSFORMS.B.rotation,
            highlight: activeFace === 'B',
          });
        }

        cubies.push({
          key: `${x}${y}${z}`,
          cubePosition: [x * CUBIE_SPACING, y * CUBIE_SPACING, z * CUBIE_SPACING],
          stickers,
        });
      }
    }
  }

  return cubies;
}

function isCubieInMoveLayer(cubie: CubieDescriptor, move: MoveData): boolean {
  const [x, y, z] = cubie.cubePosition;

  switch (move.face) {
    case 'R':
      return x > 0;
    case 'L':
      return x < 0;
    case 'U':
      return y > 0;
    case 'D':
      return y < 0;
    case 'F':
      return z > 0;
    case 'B':
      return z < 0;
  }
}

function getRotationTuple(move: MoveData, progress: number): Vector3Tuple {
  const angle = move.angle * progress;

  switch (move.axis) {
    case 'x':
      return [angle, 0, 0];
    case 'y':
      return [0, angle, 0];
    case 'z':
      return [0, 0, angle];
  }
}

function Cubie({ cubePosition, stickers }: CubieDescriptor) {
  return (
    <group position={cubePosition}>
      <RoundedBox args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} radius={0.08} smoothness={5}>
        <meshStandardMaterial color={BODY_COLOR} metalness={0.15} roughness={0.7} />
      </RoundedBox>

      {stickers.map((sticker) => (
        <mesh
          key={`${sticker.face}-${sticker.position.join('-')}`}
          position={sticker.position}
          rotation={sticker.rotation}
        >
          <planeGeometry args={[STICKER_SIZE, STICKER_SIZE]} />
          <meshStandardMaterial
            color={sticker.color}
            emissive={sticker.highlight ? sticker.color : SHADOW_COLOR}
            emissiveIntensity={sticker.highlight ? 0.22 : 0.04}
            metalness={0.12}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function CubeViewer3D({
  cubeState,
  activeMove = null,
  animationCommand = null,
  onAnimationComplete,
}: CubeViewer3DProps) {
  const [animation, setAnimation] = useState<AnimationState | null>(null);
  const queueRef = useRef(Promise.resolve());
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const runAnimation = useEffectEvent((command: CubeViewer3DAnimationCommand) => {
    return new Promise<void>((resolve) => {
      const duration =
        MOVE_ANIMATION_DURATION * (command.move.direction === '180' ? 1.15 : 1);
      const startTime = performance.now();

      const frame = (timestamp: number) => {
        if (!mountedRef.current) {
          resolve();
          return;
        }

        const elapsed = timestamp - startTime;
        const rawProgress = Math.min(elapsed / duration, 1);

        setAnimation({
          command,
          progress: easeInOutCubic(rawProgress),
        });

        if (rawProgress < 1) {
          rafRef.current = window.requestAnimationFrame(frame);
          return;
        }

        setAnimation(null);
        onAnimationComplete?.(command.id);
        resolve();
      };

      setAnimation({
        command,
        progress: 0,
      });
      rafRef.current = window.requestAnimationFrame(frame);
    });
  });

  useEffect(() => {
    if (!animationCommand) {
      return;
    }

    queueRef.current = queueRef.current.then(() => {
      if (!mountedRef.current) {
        return Promise.resolve();
      }

      return runAnimation(animationCommand);
    });
  }, [animationCommand]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const highlightFace = animation?.command.move.face ?? activeMove?.face ?? null;
  const renderedState = animation?.command.fromState ?? cubeState;

  const cubies = useMemo(
    () => buildCubies(renderedState, highlightFace),
    [highlightFace, renderedState]
  );

  const { movingCubies, staticCubies } = useMemo(() => {
    if (!animation) {
      return {
        movingCubies: [] as CubieDescriptor[],
        staticCubies: cubies,
      };
    }

    return cubies.reduce(
      (result, cubie) => {
        if (isCubieInMoveLayer(cubie, animation.command.move)) {
          result.movingCubies.push(cubie);
        } else {
          result.staticCubies.push(cubie);
        }

        return result;
      },
      {
        movingCubies: [] as CubieDescriptor[],
        staticCubies: [] as CubieDescriptor[],
      }
    );
  }, [animation, cubies]);

  const animatedLayerRotation: Vector3Tuple = animation
    ? getRotationTuple(animation.command.move, animation.progress)
    : [0, 0, 0];

  return (
    <div className="solve-page__viewerCanvas" aria-label="Interactive 3D cube preview">
      <Canvas camera={{ position: [5.6, 5, 6.4], fov: 34 }} dpr={[1, 2]}>
        <color attach="background" args={['#0a0f18']} />
        <ambientLight intensity={0.95} />
        <directionalLight position={[8, 10, 7]} intensity={1.25} />
        <directionalLight position={[-6, -3, -6]} intensity={0.35} color="#9ab6ff" />
        <pointLight position={[0, 2, 5]} intensity={0.6} color="#ffffff" />

        <group rotation={[0.6, 0.68, 0]}>
          {staticCubies.map((cubie) => (
            <Cubie
              key={cubie.key}
              cubePosition={cubie.cubePosition}
              stickers={cubie.stickers}
            />
          ))}

          {animation ? (
            <group rotation={animatedLayerRotation}>
              {movingCubies.map((cubie) => (
                <Cubie
                  key={cubie.key}
                  cubePosition={cubie.cubePosition}
                  stickers={cubie.stickers}
                />
              ))}
            </group>
          ) : null}
        </group>

        <OrbitControls
          enableDamping
          enablePan={false}
          enableZoom={false}
          minPolarAngle={0.55}
          maxPolarAngle={2.25}
        />
      </Canvas>
    </div>
  );
}
