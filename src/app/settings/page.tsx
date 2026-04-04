'use client';

import Link from 'next/link';
import { useState } from 'react';

import { clearCustomThresholds, loadCustomThresholds } from '@/lib/colorDetection';
import { loadSoundEnabled, saveSoundEnabled } from '@/lib/preferences';
import '@/styles/settings.css';

export default function SettingsPage() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadSoundEnabled());
  const [hasCustomCalibration, setHasCustomCalibration] = useState<boolean>(
    () => loadCustomThresholds() !== null
  );

  const handleToggleSound = () => {
    setSoundEnabled((currentValue) => {
      const nextValue = !currentValue;
      saveSoundEnabled(nextValue);
      return nextValue;
    });
  };

  const handleResetCalibration = () => {
    clearCustomThresholds();
    setHasCustomCalibration(false);
  };

  return (
    <main className="settings-page route-shell">
      <header className="route-shell__header">
        <Link href="/" className="route-shell__back">
          Back
        </Link>
        <div>
          <p className="route-shell__eyebrow">Phase 3 · Settings</p>
          <h1 className="route-shell__title">Preferences</h1>
        </div>
      </header>

      <section className="route-shell__panel settings-page__card">
        <div className="route-shell__section-header">
          <h2 className="route-shell__section-title">Sound</h2>
          <p className="route-shell__copy">
            Prepare button, solve, and celebration sounds before wiring them throughout the app.
          </p>
        </div>

        <div className="settings-page__row">
          <div>
            <strong className="settings-page__label">Sound effects</strong>
            <p className="route-shell__copy">
              {soundEnabled ? 'Enabled for future interactions.' : 'Muted for future interactions.'}
            </p>
          </div>
          <button
            type="button"
            className={`settings-page__toggle${soundEnabled ? ' settings-page__toggle--on' : ''}`}
            onClick={handleToggleSound}
            aria-pressed={soundEnabled}
          >
            <span className="settings-page__toggleThumb" />
          </button>
        </div>
      </section>

      <section className="route-shell__panel settings-page__card">
        <div className="route-shell__section-header">
          <h2 className="route-shell__section-title">Color Calibration</h2>
          <p className="route-shell__copy">
            Review threshold ranges and clear any saved calibration if a scan starts drifting under new lighting.
          </p>
        </div>

        <div className="settings-page__row">
          <div>
            <strong className="settings-page__label">Threshold source</strong>
            <p className="route-shell__copy">
              {hasCustomCalibration ? 'Custom thresholds saved on this device.' : 'Using built-in default thresholds.'}
            </p>
          </div>
          <span className="route-shell__badge">
            {hasCustomCalibration ? 'Custom' : 'Default'}
          </span>
        </div>

        <div className="route-shell__actions">
          <Link href="/settings/calibrate" className="button button--primary">
            Open calibration details
          </Link>
          <button type="button" className="button button--secondary" onClick={handleResetCalibration}>
            Reset thresholds
          </button>
        </div>
      </section>

      <section className="route-shell__panel settings-page__card">
        <div className="route-shell__section-header">
          <h2 className="route-shell__section-title">About</h2>
          <p className="route-shell__copy">
            Current build status and the quickest way back into the solve flow.
          </p>
        </div>

        <div className="settings-page__about">
          <div className="settings-page__aboutItem">
            <span>Version</span>
            <strong>0.1.0-alpha</strong>
          </div>
          <div className="settings-page__aboutItem">
            <span>Stack</span>
            <strong>Next.js 16 + Three.js + cubejs</strong>
          </div>
        </div>

        <div className="route-shell__actions">
          <Link href="/scan" className="button button--secondary">
            Back to scan
          </Link>
          <Link href="/manual" className="button button--ghost">
            Manual entry
          </Link>
        </div>
      </section>
    </main>
  );
}
