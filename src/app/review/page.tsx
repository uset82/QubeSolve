"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import CubeNet2D from "@/components/CubeNet2D";
import { useSolver } from "@/hooks/useSolver";
import {
  FACE_CENTER_COLORS,
  SCAN_ORDER,
  type CubeColor,
  type Face,
} from "@/lib/constants";
import {
  cloneCubeState,
  convertUiCubeStateToCanonical,
  createCubeStateFromScans,
  cubeStateToString,
  type CubeState,
} from "@/lib/cubeState";
import { clearScanSession, loadScanSession, saveScanSession } from "@/lib/scanSession";
import { clearSolveSession, saveSolveSession } from "@/lib/solveSession";
import { validateCubeState } from "@/lib/validation";
import "@/styles/review.css";

type SelectedFacelet = {
  face: Face;
  index: number;
};

type InitialReviewState = {
  cubeState: CubeState | null;
};

function createInitialCubeState(): InitialReviewState {
  const session = loadScanSession();
  const scannedFaces = session?.scannedFaces ?? {};

  const hasAllFaces = SCAN_ORDER.every((face) => Array.isArray(scannedFaces[face]));
  if (!hasAllFaces) {
    return {
      cubeState: null,
    };
  }

  const rawScans = SCAN_ORDER.map((face) => ({
    face,
    colors: scannedFaces[face]!,
  }));
  return {
    cubeState: createCubeStateFromScans(rawScans),
  };
}

function cubeStateToScannedFaces(cubeState: CubeState) {
  return {
    U: [...cubeState.U],
    D: [...cubeState.D],
    F: [...cubeState.F],
    B: [...cubeState.B],
    L: [...cubeState.L],
    R: [...cubeState.R],
  };
}

function applyFaceletColor(
  cubeState: CubeState,
  face: Face,
  index: number,
  color: CubeColor
): CubeState {
  const nextState = cloneCubeState(cubeState);
  nextState[face][index] = color;
  return nextState;
}

