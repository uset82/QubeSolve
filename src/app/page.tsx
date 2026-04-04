import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import IconButton from "@/components/ui/IconButton";
import PageTransition from "@/components/ui/PageTransition";
import Button from "@/components/ui/Button";
import "@/styles/home.css";

export default function HomePage() {
  return (
    <PageTransition>
      <main className="home">
        <div className="home__orb home__orb--1" aria-hidden="true" />
        <div className="home__orb home__orb--2" aria-hidden="true" />
        <div className="home__orb home__orb--3" aria-hidden="true" />

        <IconButton href="/settings" className="home__settings" label="Open settings">
          <span className="home__settingsGlyph" aria-hidden="true">
            ⚙
          </span>
        </IconButton>

        <div className="home__content stagger-children">
          <div className="home__hero" role="img" aria-label="QubeSolve cube mark">
            <div className="home__halo" aria-hidden="true" />
            <BrandMark size={210} />
          </div>

          <p className="home__eyebrow">Camera-guided cube solving</p>

          <h1 className="home__title">
            <span className="text-gradient">QubeSolve</span>
          </h1>

          <p className="home__subtitle">
            Scan your Rubik&apos;s cube, fix any misread stickers, and follow
            animated 3D moves until it clicks into place.
          </p>

          <div className="home__ctaStack">
            <Button
              href="/scan"
              variant="primary"
              fullWidth
              id="btn-scan"
              leadingIcon={<span aria-hidden="true">📸</span>}
            >
              Scan My Cube
            </Button>
            <Button
              href="/manual"
              variant="ghost"
              fullWidth
              id="btn-manual"
              leadingIcon={<span aria-hidden="true">✏️</span>}
            >
              Enter colors manually
            </Button>
          </div>

          <div className="home__secondary">
            <Link href="/settings/calibrate" className="home__link">
              Need better accuracy? Calibrate your colors first.
            </Link>
          </div>
        </div>

        <span className="home__version">v1.0.0-alpha</span>
      </main>
    </PageTransition>
  );
}
