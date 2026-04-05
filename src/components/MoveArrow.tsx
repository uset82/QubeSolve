import type { MoveData } from '@/lib/moveParser';
import PedagogicalMoveVisualizer from './PedagogicalMoveVisualizer';
import styles from './MoveArrow.module.css';

interface MoveArrowProps {
  move: MoveData | null;
}

export default function MoveArrow({ move }: MoveArrowProps) {
  if (!move) {
    return (
      <section className={styles.card}>
        <p className={styles.eyebrow}>Move Direction</p>
        <p className={styles.empty}>
          No queued move. The cube is either solved or waiting for the next step.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <p className={styles.eyebrow}>Move Direction</p>
      <PedagogicalMoveVisualizer move={move} />
    </section>
  );
}
