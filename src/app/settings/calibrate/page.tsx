"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageTransition from "@/components/ui/PageTransition";
import ProgressBar from "@/components/ui/ProgressBar";
import { useCamera } from "@/hooks/useCamera";
import {
  buildThresholdsFromSamples,
  classifyColor,
  loadCustomThresholds,
  sampleCenterColor,
  saveCustomThresholds,
  type CalibrationSample,
  type CalibrationSamples,
} from "@/lib/colorDetection";
import {
  CAMERA_PROCESS_INTERVAL,
  COLOR_CSS_MAP,
  CUBE_COLORS,
  DEFAULT_HSV_THRESHOLDS,
  type CubeColor,
} from "@/lib/constants";
import "@/styles/settings.css";

function getNextColorToCapture(
  currentColor: CubeColor,
  samples: CalibrationSamples
): CubeColor {
  const currentIndex = CUBE_COLORS.indexOf(currentColor);

  for (let offset = 1; offset <= CUBE_COLORS.length; offset += 1) {
    const candidate = CUBE_COLORS[(currentIndex + offset) % CUBE_COLORS.length];

    if ((samples[candidate]?.length ?? 0) === 0) {
      return candidate;
    }
  }

  return currentColor;
}

export default function CalibratePage() {
  const {
    videoRef,
    canvasRef,
    error,
    isReady,
    restartCamera,
    stream,
  } = useCamera();
  const [selectedColor, setSelectedColor] = useState<CubeColor>("white");
  const [storedThresholds, setStoredThresholds] = useState(
    () => loadCustomThresholds() ?? DEFAULT_HSV_THRESHOLDS
  );
  const [samples, setSamples] = useState<CalibrationSamples>({});
  const [liveSample, setLiveSample] = useState<CalibrationSample | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

      setLiveSample(sampleCenterColor(context, canvas.width, canvas.height));
    }, CAMERA_PROCESS_INTERVAL);

    return () => {
      window.clearInterval(timer);
    };
  }, [canvasRef, isReady]);

  const sampledColorCount = CUBE_COLORS.filter(
    (color) => (samples[color]?.length ?? 0) > 0
  ).length;
  const totalSampleCount = CUBE_COLORS.reduce(
    (sum, color) => sum + (samples[color]?.length ?? 0),
    0
  );
  const previewThresholds = useMemo(() => {
    if (totalSampleCount === 0) {
      return storedThresholds;
    }

    return buildThresholdsFromSamples(samples, storedThresholds);
  }, [samples, storedThresholds, totalSampleCount]);
  const visibleLiveSample = isReady ? liveSample : null;
  const liveClassification = useMemo(() => {
    if (!visibleLiveSample) {
      return null;
    }

    return classifyColor(visibleLiveSample.hsv, previewThresholds);
  }, [previewThresholds, visibleLiveSample]);

  const handleCaptureSample = () => {
    if (!liveSample) {
      setMessage("Wait for the camera feed before capturing a sample.");
      return;
    }

    setSamples((currentSamples) => {
      const nextSamples = {
        ...currentSamples,
        [selectedColor]: [...(currentSamples[selectedColor] ?? []), liveSample.hsv],
      };
      setSelectedColor(getNextColorToCapture(selectedColor, nextSamples));
      return nextSamples;
    });

    setMessage(`Captured a ${selectedColor} sample from the center target.`);
  };

  const handleClearSelectedColor = () => {
    setSamples((currentSamples) => {
      const nextSamples = { ...currentSamples };
      delete nextSamples[selectedColor];
      return nextSamples;
    });
    setMessage(`Cleared captured ${selectedColor} samples.`);
  };

  const handleDiscardDraft = () => {
    setSamples({});
    setMessage("Discarded unsaved calibration samples.");
  };

  const handleSaveCalibration = () => {
    if (totalSampleCount === 0) {
      setMessage("Capture at least one sample before saving.");
      return;
    }

    const nextThresholds = buildThresholdsFromSamples(samples, storedThresholds);
    saveCustomThresholds(nextThresholds);
    setStoredThresholds(nextThresholds);
    setSamples({});
    setMessage("Saved custom color thresholds for this device.");
  };

  return (
    <PageTransition>
      <main className="settings-page route-shell">
        <header className="route-shell__header">
          <Link href="/settings" className="route-shell__back">
            Back
          </Link>
          <div>
            <p className="route-shell__eyebrow">Phase 3 · Calibration</p>
            <h1 className="route-shell__title">Calibrate Color Detection</h1>
          </div>
        </header>

        <Card className="settings-page__card">
          <div className="route-shell__section-header">
            <h2 className="route-shell__section-title">Capture Workflow</h2>
            <p className="route-shell__copy">
              Hold a sticker of the selected color inside the center target, then
              capture a sample. The app derives tighter HSV thresholds from the
              collected readings.
            </p>
          </div>

          <ProgressBar
            label="Colors sampled"
            max={CUBE_COLORS.length}
            value={sampledColorCount}
          />

          <div className="settings-calibrate__chips">
            {CUBE_COLORS.map((color) => {
              const sampleCount = samples[color]?.length ?? 0;
              const isActive = selectedColor === color;

              return (
                <button
                  key={color}
                  type="button"
                  className={`settings-calibrate__chip${
                    isActive ? " settings-calibrate__chip--active" : ""
                  }`}
                  onClick={() => setSelectedColor(color)}
                >
                  <span
                    className="settings-page__swatch"
                    style={{ backgroundColor: COLOR_CSS_MAP[color] }}
                  />
                  <span>{color}</span>
                  <strong>{sampleCount}</strong>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="settings-calibrate__layout">
          <Card className="settings-page__card">
            <div className="settings-calibrate__stage">
              <video
                ref={videoRef}
                className="settings-calibrate__video"
                autoPlay
                muted
                playsInline
              />
              <div className="settings-calibrate__target" aria-hidden="true">
                <div className="settings-calibrate__targetBox" />
              </div>
              <canvas
                ref={canvasRef}
                className="settings-calibrate__canvas"
                aria-hidden="true"
              />
            </div>

            <div className="settings-calibrate__samplePanel">
              <div className="settings-calibrate__sampleHeader">
                <div>
                  <p className="route-shell__eyebrow">Live center sample</p>
                  <h2 className="route-shell__section-title">
                    Targeting {selectedColor}
                  </h2>
                </div>
                <span className="route-shell__badge">
                  {stream ? "Camera live" : "Waiting"}
                </span>
              </div>

              <div className="settings-calibrate__sampleMeta">
                <span
                  className="settings-calibrate__sampleSwatch"
                  style={{
                    backgroundColor: visibleLiveSample
                      ? `rgb(${visibleLiveSample.rgb.r}, ${visibleLiveSample.rgb.g}, ${visibleLiveSample.rgb.b})`
                      : "rgba(255,255,255,0.06)",
                  }}
                />
                <div>
                  <p className="route-shell__copy">
                    {error
                      ? error
                      : visibleLiveSample
                        ? `HSV ${Math.round(visibleLiveSample.hsv.h)}°, ${Math.round(
                            visibleLiveSample.hsv.s
                          )}%, ${Math.round(visibleLiveSample.hsv.v)}%`
                        : "Waiting for a usable frame."}
                  </p>
                  {liveClassification && (
                    <p className="route-shell__copy">
                      Current classifier sees <strong>{liveClassification.color}</strong>{" "}
                      at {Math.round(liveClassification.confidence * 100)}%.
                    </p>
                  )}
                </div>
              </div>

              {message && <div className="settings-calibrate__message">{message}</div>}

              <div className="route-shell__actions">
                <Button
                  variant="primary"
                  onClick={handleCaptureSample}
                  disabled={!isReady || liveSample === null}
                >
                  Capture sample
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleClearSelectedColor}
                  disabled={(samples[selectedColor]?.length ?? 0) === 0}
                >
                  Clear {selectedColor}
                </Button>
                <Button variant="ghost" onClick={restartCamera}>
                  Retry camera
                </Button>
              </div>

              <div className="route-shell__actions">
                <Button
                  variant="primary"
                  onClick={handleSaveCalibration}
                  disabled={totalSampleCount === 0}
                >
                  Save thresholds
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleDiscardDraft}
                  disabled={totalSampleCount === 0}
                >
                  Discard draft
                </Button>
              </div>
            </div>
          </Card>

          <Card className="settings-page__card" tone="subtle">
            <div className="route-shell__section-header">
              <h2 className="route-shell__section-title">Threshold Preview</h2>
              <p className="route-shell__copy">
                These are the ranges the scanner will use if you save the current
                draft. Colors without samples fall back to the stored values.
              </p>
            </div>

            <div className="settings-page__thresholdGrid">
              {CUBE_COLORS.map((color) => {
                const threshold = previewThresholds[color];

                return (
                  <article key={color} className="settings-page__thresholdCard">
                    <div className="settings-page__thresholdHeader">
                      <span
                        className="settings-page__swatch"
                        style={{ backgroundColor: COLOR_CSS_MAP[color] }}
                      />
                      <strong>{color}</strong>
                    </div>
                    <p>Hue: {threshold.hMin} to {threshold.hMax}</p>
                    <p>Saturation: {threshold.sMin} to {threshold.sMax}</p>
                    <p>Value: {threshold.vMin} to {threshold.vMax}</p>
                  </article>
                );
              })}
            </div>
          </Card>
        </div>
      </main>
    </PageTransition>
  );
}
