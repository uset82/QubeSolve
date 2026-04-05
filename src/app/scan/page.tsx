"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import CameraScanner, {
  type CameraScannerHandle,
} from "@/components/CameraScanner";
import PedagogicalRotationVisualizer from "@/components/PedagogicalRotationVisualizer";
import Button from "@/components/ui/Button";
import PageTransition from "@/components/ui/PageTransition";
import ProgressBar from "@/components/ui/ProgressBar";
import { type ColorDetectionResult } from "@/lib/colorDetection";
import {
  CENTER_COLOR_TO_FACE,
  COLOR_CSS_MAP,
  type CubeColor,
  FACE_CENTER_COLORS,
  FACE_NAMES,
  SCAN_INSTRUCTIONS,
  SCAN_ORDER,
  type Face,
} from "@/lib/constants";
import {
  clearScanSession,
  getScanSessionSnapshot,
  getServerScanSessionSnapshot,
  type ScannedFacesMap,
  saveScanSession,
  subscribeToScanSession,
} from "@/lib/scanSession";
import { clearSolveSession } from "@/lib/solveSession";
import { type VisionAssistResult, requestVisionAssist } from "@/lib/visionClient";
import { TRANSLATIONS } from "@/lib/translations";
import { useSpeech } from "@/hooks/useSpeech";
import ScanAssistantOverlay from "@/components/ScanAssistantOverlay";
import "@/styles/scan.css";

const AUTO_CAPTURE_HOLD_MS = 900;
const AUTO_CAPTURE_LOCKOUT_MS = 1200;
const AUTO_CAPTURE_MIN_CONFIDENCE = 0.78;
const DETECTION_LOCK_HOLD_MS = 280;
const AUTO_RESET_MIN_CONFIDENCE = 0.42;
const AUTO_RESET_HOLD_MS = 900;
const STICKERS_PER_FACE = 9;

function createManualStickerOverrides(): Array<CubeColor | null> {
  return Array.from({ length: STICKERS_PER_FACE }, () => null);
}

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

function getDetectionKey(face: Face, colors: CubeColor[]): string {
  return `${face}:${colors.join(",")}`;
}

function getPreviewColors(
  detections: ColorDetectionResult[]
): Array<CubeColor | null> {
  return Array.from({ length: STICKERS_PER_FACE }, (_, index) => {
    const color = detections[index]?.color;
    return color && color !== "unknown" ? color : null;
  });
}

function applyManualStickerOverrides(
  previewColors: ReadonlyArray<CubeColor | null>,
  overrides: ReadonlyArray<CubeColor | null>
): Array<CubeColor | null> {
  return previewColors.map((color, index) => overrides[index] ?? color);
}

function getCompletedColors(
  previewColors: ReadonlyArray<CubeColor | null>
): CubeColor[] | null {
  if (
    previewColors.length !== STICKERS_PER_FACE ||
    previewColors.some((color) => color === null)
  ) {
    return null;
  }

  return previewColors as CubeColor[];
}

