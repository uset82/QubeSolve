"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

import { useCamera } from "@/hooks/useCamera";
import Button from "@/components/ui/Button";
import {
  CAMERA_PROCESS_INTERVAL,
  COLOR_CSS_MAP,
  type Face,
} from "@/lib/constants";
import {
  calculateGridPositions,
  detectFaceColors,
  loadCustomThresholds,
  type ColorDetectionResult,
} from "@/lib/colorDetection";

interface CameraScannerProps {
  activeFace: Face;
  onDetectionChange?: (detections: ColorDetectionResult[]) => void;
  onUseVisionAssist?: () => void;
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

export interface CameraScannerHandle {
  captureFrameDataUrl: () => string | null;
}

const CameraScanner = forwardRef<CameraScannerHandle, CameraScannerProps>(
  function CameraScanner(
    {
      activeFace,
      onDetectionChange,
      onUseVisionAssist,
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
      stream,
    } = useCamera();
    const [detections, setDetections] = useState<ColorDetectionResult[]>(
      createEmptyDetections()
    );
    const [emptyDetections] = useState(createEmptyDetections);
    const [averageConfidence, setAverageConfidence] = useState(0);
    const [customThresholds] = useState(() => loadCustomThresholds() ?? undefined);
    const visibleDetections = isReady ? detections : emptyDetections;

    useImperativeHandle(ref, () => ({
      captureFrameDataUrl: () => {
        const canvas = canvasRef.current;

        if (!canvas || canvas.width === 0 || canvas.height === 0) {
          return null;
        }

        return canvas.toDataURL("image/jpeg", 0.92);
      },
    }));

    useEffect(() => {
      onDetectionChange?.(visibleDetections);
    }, [onDetectionChange, visibleDetections]);

    useEffect(() => {
      if (!isReady) {
        return;
      }

      const timer = window.setInterval(() => {
        const canvas = canvasRef.current;

        if (!canvas || canvas.width === 0 || canvas.height === 0) {
          return;
        }

        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          return;
        }

        const nextDetections = detectFaceColors(
          context,
          calculateGridPositions(canvas.width, canvas.height),
          customThresholds
        );

        const confidence =
          nextDetections.reduce((total, item) => total + item.confidence, 0) /
          nextDetections.length;

        setDetections(nextDetections);
        setAverageConfidence(confidence);
      }, CAMERA_PROCESS_INTERVAL);

      return () => {
        window.clearInterval(timer);
      };
    }, [canvasRef, customThresholds, isReady]);

    const readyClassName = error
      ? "scan-stage__status scan-stage__status--error"
      : isReady
        ? "scan-stage__status scan-stage__status--ready"
        : "scan-stage__status scan-stage__status--pending";

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
                    style={{ backgroundColor: background }}
                  />
                );
              })}
            </div>
          </div>
          <canvas ref={canvasRef} className="scan-stage__canvas" aria-hidden="true" />
        </div>

        <div className="scan-stage__footer">
          <div>
            <p className={readyClassName}>
              {error
                ? error
                : isReady
                  ? `Camera live. Average confidence ${Math.round(
                      averageConfidence * 100
                    )}%.`
                  : "Starting camera feed..."}
            </p>
            <p className="scan-stage__hint">
              Center the cube face inside the grid and keep it steady before
              confirming.
            </p>
          </div>

          <div className="scan-stage__preview" aria-label="Live detected colors">
            {visibleDetections.map((detection, index) => {
              const knownColor =
                detection.color === "unknown" ? null : detection.color;

              return (
                <span
                  key={`preview-${index}`}
                  className="scan-stage__preview-cell"
                  style={{
                    backgroundColor: !knownColor
                      ? "rgba(255, 255, 255, 0.06)"
                      : COLOR_CSS_MAP[knownColor],
                  }}
                  title={knownColor ?? "Unknown"}
                />
              );
            })}
          </div>

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
                >
                  {visionAssistPending ? "Analyzing frame..." : "Use AI assist"}
                </Button>

                {visionAssistMessage && (
                  <p className="scan-stage__assistMessage">{visionAssistMessage}</p>
                )}
              </div>
            )}

          <p className="scan-stage__meta">
            {stream ? "Rear camera preferred." : "Waiting for camera permission."}
          </p>
        </div>
      </section>
    );
  }
);

CameraScanner.displayName = "CameraScanner";

export default CameraScanner;
