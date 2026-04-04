"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import CameraScanner, {
  type CameraScannerHandle,
} from "@/components/CameraScanner";
import Button from "@/components/ui/Button";
import PageTransition from "@/components/ui/PageTransition";
import ProgressBar from "@/components/ui/ProgressBar";
import { type ColorDetectionResult } from "@/lib/colorDetection";
import {
  COLOR_CSS_MAP,
  type CubeColor,
  FACE_NAMES,
  SCAN_INSTRUCTIONS,
  SCAN_ORDER,
} from "@/lib/constants";
import {
  loadScanSession,
  type ScannedFacesMap,
  saveScanSession,
} from "@/lib/scanSession";
import {
  requestVisionAssist,
  type VisionAssistResult,
} from "@/lib/visionClient";
import "@/styles/scan.css";

function findNextFaceIndex(scannedFaces: ScannedFacesMap): number {
  const nextMissingIndex = SCAN_ORDER.findIndex((face) => !scannedFaces[face]);
  return nextMissingIndex === -1 ? SCAN_ORDER.length - 1 : nextMissingIndex;
}

function getDetectedColors(
  detections: ColorDetectionResult[]
): CubeColor[] | null {
  if (detections.length !== 9) {
    return null;
  }

  if (detections.some((item) => item.color === "unknown")) {
    return null;
  }

  return detections.map((item) => item.color) as CubeColor[];
}

function createVisionDetections(
  colors: CubeColor[],
  confidence: number
): ColorDetectionResult[] {
  return colors.map((color) => ({
    color,
    confidence,
    hsv: { h: 0, s: 0, v: 0 },
    rgb: { r: 0, g: 0, b: 0 },
  }));
}

