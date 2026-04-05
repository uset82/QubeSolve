import { cloneCubeState, type CubeState } from "@/lib/cubeState";
import { type CubeColor } from "@/lib/constants";
import {
  validateCubeState,
  type SuspectFacelet,
} from "@/lib/validation";

export interface CubeRepairResult {
  cubeState: CubeState;
  changedFacelets: SuspectFacelet[];
}

const MAX_PERMUTATION_FACELETS = 8;

function getFaceletColor(state: CubeState, facelet: SuspectFacelet): CubeColor {
  return state[facelet.face][facelet.index];
}

function setFaceletColor(
  state: CubeState,
  facelet: SuspectFacelet,
  color: CubeColor
): void {
  state[facelet.face][facelet.index] = color;
}

function countChangedFacelets(
  originalColors: readonly CubeColor[],
  nextColors: readonly CubeColor[]
): number {
  let changes = 0;

  for (let index = 0; index < originalColors.length; index += 1) {
    if (originalColors[index] !== nextColors[index]) {
      changes += 1;
    }
  }

  return changes;
}

function buildCandidateState(
  state: CubeState,
  suspectFacelets: readonly SuspectFacelet[],
  colors: readonly CubeColor[]
): CubeState {
  const candidate = cloneCubeState(state);

  for (let index = 0; index < suspectFacelets.length; index += 1) {
    setFaceletColor(candidate, suspectFacelets[index], colors[index]);
  }

  return candidate;
}

export function attemptRepairCubeState(
  state: CubeState
): CubeRepairResult | null {
  const validation = validateCubeState(state);

  if (validation.valid) {
    return {
      cubeState: state,
      changedFacelets: [],
    };
  }

  const suspectFacelets = validation.suspectFacelets.filter(
    (facelet) => facelet.index !== 4
  );

  if (
    suspectFacelets.length < 2 ||
    suspectFacelets.length > MAX_PERMUTATION_FACELETS
  ) {
    return null;
  }

  const originalColors = suspectFacelets.map((facelet) =>
    getFaceletColor(state, facelet)
  );
  const sortedColors = [...originalColors].sort();
  const workingColors = Array<CubeColor>(sortedColors.length);
  const used = Array<boolean>(sortedColors.length).fill(false);

  let bestResult: CubeRepairResult | null = null;
  let bestChangeCount = Number.POSITIVE_INFINITY;

  function search(depth: number): void {
    if (depth === sortedColors.length) {
      const changeCount = countChangedFacelets(originalColors, workingColors);

      if (changeCount === 0 || changeCount > bestChangeCount) {
        return;
      }

      const candidate = buildCandidateState(state, suspectFacelets, workingColors);
      if (!validateCubeState(candidate).valid) {
        return;
      }

      bestChangeCount = changeCount;
      bestResult = {
        cubeState: candidate,
        changedFacelets: suspectFacelets.filter(
          (_, index) => originalColors[index] !== workingColors[index]
        ),
      };
      return;
    }

    for (let index = 0; index < sortedColors.length; index += 1) {
      if (used[index]) {
        continue;
      }

      if (index > 0 && sortedColors[index] === sortedColors[index - 1] && !used[index - 1]) {
        continue;
      }

      workingColors[depth] = sortedColors[index];
      used[index] = true;

      search(depth + 1);

      used[index] = false;
    }
  }

  search(0);

  return bestResult;
}
