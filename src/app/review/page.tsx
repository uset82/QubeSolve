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
  createCubeStateFromScans,
  cubeStateToString,
  type CubeState,
} from "@/lib/cubeState";
import { loadScanSession, saveScanSession } from "@/lib/scanSession";
import { saveSolveSession } from "@/lib/solveSession";
import { validateCubeState } from "@/lib/validation";
import "@/styles/review.css";

type SelectedFacelet = {
  face: Face;
  index: number;
};

function createInitialCubeState(): CubeState | null {
  const session = loadScanSession();
  const scannedFaces = session?.scannedFaces ?? {};

  const hasAllFaces = SCAN_ORDER.every((face) => Array.isArray(scannedFaces[face]));
  if (!hasAllFaces) {
    return null;
  }

  return createCubeStateFromScans(
    SCAN_ORDER.map((face) => ({
      face,
      colors: scannedFaces[face]!,
    }))
  );
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
  const [cubeState, setCubeState] = useState<CubeState | null>(createInitialCubeState);
  const [selectedColor, setSelectedColor] = useState<CubeColor>("green");
  const [selectedFacelet, setSelectedFacelet] = useState<SelectedFacelet | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const validation = useMemo(() => {
    if (!cubeState) {
      return {
        valid: false,
        errors: [
          {
            type: "color_count" as const,
            message: "No complete cube scan was found yet.",
          },
        ],
      };
    }

    return validateCubeState(cubeState);
  }, [cubeState]);

  const facelets = useMemo(() => {
    if (!cubeState || !validation.valid) {
      return null;
    }

    return cubeStateToString(cubeState);
  }, [cubeState, validation.valid]);

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
    if (!cubeState || !facelets || !validation.valid) {
      return;
    }

    setLocalError(null);

    try {
      const solution = await solve(facelets);
      saveSolveSession({
        cubeState,
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
          <CubeNet2D
            cubeState={cubeState}
            editable
            selectedColor={selectedColor}
            selectedFacelet={selectedFacelet}
            onSelectColor={setSelectedColor}
            onFaceletClick={handleFaceletClick}
          />
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
        >
          {validation.valid
            ? "Cube state looks valid."
            : `${validation.errors.length} issue${validation.errors.length === 1 ? "" : "s"} found.`}
        </div>

        {!validation.valid && (
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

        {(localError || solverError) && (
          <div className="review-page__solveError">{localError || solverError}</div>
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
        </div>
      </section>
    </main>
  );
}
