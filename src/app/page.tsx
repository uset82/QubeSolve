import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import IconButton from "@/components/ui/IconButton";
import PageTransition from "@/components/ui/PageTransition";
import Button from "@/components/ui/Button";
import "@/styles/home.css";

const HOME_SIGNALS = [
  { kicker: "SCAN", label: "6 faces" },
  { kicker: "TUNE", label: "bad reads" },
  { kicker: "SOLVE", label: "3D steps" },
] as const;

export default function HomePage() {
  return (
    <PageTransition>
      <main className="home">
        <div className="home__backdrop" aria-hidden="true">
          <div className="home__mesh" />
          <div className="home__beam home__beam--left" />
          <div className="home__beam home__beam--right" />
          <div className="home__glow home__glow--violet" />
          <div className="home__glow home__glow--cyan" />
          <div className="home__glow home__glow--pink" />
        </div>

        <IconButton href="/settings" className="home__settings" label="Open settings">
          <span className="home__settingsGlyph" aria-hidden="true">
            ⚙
          </span>
        </IconButton>

        <div className="home__content stagger-children">
          <div className="home__masthead">
            <div className="home__intro">
              <p className="home__eyebrow">Camera-guided cube solving</p>
              <span className="home__status">Mobile alpha</span>
            </div>

            <h1 className="home__title">
              <span className="home__titleWord" data-text="QubeSolve">
                QubeSolve
              </span>
            </h1>
          </div>

          <div
            className="home__hero"
            role="img"
            aria-label="Glowing Rubik's cube with neon orbit trails"
          >
            <div className="home__heroAura" aria-hidden="true" />
            <div className="home__heroGrid" aria-hidden="true" />
            <div className="home__orbit home__orbit--one" aria-hidden="true" />
            <div className="home__orbit home__orbit--two" aria-hidden="true" />
            <div className="home__orbit home__orbit--three" aria-hidden="true" />
            <span className="home__spark home__spark--one" aria-hidden="true" />
            <span className="home__spark home__spark--two" aria-hidden="true" />
            <span className="home__spark home__spark--three" aria-hidden="true" />
            <BrandMark className="home__brand" size={228} />
          </div>

          <p className="home__subtitle">
            Scan each face, repair bad reads, and follow animated turns until
            your cube clicks into place.
          </p>

          <div className="home__signals" aria-label="QubeSolve key features">
            {HOME_SIGNALS.map((signal) => (
              <div key={signal.kicker} className="home__signal">
                <span className="home__signalKicker">{signal.kicker}</span>
                <span className="home__signalLabel">{signal.label}</span>
              </div>
            ))}
          </div>

          <div className="home__ctaStack">
            <Button
              href="/scan"
              variant="primary"
              className="home__cta home__cta--scan"
              fullWidth
              id="btn-scan"
              leadingIcon={
                <span className="home__ctaBadge" aria-hidden="true">
                  CAM
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
                <span className="home__ctaBadge home__ctaBadge--muted" aria-hidden="true">
                  RGB
                </span>
              }
            >
              Enter colors manually
            </Button>
          </div>

          <div className="home__secondary">
            <Link href="/settings/calibrate" className="home__link">
              Need better accuracy? Calibrate your colors first.
            </Link>
            <span className="home__version">v1.0.0-alpha</span>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
