'use client';

import Confetti from '@/components/Confetti';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition, useMemo, useState } from 'react';

import CubeNet2D from '@/components/CubeNet2D';
import {
  applyMove,
  cloneCubeState,
  convertCanonicalCubeStateToUi,
  type CubeState,
} from '@/lib/cubeState';
import { parseSolution } from '@/lib/moveParser';
import { clearScanSession } from '@/lib/scanSession';
import { clearSolveSession, loadSolveSession, type SolveSession } from '@/lib/solveSession';
import '@/styles/solve.css';

function formatDuration(durationMs: number): string {
  if (durationMs >= 1000) {
    return `${(durationMs / 1000).toFixed(1)} s`;
  }

  return `${durationMs} ms`;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function DonePage() {
  const router = useRouter();
  const [session] = useState<SolveSession | null>(() => loadSolveSession());

  const parsedMoves = useMemo(() => {
    if (!session) {
      return [];
    }

    const rawSolution = session.solution.raw || session.solution.moves.join(' ');
    return parseSolution(rawSolution);
  }, [session]);

  const solvedCubeState = useMemo<CubeState | null>(() => {
    if (!session) {
      return null;
    }

    return parsedMoves.reduce(
      (state, move) => applyMove(state, move.notation),
      cloneCubeState(session.cubeState)
    );
  }, [parsedMoves, session]);
  const displaySolvedCubeState = useMemo<CubeState | null>(() => {
    if (!solvedCubeState) {
      return null;
    }

    return convertCanonicalCubeStateToUi(solvedCubeState);
  }, [solvedCubeState]);

  const handleSolveAnother = () => {
    clearScanSession();
    clearSolveSession();
    startTransition(() => {
      router.push('/');
    });
  };

  return (
    <main className="done-page route-shell">
      <Confetti />

      <header className="route-shell__header">
        <Link href={session ? '/solve' : '/'} className="route-shell__back">
          Back
        </Link>
        <div>
          <p className="route-shell__eyebrow">Phase 3 · Complete</p>
          <h1 className="route-shell__title">Cube Solved</h1>
        </div>
      </header>

      {session === null && (
        <section className="route-shell__panel solve-page__empty">
          <h2 className="route-shell__section-title">No completed solve found</h2>
          <p className="route-shell__copy">
            Finish a solve session first, or start scanning a new cube.
          </p>
          <div className="route-shell__actions">
            <Link href="/scan" className="button button--primary">
              Open scanner
            </Link>
            <Link href="/" className="button button--secondary">
              Back home
            </Link>
          </div>
        </section>
      )}

      {session && solvedCubeState && displaySolvedCubeState && (
        <>
          <section className="route-shell__panel done-page__hero">
            <span className="done-page__pill">
              {session.solution.totalSteps === 0 ? 'Already solved' : 'Guide completed'}
            </span>
            <div className="route-shell__section-header">
              <h2 className="route-shell__section-title">Nice. The cube is back in solved state.</h2>
              <p className="route-shell__copy">
                The guided flow is complete and the final net below reflects the solved cube.
              </p>
            </div>

            <div className="done-page__stats">
              <div className="done-page__stat">
                <span>Total moves</span>
                <strong>{session.solution.totalSteps}</strong>
              </div>
              <div className="done-page__stat">
                <span>Compute time</span>
                <strong>{formatDuration(session.solution.computeTimeMs)}</strong>
              </div>
              <div className="done-page__stat">
                <span>Generated</span>
                <strong>{formatTimestamp(session.createdAt)}</strong>
              </div>
            </div>
          </section>

          <section className="route-shell__panel">
            <div className="route-shell__section-header">
              <h2 className="route-shell__section-title">Final State</h2>
              <p className="route-shell__copy">
                Use this solved net as a quick confirmation before starting another cube.
              </p>
            </div>

            <CubeNet2D cubeState={displaySolvedCubeState} />

            {session.solution.raw ? (
              <div className="solve-page__solution">
                <p className="route-shell__eyebrow">Solution used</p>
                <code className="solve-page__solutionCode">{session.solution.raw}</code>
              </div>
            ) : (
              <div className="solve-page__solution">
                <p className="route-shell__eyebrow">Solution used</p>
                <p className="route-shell__copy">No turns were required for this cube state.</p>
              </div>
            )}

            <div className="route-shell__actions">
              <button
                type="button"
                className="button button--primary"
                onClick={handleSolveAnother}
              >
                Solve another cube
              </button>
              <Link href="/review" className="button button--secondary">
                Review scanned state
              </Link>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
