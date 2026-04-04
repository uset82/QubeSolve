declare module "cubejs" {
  export interface CubeInstance {
    solve(): string;
  }

  export function initSolver(): void;
  export function fromString(facelets: string): CubeInstance;

  const cubejs: {
    initSolver?: typeof initSolver;
    fromString: typeof fromString;
  };

  export default cubejs;
}
