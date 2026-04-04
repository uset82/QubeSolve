'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import CubeNet2D, { type CubeNetState } from '@/components/CubeNet2D';
import {
  FACE_CENTER_COLORS,
  SCAN_ORDER,
  type CubeColor,
  type Face,
} from '@/lib/constants';
import { loadScanSession, saveScanSession } from '@/lib/scanSession';
import '@/styles/manual.css';

type SelectedFacelet = {
  face: Face;
  index: number;
};

function createEmptyFace(face: Face): Array<CubeColor | null> {
  return Array.from({ length: 9 }, (_, index) =>
    index === 4 ? FACE_CENTER_COLORS[face] : null
  );
}

function createInitialManualState(): CubeNetState {
  const savedFaces = loadScanSession()?.scannedFaces ?? {};

  return {
    U: savedFaces.U ? [...savedFaces.U] : createEmptyFace('U'),
    D: savedFaces.D ? [...savedFaces.D] : createEmptyFace('D'),
    F: savedFaces.F ? [...savedFaces.F] : createEmptyFace('F'),
    B: savedFaces.B ? [...savedFaces.B] : createEmptyFace('B'),
    L: savedFaces.L ? [...savedFaces.L] : createEmptyFace('L'),
    R: savedFaces.R ? [...savedFaces.R] : createEmptyFace('R'),
  };
}

function countFilledFacelets(cubeState: CubeNetState): number {
  return SCAN_ORDER.reduce((total, face) => {
    return total + cubeState[face].filter((color) => color !== null).length;
  }, 0);
}

export default function ManualPage() {
  const router = useRouter();
  const [cubeState, setCubeState] = useState<CubeNetState>(createInitialManualState);
  const [selectedColor, setSelectedColor] = useState<CubeColor>('green');
  const [selectedFacelet, setSelectedFacelet] = useState<SelectedFacelet | null>(null);

  const filledCount = useMemo(() => countFilledFacelets(cubeState), [cubeState]);
  const isComplete = filledCount === 54;

  const handleFaceletClick = (face: Face, index: number) => {
    if (index === 4) {
      return;
    }

    setCubeState((currentState) => ({
      ...currentState,
      [face]: currentState[face].map((color, currentIndex) =>
        currentIndex === index ? selectedColor : color
      ),
    }));
    setSelectedFacelet({ face, index });
  };

  const handleReset = () => {
    setCubeState(createInitialManualState());
    setSelectedFacelet(null);
  };

  const handleContinue = () => {
    if (!isComplete) {
      return;
    }

    saveScanSession({
      U: [...cubeState.U] as CubeColor[],
      D: [...cubeState.D] as CubeColor[],
      F: [...cubeState.F] as CubeColor[],
      B: [...cubeState.B] as CubeColor[],
      L: [...cubeState.L] as CubeColor[],
      R: [...cubeState.R] as CubeColor[],
    });
    router.push('/review');
  };

  return (
    <main className="manual-page route-shell">
      <header className="route-shell__header">
        <Link href="/" className="route-shell__back">
          Back
        </Link>
        <div>
          <p className="route-shell__eyebrow">Phase 3 · Manual Entry</p>
          <h1 className="route-shell__title">Enter Cube Colors</h1>
        </div>
      </header>

      <section className="route-shell__panel">
        <div className="manual-page__hero">
          <div className="route-shell__section-header">
            <h2 className="route-shell__section-title">Tap To Fill Stickers</h2>
            <p className="route-shell__copy">
              Choose a color, then tap any non-center sticker. Center stickers stay locked to the standard cube scheme.
            </p>
          </div>
          <span
            className={`manual-page__status${
              isComplete ? ' manual-page__status--ready' : ''
            }`}
          >
            {filledCount}/54 filled
          </span>
        </div>

        <CubeNet2D
          cubeState={cubeState}
          editable
          selectedColor={selectedColor}
          selectedFacelet={selectedFacelet}
          onSelectColor={setSelectedColor}
          onFaceletClick={handleFaceletClick}
        />

        <p className="manual-page__tip">
          Tip: the saved scan session is used as a starting point when available, so you can mix camera capture with manual cleanup.
        </p>

        <div className="route-shell__actions">
          <button type="button" className="button button--primary" onClick={handleContinue} disabled={!isComplete}>
            Continue to review
          </button>
          <button type="button" className="button button--secondary" onClick={handleReset}>
            Reset manual grid
          </button>
          <Link href="/scan" className="button button--ghost">
            Use camera instead
          </Link>
        </div>
      </section>
    </main>
  );
}
