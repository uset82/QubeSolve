import Link from "next/link";
import Image from "next/image";
import IconButton from "@/components/ui/IconButton";
import Button from "@/components/ui/Button";
import "@/styles/home.css";

function CameraGlyph() {
  return (
    <svg
      className="home__ctaGlyph"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 7h2l1.3-2h7.4L17 7h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function PencilGlyph() {
  return (
    <svg
      className="home__ctaGlyph"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L7 21l-4 1 1-4L16.5 3.5Z" />
    </svg>
  );
}

function SettingsGlyph() {
  return (
    <svg
      className="home__settingsIcon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="home">
      <div className="home__backdrop" aria-hidden="true">
        <div className="home__mesh" />
        <div className="home__nebula home__nebula--violet" />
        <div className="home__nebula home__nebula--cyan" />
        <div className="home__nebula home__nebula--emerald" />
        <div className="home__particles" />
      </div>

      <IconButton href="/settings" className="home__settings" label="Open settings">
        <SettingsGlyph />
      </IconButton>

      <div className="home__content">
        <header className="home__masthead">
          <div className="home__pills">
            <span className="home__pill home__pill--eyebrow">
              Camera-guided cube solving
            </span>
            <span className="home__pill home__pill--status">Mobile alpha</span>
          </div>

          <h1 className="home__title">
            <span className="home__titleWord" data-text="QubeSolve">
              QubeSolve
            </span>
          </h1>
        </header>

        <div
          className="home__hero"
          role="img"
          aria-label="Glowing Rubik's cube with neon energy trails"
        >
          <div className="home__heroAura" aria-hidden="true" />
          <div className="home__heroCore" aria-hidden="true" />
          <Image
            src="/cube-hero.png"
            alt="Rubik's cube with neon particle trails"
            width={340}
            height={340}
            className="home__heroImage"
            priority
          />
          <span className="home__spark home__spark--one" aria-hidden="true" />
          <span className="home__spark home__spark--two" aria-hidden="true" />
          <span className="home__spark home__spark--three" aria-hidden="true" />
        </div>

        <p className="home__subtitle">
          Scan your Rubik&apos;s cube, fix any misread stickers, and follow
          animated 3D moves until it clicks into place.
        </p>

        <div className="home__ctaStack">
          <Button
            href="/scan"
            variant="primary"
            className="home__cta home__cta--scan"
            fullWidth
            id="btn-scan"
            leadingIcon={
              <span className="home__ctaIcon" aria-hidden="true">
                <CameraGlyph />
              </span>
            }
          >
            Scan My Cube
          </Button>

          <Button
            href="/manual"
            variant="secondary"
            className="home__cta home__cta--manual"
            fullWidth
            id="btn-manual"
            leadingIcon={
              <span className="home__ctaIcon home__ctaIcon--manual" aria-hidden="true">
                <PencilGlyph />
              </span>
            }
          >
            Enter colors manually
          </Button>
        </div>

        <div className="home__secondary">
          <Link href="/settings/calibrate" className="home__link">
            Need better accuracy?
            <span className="home__linkHighlight"> Calibrate your colors first.</span>
          </Link>
          <span className="home__version">v1.0.0-alpha</span>
        </div>
      </div>

      <div className="home__bottomAccent" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0 14.6 8.4 23 11l-8.4 2.6L12 22l-2.6-8.4L1 11l8.4-2.6L12 0Z" />
        </svg>
      </div>
    </main>
  );
}
