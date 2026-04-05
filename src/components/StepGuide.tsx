import type { MoveData } from "@/lib/moveParser";

import styles from "./StepGuide.module.css";

interface StepGuideProps {
  move: MoveData | null;
  currentStep: number;
  totalSteps: number;
}

export default function StepGuide({
  move,
  currentStep,
  totalSteps,
}: StepGuideProps) {
  const isAlreadySolved = totalSteps === 0;
  const isComplete = !move && totalSteps > 0;

  return (
    <section className={styles.card}>
      <p className={styles.eyebrow}>
        {isAlreadySolved
          ? "Already solved"
          : isComplete
            ? "Solved"
            : `Step ${Math.min(currentStep + 1, totalSteps)} of ${totalSteps}`}
      </p>
      {!move && (
        <p className={styles.empty}>
          {isAlreadySolved
            ? "No moves are required for this cube state."
            : "All moves completed. The cube should now be solved. Great job!"}
        </p>
      )}
    </section>
  );
}