export default function ReviewPage() {
  const router = useRouter();
  const { solve, isInitialized, isSolving, error: solverError } = useSolver();
  const [initialReviewState] = useState<InitialReviewState>(createInitialCubeState);
  const [cubeState, setCubeState] = useState<CubeState | null>(
    initialReviewState.cubeState
  );
  const [selectedColor, setSelectedColor] = useState<CubeColor>("green");
  const [selectedFacelet, setSelectedFacelet] = useState<SelectedFacelet | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(true);
  const canonicalCubeState = useMemo(
    () => (cubeState ? convertUiCubeStateToCanonical(cubeState) : null),
    [cubeState]
  );

  const validation = useMemo(() => {
    if (!canonicalCubeState) {
      return {
        valid: false,
        errors: [
          {
            type: "color_count" as const,
            message: "No complete cube scan was found yet.",
          },
        ],
        suspectFacelets: [],
      };
    }

    return validateCubeState(canonicalCubeState);
  }, [canonicalCubeState]);

  const facelets = useMemo(() => {
    if (!canonicalCubeState || !validation.valid) {
      return null;
    }

    return cubeStateToString(canonicalCubeState);
  }, [canonicalCubeState, validation.valid]);

  const handleFaceletClick = (face: Face, index: number) => {
    if (!cubeState || index === 4) {
      return;
    }

    const nextState = applyFaceletColor(cubeState, face, index, selectedColor);
    setCubeState(nextState);
    setSelectedFacelet({ face, index });
    setLocalError(null);
    saveScanSession(cubeStateToScannedFaces(nextState));
  };

  const handleResetCenters = () => {
    if (!cubeState) {
      return;
    }

    const nextState = cloneCubeState(cubeState);
    (Object.keys(FACE_CENTER_COLORS) as Face[]).forEach((face) => {
      nextState[face][4] = FACE_CENTER_COLORS[face];
    });
    setCubeState(nextState);
    setLocalError(null);
    saveScanSession(cubeStateToScannedFaces(nextState));
  };

  const handleSolve = async () => {
    if (!cubeState || !canonicalCubeState || !facelets || !validation.valid) {
      return;
    }

    setLocalError(null);

    try {
      const solution = await solve(facelets);
      saveSolveSession({
        cubeState: canonicalCubeState,
        facelets,
        solution,
        createdAt: new Date().toISOString(),
      });
      router.push("/solve");
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "The solver could not process this cube."
      );
    }
  };

  const handleStartOver = () => {
    clearScanSession();
    clearSolveSession();
    router.push("/scan?fresh=1");
  };

  return (
    <main className="review-page route-shell">
      <header className="route-shell__header">
        <Link href="/scan" className="route-shell__back">
          Back
        </Link>
        <div>
          <p className="route-shell__eyebrow">Phase 2 · Review</p>
          <h1 className="route-shell__title">Review And Edit</h1>
        </div>
      </header>

      <section className="route-shell__panel">
        <div className="review-page__hero">
          <div>
            <h2 className="route-shell__section-title">Cube Net</h2>
            <p className="route-shell__copy">
              Tap a color, then tap any non-center sticker to correct the scan before solving.
            </p>
          </div>
          <div className="route-shell__actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={handleResetCenters}
              disabled={!cubeState}
            >
              Reset centers
            </button>
            <Link href="/scan" className="button button--ghost">
              Re-scan
            </Link>
          </div>
        </div>

        {cubeState ? (
          <div className="review-page__netContainer">
            <CubeNet2D
              cubeState={cubeState}
              editable
              selectedColor={selectedColor}
              selectedFacelet={selectedFacelet}
              suspectFacelets={validation.suspectFacelets}
              onSelectColor={setSelectedColor}
              onFaceletClick={handleFaceletClick}
            />
          </div>
        ) : (
          <div className="review-page__empty">
            <p className="route-shell__copy">
              No complete scan session was found. Scan all six faces first, or use manual entry.
            </p>
            <div className="route-shell__actions">
              <Link href="/scan" className="button button--primary">
                Open scanner
              </Link>
              <Link href="/manual" className="button button--secondary">
                Manual entry
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="route-shell__panel">
        <div className="route-shell__section-header">
          <h2 className="route-shell__section-title">Validation</h2>
          <p className="route-shell__copy">
            The cube must be physically legal before the solver can run.
          </p>
        </div>

        <div
          className={`review-page__validation${
            validation.valid ? " review-page__validation--valid" : " review-page__validation--invalid"
          }`}
          onClick={() => !validation.valid && setShowErrors(!showErrors)}
          style={{ cursor: validation.valid ? 'default' : 'pointer' }}
        >
          <span>
            {validation.valid
              ? "Cube state looks valid."
              : `${validation.errors.length} issue${validation.errors.length === 1 ? "" : "s"} found.`}
          </span>
          {!validation.valid && (
            <span className="review-page__chevron">
              {showErrors ? "▲" : "▼"}
            </span>
          )}
        </div>

        {!validation.valid && showErrors && (
          <ul className="review-page__errorList">
            {validation.errors.map((item, index) => (
              <li key={`${item.type}-${index}`} className="review-page__errorItem">
                {item.message}
              </li>
            ))}
          </ul>
        )}

        {facelets && (
          <div className="review-page__solverBlock">
            <p className="route-shell__eyebrow">Solver Input</p>
            <code className="review-page__solverCode">{facelets}</code>
          </div>
        )}
      </section>

      <footer className="review-page__footer">
        <div className="review-page__footerContent">
          {(localError || solverError) && (
            <div className="review-page__solveError review-page__solveError--sticky">
              {localError || solverError}
            </div>
          )}

          <div className="route-shell__actions">
            <button
              type="button"
              className="button button--primary"
              onClick={handleSolve}
              disabled={!cubeState || !validation.valid || !facelets || isSolving}
            >
              {isSolving
                ? "Solving..."
                : isInitialized
                  ? "Solve It"
                  : "Initialize Solver"}
            </button>
            <Link href="/scan" className="button button--secondary">
              Back to scan
            </Link>
            <button
              type="button"
              className="button button--ghost"
              onClick={handleStartOver}
            >
              Start over
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