export default function ScanPage() {
  const router = useRouter();
  const scannerRef = useRef<CameraScannerHandle>(null);
  const didApplyFreshStartRef = useRef(false);
  const autoCaptureRef = useRef({
    candidateKey: null as string | null,
    stableSince: 0,
    lockoutUntil: 0,
  });
  const detectionLockRef = useRef({
    candidateKey: null as string | null,
    stableSince: 0,
  });
  const recoveryRef = useRef({
    lostSince: 0,
  });
  const [freshStartRequested] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("fresh") === "1"
  );
  const [manualFaceIndex, setManualFaceIndex] = useState<number | null>(null);
  const scanSession = useSyncExternalStore(
    subscribeToScanSession,
    getScanSessionSnapshot,
    getServerScanSessionSnapshot
  );
  const effectiveScanSession =
    freshStartRequested && !didApplyFreshStartRef.current ? null : scanSession;
  const scannedFaces =
    effectiveScanSession?.scannedFaces ?? ({} satisfies ScannedFacesMap);
  const currentFaceIndex = manualFaceIndex ?? findNextFaceIndex(scannedFaces);
  const [liveDetections, setLiveDetections] = useState<ColorDetectionResult[]>([]);

  const handleUnlockPreview = useCallback(() => {
    setLockedPreviewColors(null);
    setManualStickerOverrides(createManualStickerOverrides());
    setSelectedStickerIndex(null);
    setVisionAssist(null);
    setVisionAssistError(null);
    setAutoCaptureProgress(0);
    detectionLockRef.current = {
      candidateKey: null,
      stableSince: 0,
    };
    recoveryRef.current.lostSince = 0;
  }, []);
  const [visionAssist, setVisionAssist] = useState<VisionAssistResult | null>(null);
  const [visionAssistError, setVisionAssistError] = useState<string | null>(null);
  const [visionAssistPending, setVisionAssistPending] = useState(false);
  const [autoCaptureProgress, setAutoCaptureProgress] = useState(0);
  const [autoCaptureMessage, setAutoCaptureMessage] = useState<string | null>(null);
  const [lockedPreviewColors, setLockedPreviewColors] = useState<
    Array<CubeColor | null> | null
  >(null);
  const [selectedStickerIndex, setSelectedStickerIndex] = useState<number | null>(
    null
  );
  const [manualStickerOverrides, setManualStickerOverrides] = useState<
    Array<CubeColor | null>
  >(createManualStickerOverrides);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const { speak, language, toggleLanguage, isEnabled, toggleEnabled } = useSpeech();
  const t = TRANSLATIONS[language];

  const currentFace = SCAN_ORDER[currentFaceIndex];
  const expectedCenterColor = FACE_CENTER_COLORS[currentFace];
  const confirmedFaces = useMemo(
    () => SCAN_ORDER.filter((face) => scannedFaces[face]),
    [scannedFaces]
  );
  const localDetectedColors = useMemo(
    () => getDetectedColors(liveDetections),
    [liveDetections]
  );
  const effectiveDetections = useMemo(
    () =>
      visionAssist
        ? createVisionDetections(visionAssist.colors, visionAssist.confidence)
        : liveDetections,
    [liveDetections, visionAssist]
  );
  const livePreviewColors = useMemo(
    () => getPreviewColors(effectiveDetections),
    [effectiveDetections]
  );
  const isPreviewLocked = lockedPreviewColors !== null;
  const basePreviewColors = useMemo(
    () => lockedPreviewColors ?? livePreviewColors,
    [livePreviewColors, lockedPreviewColors]
  );
  const editedPreviewColors = useMemo(
    () => applyManualStickerOverrides(basePreviewColors, manualStickerOverrides),
    [basePreviewColors, manualStickerOverrides]
  );
  const detectedColors = useMemo(
    () => getCompletedColors(editedPreviewColors),
    [editedPreviewColors]
  );
  const detectedFace = detectedColors
    ? CENTER_COLOR_TO_FACE[detectedColors[4]]
    : null;
  const localHasExpectedCenter =
    localDetectedColors !== null && localDetectedColors[4] === expectedCenterColor;
  const hasExpectedCenter =
    detectedColors !== null && detectedColors[4] === expectedCenterColor;
  const canConfirm = detectedColors !== null && hasExpectedCenter;
  const hasManualStickerOverrides = manualStickerOverrides.some(
    (color) => color !== null
  );
  const allFacesCaptured = confirmedFaces.length === SCAN_ORDER.length;
  const liveAverageConfidence = useMemo(
    () =>
      liveDetections.length > 0
        ? liveDetections.reduce((sum, item) => sum + item.confidence, 0) /
          liveDetections.length
        : 0,
    [liveDetections]
  );
  const averageConfidence = useMemo(
    () =>
      effectiveDetections.length > 0
        ? effectiveDetections.reduce((sum, item) => sum + item.confidence, 0) /
          effectiveDetections.length
        : 0,
    [effectiveDetections]
  );
  const showVisionAssist =
    liveDetections.length > 0 &&
    (!localDetectedColors || liveAverageConfidence < 0.7);

  const resetTransientCaptureState = useCallback((message: string | null = null) => {
    setLiveDetections([]);
    setVisionAssist(null);
    setVisionAssistError(null);
    setVisionAssistPending(false);
    setAutoCaptureProgress(0);
    setAutoCaptureMessage(message);
    setLockedPreviewColors(null);
    setSelectedStickerIndex(null);
    setManualStickerOverrides(createManualStickerOverrides());
    autoCaptureRef.current = {
      candidateKey: null,
      stableSince: 0,
      lockoutUntil: 0,
    };
    detectionLockRef.current = {
      candidateKey: null,
      stableSince: 0,
    };
  }, []);

  useEffect(() => {
    resetTransientCaptureState();
    speak(t.readyPrompt(currentFace));
  }, [currentFace, resetTransientCaptureState, speak, t]);

  useEffect(() => {
    if (!freshStartRequested || didApplyFreshStartRef.current) {
      return;
    }

    didApplyFreshStartRef.current = true;
    clearScanSession();
    clearSolveSession();
  }, [freshStartRequested]);

  const statusMessage = useMemo(() => {
    if (visionAssist) {
      if (!hasExpectedCenter && detectedColors) {
        return `AI assist sees a ${detectedColors[4]} center, but this step expects ${expectedCenterColor}. Rotate to the instructed face before confirming.`;
      }

      return null;
    }

    if (!detectedColors) {
      return "Some stickers are still ambiguous. Adjust the cube or lighting.";
    }

    if (!hasExpectedCenter) {
      return `This scan looks like ${FACE_NAMES[detectedFace!]}. Rotate to ${FACE_NAMES[currentFace]} or correct the read before this step can be saved.`;
    }

    if (isPreviewLocked && !hasManualStickerOverrides) {
      return "Colors locked. Confirm this face or tap a sticker to adjust it.";
    }

    if (hasManualStickerOverrides) {
      return "Manual correction active. Confirm when the 9 stickers match the cube face.";
    }

    return null;
  }, [
    detectedColors,
    detectedFace,
    expectedCenterColor,
    hasManualStickerOverrides,
    hasExpectedCenter,
    isPreviewLocked,
    visionAssist,
    currentFace,
  ]);

  // Voice feedback for mistakes
  useEffect(() => {
    if (!localDetectedColors) return;
    if (!localHasExpectedCenter && localDetectedColors[4]) {
      const detectedFace = CENTER_COLOR_TO_FACE[localDetectedColors[4]];
      if (detectedFace) {
        speak(t.wrongFaceWarning(detectedFace, currentFace));
      }
    }
  }, [localHasExpectedCenter, localDetectedColors, currentFace, speak, t]);

  const statusClassName = visionAssist
    ? hasExpectedCenter
      ? "scan-page__status scan-page__status--ready"
      : "scan-page__status scan-page__status--warn"
    : !detectedColors
      ? "scan-page__status scan-page__status--warn"
      : !hasExpectedCenter
        ? "scan-page__status scan-page__status--warn"
      : averageConfidence < 0.65
        ? "scan-page__status scan-page__status--soft"
        : "scan-page__status scan-page__status--ready";

  const commitFace = useCallback((
    targetFace: Face,
    colors: CubeColor[],
    source: "auto" | "manual" | "vision"
  ) => {
    const isReplacement = Boolean(scannedFaces[targetFace]);
    const nextScannedFaces = {
      ...scannedFaces,
      [targetFace]: colors,
    };

    saveScanSession(nextScannedFaces);
    setVisionAssist(null);
    setVisionAssistError(null);
    setAutoCaptureProgress(0);
    setAutoCaptureMessage(
      source === "auto"
        ? `${FACE_NAMES[targetFace]} captured automatically. Rotate to the next face.`
        : isReplacement
          ? `${FACE_NAMES[targetFace]} updated.`
          : `${FACE_NAMES[targetFace]} saved.`
    );
    setLockedPreviewColors(null);
    setSelectedStickerIndex(null);
    setManualStickerOverrides(createManualStickerOverrides());

    autoCaptureRef.current.lockoutUntil = performance.now() + AUTO_CAPTURE_LOCKOUT_MS;
    autoCaptureRef.current.candidateKey = null;
    autoCaptureRef.current.stableSince = 0;

    const nextIndex = findNextFaceIndex(nextScannedFaces);
    const everythingCaptured = SCAN_ORDER.every((face) => nextScannedFaces[face]);

    setManualFaceIndex(nextIndex);
    
    // Interstitial Success state
    setShowSuccessOverlay(true);
    speak(t.captureSuccess(targetFace, nextIndex !== -1 ? SCAN_ORDER[nextIndex] : null));
    
    setTimeout(() => {
      setShowSuccessOverlay(false);
      if (everythingCaptured) {
        router.push("/review");
      }
    }, 1800);
  }, [router, scannedFaces, speak, t]);

  const handleConfirmFace = () => {
    if (!canConfirm || !detectedColors) {
      return;
    }

    commitFace(currentFace, detectedColors, visionAssist ? "vision" : "manual");
  };

  useEffect(() => {
    if (
      visionAssist ||
      visionAssistPending ||
      hasManualStickerOverrides ||
      isPreviewLocked
    ) {
      setAutoCaptureProgress(0);
      return;
    }

    if (
      !localDetectedColors ||
      !localHasExpectedCenter ||
      liveAverageConfidence < AUTO_CAPTURE_MIN_CONFIDENCE
    ) {
      autoCaptureRef.current.candidateKey = null;
      autoCaptureRef.current.stableSince = 0;
      setAutoCaptureProgress(0);
      return;
    }

    const now = performance.now();

    if (now < autoCaptureRef.current.lockoutUntil) {
      setAutoCaptureProgress(0);
      return;
    }

    const candidateKey = getDetectionKey(currentFace, localDetectedColors);

    if (autoCaptureRef.current.candidateKey !== candidateKey) {
      autoCaptureRef.current.candidateKey = candidateKey;
      autoCaptureRef.current.stableSince = now;
      setAutoCaptureProgress(0);
      return;
    }

    const elapsed = now - autoCaptureRef.current.stableSince;
    const progress = Math.min(elapsed / AUTO_CAPTURE_HOLD_MS, 1);
    setAutoCaptureProgress((previous) =>
      Math.abs(previous - progress) > 0.01 ? progress : previous
    );

    if (progress >= 1) {
      commitFace(currentFace, localDetectedColors, "auto");
    }
  }, [
    commitFace,
    currentFace,
    hasManualStickerOverrides,
    isPreviewLocked,
    localDetectedColors,
    localHasExpectedCenter,
    liveAverageConfidence,
    visionAssist,
    visionAssistPending,
  ]);

  useEffect(() => {
    if (visionAssist) {
      detectionLockRef.current = {
        candidateKey: null,
        stableSince: 0,
      };
      setLockedPreviewColors([...visionAssist.colors]);
      return;
    }

    if (visionAssistPending || isPreviewLocked || hasManualStickerOverrides) {
      return;
    }

    if (!localDetectedColors || !localHasExpectedCenter) {
      detectionLockRef.current = {
        candidateKey: null,
        stableSince: 0,
      };
      return;
    }

    const now = performance.now();
    const candidateKey = getDetectionKey(currentFace, localDetectedColors);

    if (detectionLockRef.current.candidateKey !== candidateKey) {
      detectionLockRef.current = {
        candidateKey,
        stableSince: now,
      };
      return;
    }

    if (now - detectionLockRef.current.stableSince >= DETECTION_LOCK_HOLD_MS) {
      setLockedPreviewColors([...localDetectedColors]);
    }
  }, [
    currentFace,
    hasManualStickerOverrides,
    isPreviewLocked,
    localDetectedColors,
    localHasExpectedCenter,
    visionAssist,
    visionAssistPending,
  ]);

  /**
   * Watchdog: Auto-Unlock (Smart Recovery)
   * Automatically resumes live scanning if the target is lost or unstable.
   */
  useEffect(() => {
    if (
      !isPreviewLocked || 
      hasManualStickerOverrides || 
      visionAssist || 
      visionAssistPending
    ) {
      recoveryRef.current.lostSince = 0;
      return;
    }

    const isTargetLost = 
      !localDetectedColors || 
      !localHasExpectedCenter || 
      liveAverageConfidence < AUTO_RESET_MIN_CONFIDENCE;

    if (!isTargetLost) {
      recoveryRef.current.lostSince = 0;
      return;
    }

    const now = performance.now();
    if (recoveryRef.current.lostSince === 0) {
      recoveryRef.current.lostSince = now;
      return;
    }

    if (now - recoveryRef.current.lostSince >= AUTO_RESET_HOLD_MS) {
      handleUnlockPreview();
    }
  }, [
    isPreviewLocked,
    hasManualStickerOverrides,
    visionAssist,
    visionAssistPending,
    localDetectedColors,
    localHasExpectedCenter,
    liveAverageConfidence,
    handleUnlockPreview
  ]);

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

  const handlePreviewCellClick = (index: number) => {
    if (!isPreviewLocked) {
      setLockedPreviewColors([...livePreviewColors]);
    }

    setSelectedStickerIndex((current) => (current === index ? null : index));
  };

  const handlePreviewColorPick = (color: CubeColor) => {
    if (selectedStickerIndex === null) {
      return;
    }

    setManualStickerOverrides((current) =>
      current.map((value, index) =>
        index === selectedStickerIndex ? color : value
      )
    );
  };

  const handlePreviewReset = () => {
    setManualStickerOverrides(createManualStickerOverrides());
    setSelectedStickerIndex(null);
  };



  const handleStartOver = () => {
    clearScanSession();
    clearSolveSession();
    setManualFaceIndex(null);
    resetTransientCaptureState("Started a fresh scan. Capture the green face first.");
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
          
          <div className="assistant-toggles">
            <button 
              className={`assistant-toggle ${isEnabled ? 'assistant-toggle--active' : ''}`}
              onClick={toggleEnabled}
              title={isEnabled ? "Mute" : "Unmute"}
            >
              {isEnabled ? "🔊" : "🔇"}
            </button>
            <button 
              className="assistant-toggle assistant-toggle--lang"
              onClick={toggleLanguage}
            >
              {language === "en" ? "EN" : "ES"}
            </button>
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

          <PedagogicalRotationVisualizer currentFace={currentFace} />

          <div className="scan-page__cameraWrapper">
            <CameraScanner
              ref={scannerRef}
              activeFace={currentFace}
              onDetectionChange={setLiveDetections}
              onUseVisionAssist={handleUseVisionAssist}
              onPreviewCellClick={handlePreviewCellClick}
              onPreviewColorPick={handlePreviewColorPick}
              onPreviewReset={
                hasManualStickerOverrides ? handlePreviewReset : undefined
              }
              previewColors={editedPreviewColors}
              previewSelectedIndex={selectedStickerIndex}
              showVisionAssist={showVisionAssist}
              visionAssistPending={visionAssistPending}
              visionAssistMessage={
                visionAssistError
                  ? visionAssistError
                  : visionAssist
                    ? `AI assist used ${visionAssist.model}. ${visionAssist.notes}`
                    : null
              }
            />

            <ScanAssistantOverlay
              type={
                showSuccessOverlay ? "success" : 
                (!localHasExpectedCenter && localDetectedColors) ? "rotate" : 
                (autoCaptureProgress > 0) ? "hold" : "none"
              }
              message={
                showSuccessOverlay ? t.captureSuccess(currentFace, null).split('.')[0] :
                (!localHasExpectedCenter && localDetectedColors) ? t.wrongFaceWarning(CENTER_COLOR_TO_FACE[localDetectedColors[4]]!, currentFace) :
                (autoCaptureProgress > 0) ? t.holdSteady : ""
              }
              expectedColor={expectedCenterColor}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ProgressBar
              label="Capture progress"
              max={SCAN_ORDER.length}
              value={confirmedFaces.length}
            />

            <div className="scan-page__captureAssist">
              <div className="scan-page__captureAssistHeader">
                <strong>Auto-capture</strong>
                <span>
                  {localHasExpectedCenter &&
                  localDetectedColors &&
                  liveAverageConfidence >= AUTO_CAPTURE_MIN_CONFIDENCE
                    ? `${Math.round(autoCaptureProgress * 100)}%`
                    : "Waiting"}
                </span>
              </div>
              <ProgressBar
                label="Hold steady to save this face"
                max={100}
                value={
                  localHasExpectedCenter &&
                  localDetectedColors &&
                  liveAverageConfidence >= AUTO_CAPTURE_MIN_CONFIDENCE
                    ? Math.round(autoCaptureProgress * 100)
                    : 0
                }
                showNumbers={false}
              />
              <p className="route-shell__copy">
                {localDetectedColors && !localHasExpectedCenter
                  ? `Center ${localDetectedColors[4]}. Waiting for ${expectedCenterColor}.`
                  : liveAverageConfidence >= AUTO_CAPTURE_MIN_CONFIDENCE
                    ? "Hold steady to auto-save."
                    : "Stabilizing read."}
              </p>
              {autoCaptureMessage && (
                <div className="scan-page__autocaptureNotice">{autoCaptureMessage}</div>
              )}
            </div>

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
                    onClick={() => setManualFaceIndex(index)}
                  >
                    {face}
                  </button>
                );
              })}
            </div>
          </div>

          {statusMessage && <div className={statusClassName}>{statusMessage}</div>}

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
              disabled={!canConfirm}
            >
              Confirm Face Colors
            </Button>
            <Button
              variant="secondary"
              onClick={() => setManualFaceIndex(Math.max(0, currentFaceIndex - 1))}
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
                  setLockedPreviewColors(null);
                  setSelectedStickerIndex(null);
                }}
              >
                Clear AI result
              </Button>
            )}
            {isPreviewLocked && (
              <Button variant="ghost" onClick={handleUnlockPreview}>
                Resume live scan
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => router.push("/review")}
              disabled={!allFacesCaptured}
            >
              Review capture
            </Button>
            <Button variant="ghost" onClick={handleStartOver}>
              Start over
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
                  onClick={() => setManualFaceIndex(index)}
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