export default function ScanPage() {
  const router = useRouter();
  const scannerRef = useRef<CameraScannerHandle>(null);
  const [scannedFaces, setScannedFaces] = useState<ScannedFacesMap>(
    () => loadScanSession()?.scannedFaces ?? {}
  );
  const [currentFaceIndex, setCurrentFaceIndex] = useState(() =>
    findNextFaceIndex(loadScanSession()?.scannedFaces ?? {})
  );
  const [liveDetections, setLiveDetections] = useState<ColorDetectionResult[]>([]);
  const [visionAssist, setVisionAssist] = useState<VisionAssistResult | null>(null);
  const [visionAssistError, setVisionAssistError] = useState<string | null>(null);
  const [visionAssistPending, setVisionAssistPending] = useState(false);

  const currentFace = SCAN_ORDER[currentFaceIndex];
  const confirmedFaces = SCAN_ORDER.filter((face) => scannedFaces[face]);
  const effectiveDetections = visionAssist
    ? createVisionDetections(visionAssist.colors, visionAssist.confidence)
    : liveDetections;
  const detectedColors = getDetectedColors(effectiveDetections);
  const allFacesCaptured = confirmedFaces.length === SCAN_ORDER.length;
  const liveAverageConfidence =
    liveDetections.length > 0
      ? liveDetections.reduce((sum, item) => sum + item.confidence, 0) /
        liveDetections.length
      : 0;
  const averageConfidence =
    effectiveDetections.length > 0
      ? effectiveDetections.reduce((sum, item) => sum + item.confidence, 0) /
        effectiveDetections.length
      : 0;
  const showVisionAssist =
    liveDetections.length > 0 &&
    (!getDetectedColors(liveDetections) || liveAverageConfidence < 0.7);

  useEffect(() => {
    setVisionAssist(null);
    setVisionAssistError(null);
  }, [currentFace]);

  const statusMessage = useMemo(() => {
    if (visionAssist) {
      return `AI assist read this face at ${Math.round(
        visionAssist.confidence * 100
      )}% confidence. Confirm it only if the preview looks right.`;
    }

    if (effectiveDetections.length === 0) {
      return "Waiting for the camera feed to stabilize.";
    }

    if (!detectedColors) {
      return "Some stickers are still ambiguous. Adjust the cube or lighting.";
    }

    if (averageConfidence < 0.65) {
      return "Detection is usable but low confidence. Hold steady for a cleaner read.";
    }

    return "Detection looks stable. You can confirm this face.";
  }, [averageConfidence, detectedColors, effectiveDetections.length, visionAssist]);

  const statusClassName = visionAssist
    ? "scan-page__status scan-page__status--ready"
    : !detectedColors
      ? "scan-page__status scan-page__status--warn"
      : averageConfidence < 0.65
        ? "scan-page__status scan-page__status--soft"
        : "scan-page__status scan-page__status--ready";

  const handleConfirmFace = () => {
    if (!detectedColors) {
      return;
    }

    const nextScannedFaces = {
      ...scannedFaces,
      [currentFace]: detectedColors,
    };

    setScannedFaces(nextScannedFaces);
    saveScanSession(nextScannedFaces);
    setVisionAssist(null);
    setVisionAssistError(null);

    const nextIndex = findNextFaceIndex(nextScannedFaces);
    const everythingCaptured = SCAN_ORDER.every((face) => nextScannedFaces[face]);

    if (everythingCaptured) {
      router.push("/review");
      return;
    }

    setCurrentFaceIndex(nextIndex);
  };

  const handleUseVisionAssist = async () => {
    const imageDataUrl = scannerRef.current?.captureFrameDataUrl();

    if (!imageDataUrl) {
      setVisionAssistError("The current camera frame is not ready for AI analysis yet.");
      return;
    }

    setVisionAssistPending(true);
    setVisionAssistError(null);

    try {
      const result = await requestVisionAssist(imageDataUrl, currentFace);
      setVisionAssist(result);
    } catch (error) {
      setVisionAssist(null);
      setVisionAssistError(
        error instanceof Error ? error.message : "AI detection could not analyze this face."
      );
    } finally {
      setVisionAssistPending(false);
    }
  };

  return (
    <PageTransition>
      <main className="scan-page route-shell">
        <header className="route-shell__header">
          <Link href="/" className="route-shell__back">
            Back
          </Link>
          <div>
            <p className="route-shell__eyebrow">Phase 1 · Camera Scanner</p>
            <h1 className="route-shell__title">Scan Your Cube</h1>
          </div>
        </header>

        <section className="route-shell__panel scan-page__panel">
          <div className="scan-page__summary">
            <div>
              <p className="scan-page__counter">
                Face {Math.min(currentFaceIndex + 1, 6)} of 6
              </p>
              <h2 className="scan-page__face-title">{FACE_NAMES[currentFace]}</h2>
            </div>
            <span className="route-shell__badge">
              {confirmedFaces.length}/6 captured
            </span>
          </div>

          <p className="scan-page__instruction">{SCAN_INSTRUCTIONS[currentFace]}</p>

          <ProgressBar
            label="Capture progress"
            max={SCAN_ORDER.length}
            value={confirmedFaces.length}
          />

          <div className="scan-page__progress" aria-label="Scanned faces">
            {SCAN_ORDER.map((face, index) => {
              const isDone = Boolean(scannedFaces[face]);
              const isActive = face === currentFace;

              return (
                <button
                  key={face}
                  type="button"
                  className={`scan-page__face-chip${
                    isActive ? " scan-page__face-chip--active" : ""
                  }${isDone ? " scan-page__face-chip--done" : ""}`}
                  onClick={() => setCurrentFaceIndex(index)}
                >
                  {face}
                </button>
              );
            })}
          </div>

          <CameraScanner
            ref={scannerRef}
            activeFace={currentFace}
            onDetectionChange={setLiveDetections}
            onUseVisionAssist={handleUseVisionAssist}
            showVisionAssist={showVisionAssist}
            visionAssistPending={visionAssistPending}
            visionAssistMessage={
              visionAssistError
                ? visionAssistError
                : visionAssist
                  ? `AI assist used ${visionAssist.model}. ${visionAssist.notes}`
                  : showVisionAssist
                    ? "Low confidence detected. AI assist can analyze the current frame."
                    : null
            }
          />

          <div className={statusClassName}>{statusMessage}</div>

          {visionAssist && (
            <div className="scan-page__assistCard">
              <div className="scan-page__assistHeader">
                <strong>AI Assist Ready</strong>
                <span>{Math.round(visionAssist.confidence * 100)}% confidence</span>
              </div>
              <p className="route-shell__copy">{visionAssist.notes}</p>
              <code className="scan-page__assistMeta">{visionAssist.model}</code>
            </div>
          )}

          <div className="scan-page__actions">
            <Button
              variant="primary"
              onClick={handleConfirmFace}
              disabled={!detectedColors}
            >
              Confirm {FACE_NAMES[currentFace]}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setCurrentFaceIndex(Math.max(0, currentFaceIndex - 1))}
              disabled={currentFaceIndex === 0}
            >
              Previous face
            </Button>
            {visionAssist && (
              <Button
                variant="ghost"
                onClick={() => {
                  setVisionAssist(null);
                  setVisionAssistError(null);
                }}
              >
                Clear AI result
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => router.push("/review")}
              disabled={!allFacesCaptured}
            >
              Review capture
            </Button>
          </div>
        </section>

        <section className="route-shell__panel">
          <div className="route-shell__section-header">
            <h2 className="route-shell__section-title">Captured Faces</h2>
            <p className="route-shell__copy">
              Tap a captured face to jump back and re-scan it.
            </p>
          </div>

          <div className="scan-page__captured-list">
            {SCAN_ORDER.map((face, index) => {
              const colors = scannedFaces[face];

              return (
                <button
                  key={`captured-${face}`}
                  type="button"
                  className="scan-page__captured-card"
                  onClick={() => setCurrentFaceIndex(index)}
                >
                  <div className="scan-page__captured-header">
                    <strong>{face}</strong>
                    <span>{colors ? "Captured" : "Pending"}</span>
                  </div>
                  <div className="scan-page__captured-grid">
                    {Array.from({ length: 9 }, (_, colorIndex) => {
                      const color = colors?.[colorIndex];
                      return (
                        <span
                          key={`${face}-${colorIndex}`}
                          className="scan-page__captured-cell"
                          style={{
                            backgroundColor: color
                              ? COLOR_CSS_MAP[color]
                              : "rgba(255,255,255,0.06)",
                          }}
                        />
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </PageTransition>
  );
}
