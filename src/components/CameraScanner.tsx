"use client";

import {
  forwardRef,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { useCamera } from "@/hooks/useCamera";
import Button from "@/components/ui/Button";
import {
  CAMERA_PROCESS_INTERVAL,
  COLOR_CSS_MAP,
  CUBE_COLORS,
  type CubeColor,
  type Face,
} from "@/lib/constants";
import {
  calculateGridPositions,
  detectFaceColors,
  loadCustomThresholds,
  type ColorDetectionResult,
  type GridCell,
} from "@/lib/colorDetection";

interface CameraScannerProps {
  activeFace: Face;
  onDetectionChange?: (detections: ColorDetectionResult[]) => void;
  onUseVisionAssist?: () => void;
  onPreviewCellClick?: (index: number) => void;
  onPreviewColorPick?: (color: CubeColor) => void;
  onPreviewReset?: () => void;
  previewColors?: ReadonlyArray<CubeColor | null>;
  previewSelectedIndex?: number | null;
  showVisionAssist?: boolean;
  visionAssistMessage?: string | null;
  visionAssistPending?: boolean;
}

function createEmptyDetections(): ColorDetectionResult[] {
  return Array.from({ length: 9 }, () => ({
    color: "unknown" as const,
    confidence: 0,
    hsv: { h: 0, s: 0, v: 0 },
    rgb: { r: 0, g: 0, b: 0 },
  }));
}

function haveDetectionsMeaningfullyChanged(
  previous: ColorDetectionResult[],
  next: ColorDetectionResult[]
): boolean {
  if (previous.length !== next.length) {
    return true;
  }

  return previous.some((previousDetection, index) => {
    const nextDetection = next[index];

    return (
      previousDetection.color !== nextDetection.color ||
      Math.abs(previousDetection.confidence - nextDetection.confidence) > 0.04
    );
  });
}

export interface CameraScannerHandle {
  captureFrameDataUrl: () => string | null;
}

const AI_ASSIST_MAX_IMAGE_DIMENSION = 720;

const CameraScanner = forwardRef<CameraScannerHandle, CameraScannerProps>(
  function CameraScanner(
    {
      activeFace,
      onDetectionChange,
      onUseVisionAssist,
      onPreviewCellClick,
      onPreviewColorPick,
      onPreviewReset,
      previewColors,
      previewSelectedIndex = null,
      showVisionAssist = false,
      visionAssistMessage = null,
      visionAssistPending = false,
    },
    ref
  ) {
    const {
      videoRef,
      canvasRef,
      error,
      isReady,
      isSupported,
      restartCamera,
    } = useCamera();
    const [detections, setDetections] = useState<ColorDetectionResult[]>(
      createEmptyDetections()
    );
    const [emptyDetections] = useState(createEmptyDetections);
    const [customThresholds] = useState(() => loadCustomThresholds() ?? undefined);
    const cellRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const detectionsRef = useRef<ColorDetectionResult[]>(emptyDetections);
    const averageConfidenceRef = useRef(0);
    const visibleDetections = isReady ? detections : emptyDetections;
    const displayPreviewColors = previewColors
      ? Array.from(previewColors)
      : visibleDetections.map((detection) =>
          detection.color === "unknown" ? null : detection.color
        );
    const emitDetectionChange = useEffectEvent(
      (nextDetections: ColorDetectionResult[]) => {
        onDetectionChange?.(nextDetections);
      }
    );

    useImperativeHandle(ref, () => ({
      captureFrameDataUrl: () => {
        const canvas = canvasRef.current;

        if (!canvas || canvas.width === 0 || canvas.height === 0) {
          return null;
        }

        const longestSide = Math.max(canvas.width, canvas.height);

        if (longestSide <= AI_ASSIST_MAX_IMAGE_DIMENSION) {
          return canvas.toDataURL("image/jpeg", 0.82);
        }

        const scale = AI_ASSIST_MAX_IMAGE_DIMENSION / longestSide;
        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = Math.max(1, Math.round(canvas.width * scale));
        exportCanvas.height = Math.max(1, Math.round(canvas.height * scale));

        const exportContext = exportCanvas.getContext("2d");
        if (!exportContext) {
          return canvas.toDataURL("image/jpeg", 0.82);
        }

        exportContext.drawImage(
          canvas,
          0,
          0,
          canvas.width,
          canvas.height,
          0,
          0,
          exportCanvas.width,
          exportCanvas.height
        );

        return exportCanvas.toDataURL("image/jpeg", 0.8);
      },
    }));

    useEffect(() => {
      if (isReady) {
        return;
      }

      detectionsRef.current = emptyDetections;
      averageConfidenceRef.current = 0;
      emitDetectionChange(emptyDetections);
    }, [emptyDetections, isReady]);

    useEffect(() => {
      if (!isReady) {
        return;
      }

      const measureGridCells = (canvas: HTMLCanvasElement): GridCell[] | null => {
        const video = videoRef.current;

        if (!video) {
          return null;
        }

        const frameRect = video.getBoundingClientRect();
        if (frameRect.width === 0 || frameRect.height === 0) {
          return null;
        }

        const scaleX = canvas.width / frameRect.width;
        const scaleY = canvas.height / frameRect.height;
        const measuredCells = cellRefs.current.map((cell) => {
          if (!cell) {
            return null;
          }

          const cellRect = cell.getBoundingClientRect();
          const x =
            (cellRect.left - frameRect.left + cellRect.width / 2) * scaleX;
          const y =
            (cellRect.top - frameRect.top + cellRect.height / 2) * scaleY;
          const sampleSize = Math.max(
            10,
            Math.floor(
              Math.min(cellRect.width * scaleX, cellRect.height * scaleY) * 0.42
            )
          );

          return {
            x: Math.round(x),
            y: Math.round(y),
            size: sampleSize,
          };
        });

        if (measuredCells.some((cell) => cell === null)) {
          return null;
        }

        return measuredCells as GridCell[];
      };

      const timer = window.setInterval(() => {
        const canvas = canvasRef.current;

        if (!canvas || canvas.width === 0 || canvas.height === 0) {
          return;
        }

        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          return;
        }

        const gridCells =
          measureGridCells(canvas) ??
          calculateGridPositions(canvas.width, canvas.height, 0.78);

        const nextDetections = detectFaceColors(
          context,
          gridCells,
          customThresholds
        );

        const confidence =
          nextDetections.reduce((total, item) => total + item.confidence, 0) /
          nextDetections.length;

        if (
          haveDetectionsMeaningfullyChanged(detectionsRef.current, nextDetections)
        ) {
          detectionsRef.current = nextDetections;
          setDetections(nextDetections);
          emitDetectionChange(nextDetections);
        }

        if (Math.abs(averageConfidenceRef.current - confidence) > 0.01) {
          averageConfidenceRef.current = confidence;
        }
      }, CAMERA_PROCESS_INTERVAL);

      return () => {
        window.clearInterval(timer);
      };
    }, [canvasRef, customThresholds, isReady, videoRef]);

    return (
      <section
        className="scan-stage glass"
        aria-label={`Scanner for face ${activeFace}`}
      >
        <div className="scan-stage__frame">
          <video
            ref={videoRef}
            className="scan-stage__video"
            autoPlay
            muted
            playsInline
          />
          <div className="scan-stage__overlay" aria-hidden="true">
            <div className="scan-stage__grid">
              {Array.from({ length: 9 }, (_, index) => {
                const cell = visibleDetections[index];
                const background =
                  cell?.color && cell.color !== "unknown"
                    ? COLOR_CSS_MAP[cell.color]
                    : "rgba(255, 255, 255, 0.04)";

                return (
                  <span
                    key={`grid-cell-${index}`}
                    className="scan-stage__cell"
                    ref={(node) => {
                      cellRefs.current[index] = node;
                    }}
                    style={{ backgroundColor: background }}
                  />
                );
              })}
            </div>
          </div>
          <canvas ref={canvasRef} className="scan-stage__canvas" aria-hidden="true" />
        </div>

        <div className="scan-stage__footer">
          {error && (
            <p className="scan-stage__status scan-stage__status--error">{error}</p>
          )}

          <div className="scan-stage__preview" aria-label="Live detected colors">
            {displayPreviewColors.map((knownColor, index) => {
              return (
                <button
                  key={`preview-${index}`}
                  type="button"
                  className={`scan-stage__preview-cell${
                    onPreviewCellClick ? " scan-stage__preview-cell--interactive" : ""
                  }${
                    previewSelectedIndex === index
                      ? " scan-stage__preview-cell--selected"
                      : ""
                  }`}
                  style={{
                    backgroundColor: !knownColor
                      ? "rgba(255, 255, 255, 0.06)"
                      : COLOR_CSS_MAP[knownColor],
                  }}
                  title={knownColor ?? "Unknown"}
                  onClick={() => onPreviewCellClick?.(index)}
                  aria-label={`Sticker ${index + 1}: ${knownColor ?? "unknown"}`}
                  aria-pressed={previewSelectedIndex === index}
                />
              );
            })}
          </div>

          {onPreviewColorPick && (
            <div className="scan-stage__editor">
              <p className="scan-stage__editorHint">
                {previewSelectedIndex === null
                  ? "Tap a sticker to correct it."
                  : `Editing sticker ${previewSelectedIndex + 1}. Choose the matching color.`}
              </p>
              <div className="scan-stage__palette" aria-label="Quick color correction">
                {CUBE_COLORS.map((color) => (
                  <button
                    key={`palette-${color}`}
                    type="button"
                    className="scan-stage__paletteButton"
                    onClick={() => onPreviewColorPick(color)}
                    disabled={previewSelectedIndex === null}
                    aria-label={`Set sticker to ${color}`}
                  >
                    <span
                      className="scan-stage__paletteSwatch"
                      style={{ backgroundColor: COLOR_CSS_MAP[color] }}
                    />
                    <span>{color}</span>
                  </button>
                ))}
                {onPreviewReset && (
                  <button
                    type="button"
                    className="scan-stage__paletteButton scan-stage__paletteButton--ghost"
                    onClick={onPreviewReset}
                  >
                    Clear edits
                  </button>
                )}
              </div>
            </div>
          )}

          {(!isSupported || error) && (
            <div className="scan-stage__fallback">
              <Button variant="secondary" onClick={restartCamera}>
                Retry camera
              </Button>
              <Button href="/manual" variant="ghost">
                Use manual entry
              </Button>
            </div>
          )}

          {onUseVisionAssist &&
            (showVisionAssist || visionAssistPending || visionAssistMessage) && (
              <div className="scan-stage__assist">
                <Button
                  variant="secondary"
                  onClick={onUseVisionAssist}
                  loading={visionAssistPending}
                  disabled={!isReady || visionAssistPending}
                  fullWidth
                >
                  {visionAssistPending ? "Analyzing frame..." : "Use AI assist"}
                </Button>

                {visionAssistMessage && (
                  <p className="scan-stage__assistMessage">{visionAssistMessage}</p>
                )}
              </div>
            )}
        </div>
      </section>
    );
  }
);

CameraScanner.displayName = "CameraScanner";

export default CameraScanner;
