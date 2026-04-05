'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition, useEffect, useMemo, useRef, useState } from 'react';

import type { CubeViewer3DAnimationCommand } from '@/components/CubeViewer3D';
import CubeNet2D from '@/components/CubeNet2D';
import MoveArrow from '@/components/MoveArrow';
import StepGuide from '@/components/StepGuide';
import {
  applyMove,
  cloneCubeState,
  convertCanonicalCubeStateToUi,
  type CubeState,
} from '@/lib/cubeState';
import {
  getInverseNotation,
  parseMove,
  parseSolution,
  type MoveData,
} from '@/lib/moveParser';
import { loadSolveSession, type SolveSession } from '@/lib/solveSession';
import '@/styles/solve.css';

const CubeViewer3D = dynamic(() => import('@/components/CubeViewer3D'), {
  ssr: false,
  loading: () => (
    <div className="solve-page__viewerPlaceholder">
      Loading 3D cube viewer...
    </div>
  ),
});

interface SolveAnimationCommand extends CubeViewer3DAnimationCommand {
  fromStep: number;
  toStep: number;
  displayStep: number;
}

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

export default function SolvePage() {
  const router = useRouter();
  const [session] = useState<SolveSession | null>(() => loadSolveSession());
  const [currentStep, setCurrentStep] = useState(0);
  const [activeCommand, setActiveCommand] = useState<SolveAnimationCommand | null>(null);
  const commandIdRef = useRef(0);

  const parsedMoves = useMemo(() => {
    if (!session) {
      return [];
    }

    const rawSolution = session.solution.raw || session.solution.moves.join(' ');
    return parseSolution(rawSolution);
  }, [session]);

  const stepStates = useMemo<CubeState[]>(() => {
    if (!session) {
      return [];
    }

    const states = [cloneCubeState(session.cubeState)];

    for (const move of parsedMoves) {
      states.push(applyMove(states[states.length - 1], move.notation));
    }

    return states;
  }, [parsedMoves, session]);

  const totalSteps = parsedMoves.length;
  const currentCubeState = stepStates[currentStep] ?? null;
  const displayCubeState = activeCommand?.fromState ?? currentCubeState;
  const displayNetState = displayCubeState
    ? convertCanonicalCubeStateToUi(displayCubeState)
    : null;
  const currentMove = currentStep < totalSteps ? parsedMoves[currentStep] : null;
  const guideMove: MoveData | null = activeCommand?.move ?? currentMove;
  const guideStep = activeCommand?.displayStep ?? currentStep;
  const appliedStepCount = activeCommand?.fromStep ?? currentStep;
  const isComplete = totalSteps > 0 && currentStep >= totalSteps && activeCommand === null;
  const progressPercent =
    totalSteps === 0 ? 100 : Math.round((appliedStepCount / totalSteps) * 100);
  const remainingMoves = Math.max(totalSteps - appliedStepCount, 0);
  const progressMessage =
    totalSteps === 0
      ? 'This cube was already solved.'
      : activeCommand
        ? `Animating ${activeCommand.move.notation}. Keep the physical cube aligned with the preview.`
        : isComplete
          ? 'Final move applied. Redirecting to the celebration screen.'
          : `${remainingMoves} move${remainingMoves === 1 ? '' : 's'} remaining.`;

  useEffect(() => {
    if (!session || !isComplete) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      startTransition(() => {
        router.push('/done');
      });
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isComplete, router, session]);

  const queueCommand = (
    move: MoveData,
    fromStep: number,
    toStep: number,
    displayStep: number
  ) => {
    const fromState = stepStates[fromStep];
    if (!fromState) {
      return;
    }

    commandIdRef.current += 1;

    setActiveCommand({
      id: commandIdRef.current,
      move,
      fromState: cloneCubeState(fromState),
      fromStep,
      toStep,
      displayStep,
    });
    setCurrentStep(toStep);
  };

  const handlePrevious = () => {
    if (activeCommand || currentStep === 0) {
      return;
    }

    const lastAppliedMove = parsedMoves[currentStep - 1];
    if (!lastAppliedMove) {
      return;
    }

    queueCommand(
      parseMove(getInverseNotation(lastAppliedMove.notation)),
      currentStep,
      currentStep - 1,
      currentStep - 1
    );
  };

  const handleNext = () => {
    if (activeCommand) {
      return;
    }

    if (totalSteps === 0) {
      startTransition(() => {
        router.push('/done');
      });
      return;
    }

    const nextMove = parsedMoves[currentStep];
    if (!nextMove) {
      return;
    }

    queueCommand(nextMove, currentStep, Math.min(currentStep + 1, totalSteps), currentStep);
  };

  const handleAnimationComplete = (commandId: number) => {
    setActiveCommand((currentCommand) => {
      if (!currentCommand || currentCommand.id !== commandId) {
        return currentCommand;
      }

      return null;
    });
  };

  return (
    <main className="solve-page route-shell">
      <header className="route-shell__header">
        <Link href="/review" className="route-shell__back">
          Back
        </Link>
        <div>
          <p className="route-shell__eyebrow">Phase 2 · Guided Solve</p>
          <h1 className="route-shell__title">Follow The Moves</h1>
        </div>
      </header>

      {session === null && (
        <section className="route-shell__panel solve-page__empty">
          <h2 className="route-shell__section-title">No solve session found</h2>
          <p className="route-shell__copy">
            Review a scanned cube first so the solver can generate a move sequence.
          </p>
          <div className="route-shell__actions">
            <Link href="/review" className="button button--primary">
              Open review
            </Link>
            <Link href="/scan" className="button button--secondary">
              Scan a cube
            </Link>
          </div>
        </section>
      )}

      {session && currentCubeState && (
        <>
          <section className="route-shell__panel">
            <div className="solve-page__summary">
              <div className="route-shell__section-header">
                <h2 className="route-shell__section-title">Solve Progress</h2>
                <p className="route-shell__copy">
                  Step through each move and keep the physical cube aligned with the live state.
                </p>
              </div>

              <div className="solve-page__metrics">
                <div className="solve-page__metric">
                  <span>Moves</span>
                  <strong>{totalSteps}</strong>
                </div>
                <div className="solve-page__metric">
                  <span>Compute time</span>
                  <strong>{formatDuration(session.solution.computeTimeMs)}</strong>
                </div>
                <div className="solve-page__metric">
                  <span>Generated</span>
                  <strong>{formatTimestamp(session.createdAt)}</strong>
                </div>
              </div>
            </div>

            <div
              className="solve-page__progressTrack"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              aria-label="Solve progress"
            >
              <div
                className="solve-page__progressFill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="solve-page__progressMeta">
              <span>{progressPercent}% complete</span>
              <span>{progressMessage}</span>
            </div>
          </section>

          <section className="route-shell__panel">
            <div className="solve-page__stateHeader">
              <div className="route-shell__section-header">
                <h2 className="route-shell__section-title">Current Cube State</h2>
                <p className="route-shell__copy">
                  The 3D cube reflects the live state after each applied move, with the active face highlighted.
                </p>
              </div>
              <span className="route-shell__badge">
                {totalSteps === 0 ? 'Solved' : `${appliedStepCount}/${totalSteps} applied`}
              </span>
            </div>

            <div className="solve-page__visuals">
              <div className="solve-page__viewerCard">
                <div className="solve-page__viewerFrame">
                  <CubeViewer3D
                    cubeState={currentCubeState}
                    activeMove={guideMove}
                    animationCommand={activeCommand}
                    onAnimationComplete={handleAnimationComplete}
                  />
                </div>
                <p className="solve-page__viewerHint">
                  Drag to rotate the cube. Use the 2D net for exact sticker-level confirmation.
                </p>
              </div>

              <div className="solve-page__netCard">
                {displayNetState ? <CubeNet2D cubeState={displayNetState} /> : null}
              </div>
            </div>
          </section>

          <section className="solve-page__controls">
            <div className="solve-page__guidance">
              <StepGuide
                move={guideMove}
                currentStep={guideStep}
                totalSteps={totalSteps}
              />
              <MoveArrow move={guideMove} />
            </div>

            <div className="route-shell__panel solve-page__side">
              <div className="route-shell__section-header">
                <h2 className="route-shell__section-title">Controls</h2>
                <p className="route-shell__copy">
                  Move forward one instruction at a time, or step back to replay the guide.
                </p>
              </div>

              {session.solution.raw && (
                <div className="solve-page__solution">
                  <p className="route-shell__eyebrow">Full solution</p>
                  <code className="solve-page__solutionCode">{session.solution.raw}</code>
                </div>
              )}

              <div className="route-shell__actions">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={handlePrevious}
                  disabled={currentStep === 0 || activeCommand !== null || isComplete}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={handleNext}
                  disabled={activeCommand !== null || isComplete}
                >
                  {totalSteps === 0
                    ? 'Open finish screen'
                    : currentStep === totalSteps - 1
                      ? 'Apply final move'
                      : 'Next move'}
                </button>
                <Link href="/review" className="button button--ghost">
                  Back to review
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
