# QubeSolve — Complete Implementation Plan

> Detailed task plan derived from `mainidea.md` — every feature, file, and validation step required to build the app from zero to production.

---

## Project Summary

**QubeSolve** is a mobile-first PWA that uses the iPhone camera to scan a scrambled 3×3×3 Rubik's cube and provides animated, step-by-step solving instructions. Built for a child learning to solve the cube.

**Stack**: Next.js 14+ (App Router) · TypeScript · Three.js · WebRTC · Vanilla CSS · Kociemba solver  
**Target**: iOS Safari PWA, deployed on Vercel with HTTPS

---

## Pre-Implementation Decisions

> [!IMPORTANT]
> The following decisions from `mainidea.md` Section 15 need to be confirmed before development begins. I'm recommending defaults — override if you disagree.

| # | Question | Recommended Decision | Rationale |
|---|---|---|---|
| 1 | **License** | **MIT** | Clean-room reimplementation of GPL concepts. Simpler for open-source sharing. |
| 2 | **Backend** | **100% client-side** (Phase 1) | Simpler, offline-first, privacy-respecting. OpenRouter Vision fallback in Phase 4. |
| 3 | **Solver library** | **`cubejs`** (pure JS) | Simpler integration, no WASM build complexity. Bundle size managed via lazy loading. |
| 4 | **Beginner CFOP mode** | **Phase 2** | MVP focuses on Kociemba optimal solve. CFOP teaching added later. |
| 5 | **Language** | **English only** (Phase 1) | Ship fast, add i18n framework in Phase 4. |
| 6 | **Domain** | **`qubesolve.vercel.app`** → later `qubesolve.app` | Free Vercel subdomain for development, custom domain when ready. |

---

## Phase 1 — Foundation & Scanning (Week 1–2)

### 1.1 Project Initialization (Architect)

> Initialize Next.js project, install dependencies, create directory structure.

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 1.1.1 | Initialize Next.js project | `package.json`, `tsconfig.json`, `next.config.js` | Architect | `npx -y create-next-app@latest ./ --typescript --app --eslint --no-tailwind --src-dir --import-alias "@/*"` |
| 1.1.2 | Install core dependencies | `package.json` | Architect | `npm install three @react-three/fiber @react-three/drei framer-motion cubejs` |
| 1.1.3 | Install dev dependencies | `package.json` | Architect | `npm install -D @types/three` |
| 1.1.4 | Configure TypeScript strict mode | `tsconfig.json` | Architect | Enable `strict: true`, configure path aliases `@/*` → `src/*` |
| 1.1.5 | Create directory scaffold | All directories | Architect | Create all directories from `mainidea.md` Section 8:`src/app/scan/`, `src/app/review/`, `src/app/solve/`, `src/app/settings/`, `src/components/ui/`, `src/lib/`, `src/hooks/`, `src/styles/`, `public/icons/`, `public/sounds/`, `docs/`, `tests/unit/`, `tests/integration/`, `tests/e2e/`, `tests/fixtures/` |
| 1.1.6 | Create `.gitignore` | `.gitignore` | Architect | Exclude `node_modules/`, `.next/`, `.env.local`, `*.log` |
| 1.1.7 | Create `README.md` | `README.md` | Architect | Project overview, setup instructions, tech stack summary |
| 1.1.8 | Verify project builds | — | Architect | Run `npm run build` — must succeed with zero errors |

**Checkpoint 1.1:** `npm run dev` starts, home page renders "Hello World".

---

### 1.2 Design System (Designer)

> Establish CSS tokens, typography, and base styles before any component work.

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 1.2.1 | Import Google Fonts | `src/app/layout.tsx` | Designer | Import Outfit (headings), Inter (body), JetBrains Mono (notation) via `next/font/google` |
| 1.2.2 | Create design tokens | `src/styles/globals.css` | Designer | All CSS variables from `mainidea.md` Section 6.3: `--bg-primary: #0F0F1A`, `--bg-secondary: #1A1A2E`, `--bg-glass`, `--accent-primary: #6C63FF`, `--accent-secondary: #00D4AA`, `--accent-warm: #FF6B6B`, all cube colors, text colors, gradients |
| 1.2.3 | Add spacing scale | `src/styles/globals.css` | Designer | `--space-xs: 4px` through `--space-3xl: 64px` (8-point grid) |
| 1.2.4 | Add border-radius tokens | `src/styles/globals.css` | Designer | `--radius-sm: 6px`, `--radius-md: 12px`, `--radius-lg: 20px`, `--radius-full: 9999px` |
| 1.2.5 | Add shadow tokens | `src/styles/globals.css` | Designer | Glassmorphism shadows, card elevation shadows |
| 1.2.6 | Add transition tokens | `src/styles/globals.css` | Designer | `--transition-fast: 150ms ease`, `--transition-normal: 300ms ease`, `--transition-slow: 500ms ease` |
| 1.2.7 | Implement CSS reset | `src/styles/globals.css` | Designer | Normalize box-sizing, margin/padding reset, font smoothing, safe area insets |
| 1.2.8 | Set up dark theme as default | `src/styles/globals.css` | Designer | Apply `--bg-primary` to `body`, set default text color, selection styles |
| 1.2.9 | Configure root layout | `src/app/layout.tsx` | Designer | Wire up fonts, globals.css, viewport meta tags, PWA meta tags, `<html lang="en">` |

**Checkpoint 1.2:** App renders with dark background, correct fonts, no unstyled flash.

---

### 1.3 Shared UI Components (Designer)

> Build reusable components used across all screens.

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 1.3.1 | Button component | `src/components/ui/Button.tsx`, `src/styles/components/button.css` | Designer | Primary/secondary/ghost variants, loading state, disabled state, min 48×48px touch target, gradient borders, hover glow effect |
| 1.3.2 | Card component | `src/components/ui/Card.tsx`, `src/styles/components/card.css` | Designer | Glassmorphism card with `--bg-glass`, backdrop-blur, subtle border, gradient shine |
| 1.3.3 | ProgressBar component | `src/components/ui/ProgressBar.tsx`, `src/styles/components/progress.css` | Designer | Animated fill, gradient color, step counter text, glow effect |
| 1.3.4 | IconButton component | `src/components/ui/IconButton.tsx` | Designer | For settings gear, back arrow, etc. 48×48px touch target |
| 1.3.5 | PageTransition wrapper | `src/components/ui/PageTransition.tsx` | Designer | Framer Motion page enter/exit animations |

**Checkpoint 1.3:** All UI components render in isolation with dark theme.

---

### 1.4 Home Screen (Designer + Architect)

> Build the landing page — first impression must feel premium and kid-friendly.

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 1.4.1 | Home page layout | `src/app/page.tsx` | Architect | Page structure: hero section, CTA button, secondary links |
| 1.4.2 | Home page styles | `src/styles/home.css` | Designer | Gradient hero, floating cube animation, glassmorphism cards |
| 1.4.3 | App logo / hero illustration | — | Designer | Generate with `generate_image` tool: stylized 3D cube with gradient glow |
| 1.4.4 | "Scan My Cube" CTA button | `src/app/page.tsx` | Designer | Large gradient button, pulse animation, links to `/scan` |
| 1.4.5 | "Manual Entry" link | `src/app/page.tsx` | Designer | Secondary text link below CTA |
| 1.4.6 | Settings gear icon | `src/app/page.tsx` | Designer | Top-right icon button, links to `/settings` |
| 1.4.7 | Animated background | `src/styles/home.css` | Designer | Floating gradient orbs or subtle particle effect |
| 1.4.8 | SEO meta tags | `src/app/layout.tsx` | Architect | Title: "QubeSolve — Rubik's Cube Solver", meta description, Open Graph tags |

**Checkpoint 1.4:** Home screen is visually stunning, responsive from 375px–1024px.

---

### 1.5 Camera Module (Scanner)

> Implement WebRTC camera access with iOS Safari compatibility.

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 1.5.1 | `useCamera` hook | `src/hooks/useCamera.ts` | Scanner | `getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } })`. Returns `{ videoRef, canvasRef, stream, error, isReady }` |
| 1.5.2 | Camera permission handling | `src/hooks/useCamera.ts` | Scanner | Detect denied permission → show user-friendly message with instructions to enable in iOS Settings |
| 1.5.3 | Unsupported browser fallback | `src/hooks/useCamera.ts` | Scanner | Detect `!navigator.mediaDevices` → show "Manual Entry" fallback with explanation |
| 1.5.4 | Frame capture loop | `src/hooks/useCamera.ts` | Scanner | `requestAnimationFrame` loop drawing video frames to hidden canvas. Target ≥15 FPS. Cleanup on unmount. |
| 1.5.5 | Camera stream cleanup | `src/hooks/useCamera.ts` | Scanner | Stop all tracks on unmount, prevent memory leaks |

**Checkpoint 1.5:** Camera opens on `/scan` page, rear camera active on real iPhone, video renders to canvas.

---

### 1.6 Color Detection Engine (Scanner)

> Port QBR's color detection logic from Python/OpenCV to TypeScript/Canvas.

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 1.6.1 | Constants: HSV thresholds | `src/lib/constants.ts` | Scanner | Default HSV ranges for White, Yellow, Red, Orange, Blue, Green (from QBR's calibration data) |
| 1.6.2 | Constants: face order | `src/lib/constants.ts` | Scanner | `SCAN_ORDER = ['F', 'R', 'B', 'L', 'U', 'D']` with rotation instructions |
| 1.6.3 | Constants: cube colors | `src/lib/constants.ts` | Scanner | Color enum, CSS color map, face names |
| 1.6.4 | RGB → HSV conversion | `src/lib/colorDetection.ts` | Scanner | Pure function `rgbToHsv(r, g, b): { h, s, v }` — standard algorithm, H in 0–360 |
| 1.6.5 | Average color sampling | `src/lib/colorDetection.ts` | Scanner | `getAverageColor(imageData, x, y, size): { r, g, b }` — sample 20×20px region, average all pixels |
| 1.6.6 | HSV color classifier | `src/lib/colorDetection.ts` | Scanner | `classifyColor(hsv): CubeColor` — threshold-based classification per `mainidea.md` Section 10.1 |
| 1.6.7 | Face detection function | `src/lib/colorDetection.ts` | Scanner | `detectFaceColors(canvas, gridPositions): FaceColors[9]` — sample 9 cells, classify each |
| 1.6.8 | Confidence scoring | `src/lib/colorDetection.ts` | Scanner | Return confidence 0–1 per cell based on how close HSV is to threshold center |
| 1.6.9 | Unit tests | `tests/unit/colorDetection.test.ts` | Scanner | Test RGB→HSV conversion, test classifier for each color, test edge cases (dark, saturated, ambiguous) |

**Checkpoint 1.6:** Given a canvas frame, correctly classifies 9 colors with >90% accuracy on synthetic test data.

---

### 1.7 Camera Scanner UI (Scanner + Designer)

> Build the scanning screen with camera overlay, grid, and face guidance.

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 1.7.1 | Scan page layout | `src/app/scan/page.tsx` | Scanner | Full-screen camera feed with overlay components |
| 1.7.2 | Scan page styles | `src/styles/scan.css` | Designer | Full-viewport camera, overlay grid, bottom panel |
| 1.7.3 | CameraScanner component | `src/components/CameraScanner.tsx` | Scanner | Renders camera feed via `useCamera`, overlays 3×3 grid, shows detected colors in real-time |
| 1.7.4 | 3×3 grid overlay | `src/components/CameraScanner.tsx` | Scanner | Semi-transparent grid drawn on canvas/CSS positioned over video. Grid cells are square, centered, with rounded corners |
| 1.7.5 | Real-time color preview | `src/components/CameraScanner.tsx` | Scanner | Show 3×3 colored squares below camera feed updating live as colors are detected |
| 1.7.6 | "Confirm Face" button | `src/app/scan/page.tsx` | Scanner | Locks in the current 9 colors, advances to next face |
| 1.7.7 | Face counter badge | `src/app/scan/page.tsx` | Designer | "Face 2 of 6" — shows scanning progress |
| 1.7.8 | Face label display | `src/app/scan/page.tsx` | Scanner | Shows which face to scan: "Front (Green center)" |
| 1.7.9 | Rotation instructions | `src/app/scan/page.tsx` | Scanner | Animated hint showing how to rotate the cube for the next face. Per `mainidea.md` Section 10.2 scan order |
| 1.7.10 | Scan state machine | `src/app/scan/page.tsx` | Scanner | Track: `currentFace`, `scannedFaces[]`, transitions between faces, handle re-scan |
| 1.7.11 | Re-scan button | `src/app/scan/page.tsx` | Scanner | Allow user to go back and re-scan a specific face |
| 1.7.12 | Navigate to review | `src/app/scan/page.tsx` | Scanner | After all 6 faces scanned → navigate to `/review` with cube state |

**Checkpoint 1.7:** Can scan all 6 faces on a real device, see detected colors live, confirm each face, and proceed to review.

---

## Phase 2 — Solver Engine & 3D Visualization (Week 3–4)

### 2.1 Cube State Management (Solver)

> Implement the 54-facelet cube state model.

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 2.1.1 | CubeState type definition | `src/lib/cubeState.ts` | Solver | `type CubeState = { faces: Record<Face, FaceColors> }` with `Face = 'U'|'D'|'F'|'B'|'L'|'R'` and `FaceColors = CubeColor[9]` |
| 2.1.2 | Face indexing constants | `src/lib/cubeState.ts` | Solver | Define facelet positions per `mainidea.md` Section 4.2 notation diagram |
| 2.1.3 | State from scan data | `src/lib/cubeState.ts` | Solver | `createCubeStateFromScans(scannedFaces: ScannedFace[]): CubeState` |
| 2.1.4 | State to Kociemba string | `src/lib/cubeState.ts` | Solver | `cubeStateToString(state: CubeState): string` — 54-char facelet string for solver input |
| 2.1.5 | Apply move to state | `src/lib/cubeState.ts` | Solver | `applyMove(state: CubeState, move: Move): CubeState` — simulate a move on the state |
| 2.1.6 | `useCubeState` hook | `src/hooks/useCubeState.ts` | Solver | Global state management with React Context. Stores scanned faces, computed solution, current step |
| 2.1.7 | Unit tests | `tests/unit/cubeState.test.ts` | Solver | Test state creation, string conversion, move application against known configurations |

**Checkpoint 2.1:** Can create a cube state from 6 face scans and convert it to Kociemba input string.

---

### 2.2 Cube State Validation (Solver)

> Ensure scanned state forms a physically valid Rubik's cube.

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 2.2.1 | Color count validation | `src/lib/validation.ts` | Solver | Exactly 9 of each of the 6 colors |
| 2.2.2 | Center piece validation | `src/lib/validation.ts` | Solver | Centers must be unique and match expected face assignments |
| 2.2.3 | Corner piece validation | `src/lib/validation.ts` | Solver | 8 valid corners (3-color combos), each present exactly once |
| 2.2.4 | Edge piece validation | `src/lib/validation.ts` | Solver | 12 valid edges (2-color combos), each present exactly once |
| 2.2.5 | Corner orientation check | `src/lib/validation.ts` | Solver | Sum of corner orientations ≡ 0 (mod 3) |
| 2.2.6 | Edge orientation check | `src/lib/validation.ts` | Solver | Sum of edge orientations ≡ 0 (mod 2) |
| 2.2.7 | Permutation parity check | `src/lib/validation.ts` | Solver | Corner and edge permutation parities must match |
| 2.2.8 | Error messages | `src/lib/validation.ts` | Solver | Return specific, user-friendly error messages: "Too many red stickers — check the front face" |
| 2.2.9 | Unit tests | `tests/unit/validation.test.ts` | Solver | Test valid cube, test each invalid case (wrong count, bad corner, bad parity), 100% branch coverage |

**Checkpoint 2.2:** Correctly validates known-good and known-bad cube states with helpful error messages.

---

### 2.3 Kociemba Solver Integration (Solver)

> Integrate the Kociemba two-phase algorithm.

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 2.3.1 | Solver wrapper | `src/lib/solver.ts` | Solver | `solveCube(facelets: string): Promise<Solution>` — wraps `cubejs` |
| 2.3.2 | Web Worker setup | `src/lib/solverWorker.ts` | Solver | Run Kociemba in a Web Worker so UI thread is not blocked |
| 2.3.3 | Solver initialization | `src/lib/solver.ts` | Solver | `initSolver()` — preload lookup tables during app start (loading screen) |
| 2.3.4 | Solution type | `src/lib/solver.ts` | Solver | `type Solution = { moves: string[], totalSteps: number, computeTimeMs: number }` |
| 2.3.5 | Already-solved handling | `src/lib/solver.ts` | Solver | Detect already-solved cube → return empty solution with celebration |
| 2.3.6 | Error handling | `src/lib/solver.ts` | Solver | Handle invalid input, timeout (>5s), worker errors |
| 2.3.7 | `useSolver` hook | `src/hooks/useSolver.ts` | Solver | `const { solve, solution, isLoading, error } = useSolver()` |
| 2.3.8 | Unit tests | `tests/unit/solver.test.ts` | Solver | Test against 10+ known scrambles, verify solution length ≤ 20, verify solutions actually solve the cube |

**Checkpoint 2.3:** `solveCube("DRLUUBFBRBLURRLRUBLRDDFDLFUFUFFDBRDUDBRLLFBUBULFRBD")` returns a valid solution in <2 seconds.

---

### 2.4 Move Parser (Solver)

> Parse solution notation into structured data for animation.

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 2.4.1 | Move type definition | `src/lib/moveParser.ts` | Solver | `type MoveData = { notation: string, face: Face, direction: 'CW'|'CCW'|'180', axis: 'x'|'y'|'z', angle: number, layerIndices: number[], label: string }` |
| 2.4.2 | Notation parser | `src/lib/moveParser.ts` | Solver | `parseMove(notation: string): MoveData` — parse `"R"`, `"U'"`, `"F2"` etc. |
| 2.4.3 | Solution parser | `src/lib/moveParser.ts` | Solver | `parseSolution(solutionString: string): MoveData[]` — parse full solution |
| 2.4.4 | Plain-English labels | `src/lib/moveParser.ts` | Solver | Map per `mainidea.md` Section 7.3: `R` → "Turn the right face clockwise", `U'` → "Turn the top counter-clockwise" |
| 2.4.5 | Axis/angle mapping | `src/lib/moveParser.ts` | Solver | `R → x-axis, +π/2`, `L → x-axis, -π/2`, `U → y-axis, +π/2`, etc. |
| 2.4.6 | Unit tests | `tests/unit/moveParser.test.ts` | Solver | Test all 18 possible moves (6 faces × 3 directions), verify axes, angles, labels |

**Checkpoint 2.4:** Can parse `"R U' F2"` into 3 fully-typed `MoveData` objects with correct labels and animation parameters.

---

### 2.5 Review Screen (Scanner + Designer)

> Let user review and edit scanned colors before solving.

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 2.5.1 | Review page layout | `src/app/review/page.tsx` | Architect | 2D cube net, edit controls, "Solve It!" button |
| 2.5.2 | Review page styles | `src/styles/review.css` | Designer | Centered cube net, color picker, glassmorphism panel |
| 2.5.3 | CubeNet2D component | `src/components/CubeNet2D.tsx` | Visualizer | SVG/Canvas cross layout: `[_U_] [L F R B] [_D_]`. 54 colored squares. Tap to select a facelet. |
| 2.5.4 | Color picker strip | `src/app/review/page.tsx` | Designer | 6-color strip (W/Y/R/O/B/G) — tap a color then tap a facelet to change it |
| 2.5.5 | Validation feedback | `src/app/review/page.tsx` | Solver | Run validation on current state, show errors inline: "⚠️ Found 10 red stickers (expected 9)" |
| 2.5.6 | "Solve It!" button | `src/app/review/page.tsx` | Architect | Disabled if state is invalid. On tap → run solver → navigate to `/solve` |
| 2.5.7 | "Re-scan" button | `src/app/review/page.tsx` | Architect | Navigate back to `/scan` preserving scanned data |

**Checkpoint 2.5:** User can view all 54 facelets, tap to edit colors, see validation errors, and proceed to solve.

---

### 2.6 3D Cube Renderer (Visualizer)

> Build the interactive 3D Rubik's cube with Three.js.

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 2.6.1 | CubeViewer3D component | `src/components/CubeViewer3D.tsx` | Visualizer | React Three Fiber canvas wrapping the 3D cube scene |
| 2.6.2 | 27 cubies mesh | `src/components/CubeViewer3D.tsx` | Visualizer | Create 27 `BoxGeometry` cubies (3×3×3 grid), properly spaced with small gaps |
| 2.6.3 | Face coloring | `src/components/CubeViewer3D.tsx` | Visualizer | Apply correct colors from `CubeState` to each cubie's 6 faces using `MeshStandardMaterial` array |
| 2.6.4 | Rounded edges | `src/components/CubeViewer3D.tsx` | Visualizer | `RoundedBoxGeometry` or beveled edges for premium look |
| 2.6.5 | Lighting setup | `src/components/CubeViewer3D.tsx` | Visualizer | Ambient light + 2 directional lights for soft shadows, subtle environment map |
| 2.6.6 | Touch rotation (OrbitControls) | `src/components/CubeViewer3D.tsx` | Visualizer | `@react-three/drei` OrbitControls — drag to rotate view, constrained (no flip) |
| 2.6.7 | Initial camera position | `src/components/CubeViewer3D.tsx` | Visualizer | Angled view showing F, R, U faces (classic isometric angle) |
| 2.6.8 | Dynamic import (SSR: false) | `src/components/CubeViewer3D.tsx` | Architect | `next/dynamic` with `ssr: false` since Three.js is client-only |
| 2.6.9 | Responsive sizing | `src/components/CubeViewer3D.tsx` | Visualizer | Canvas fills container, maintains aspect ratio, performant on mobile |

**Checkpoint 2.6:** 3D cube renders with correct colors, responds to touch rotation, looks premium.

---

### 2.7 Move Animation System (Visualizer)

> Animate face rotations on the 3D cube.

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 2.7.1 | Layer identification | `src/components/CubeViewer3D.tsx` | Visualizer | Given a `MoveData`, identify which 9 cubies belong to the target layer |
| 2.7.2 | Group-based rotation | `src/components/CubeViewer3D.tsx` | Visualizer | Parent 9 cubies to temporary `THREE.Group`, animate group rotation |
| 2.7.3 | Eased animation | `src/components/CubeViewer3D.tsx` | Visualizer | 500ms ease-in-out rotation using `requestAnimationFrame` or R3F `useFrame` |
| 2.7.4 | State update after animation | `src/components/CubeViewer3D.tsx` | Visualizer | After animation: update cubie positions/colors, unparent from group |
| 2.7.5 | `animateMove(move)` API | `src/components/CubeViewer3D.tsx` | Visualizer | Expose imperative method or prop-based trigger for parent to fire moves |
| 2.7.6 | Animation queue | `src/components/CubeViewer3D.tsx` | Visualizer | If multiple moves triggered rapidly, queue and execute sequentially |
| 2.7.7 | Reverse animation (Previous) | `src/components/CubeViewer3D.tsx` | Visualizer | When user taps "Previous", animate the inverse move |

**Checkpoint 2.7:** Can step through a 5-move solution seeing smooth 3D animations forward and backward.

---

### 2.8 Step-by-Step Solve Screen (Visualizer + Designer)

> The main solving interface — 3D cube + instructions + navigation.

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 2.8.1 | Solve page layout | `src/app/solve/page.tsx` | Architect | 3D cube (top), move info (middle), navigation (bottom) |
| 2.8.2 | Solve page styles | `src/styles/solve.css` | Designer | Premium layout, glassmorphism info card, gradient progress bar |
| 2.8.3 | StepGuide component | `src/components/StepGuide.tsx` | Visualizer | Shows: step counter ("Step 5 of 18"), notation (`R'`), plain-English label, face icon |
| 2.8.4 | Progress bar | `src/app/solve/page.tsx` | Designer | Animated gradient bar showing solve progress |
| 2.8.5 | Previous / Next buttons | `src/app/solve/page.tsx` | Visualizer | Large buttons (≥48px), disabled at boundaries, trigger animations |
| 2.8.6 | MoveArrow overlay | `src/components/MoveArrow.tsx` | Visualizer | Optional: animated arrow showing rotation direction on a 2D mini-cube |
| 2.8.7 | State synchronization | `src/app/solve/page.tsx` | Visualizer | Keep 3D cube state in sync with current step. Stepping forward/backward updates both visuals and internal state |
| 2.8.8 | Solve completion detection | `src/app/solve/page.tsx` | Visualizer | When last step is completed → navigate to `/done` (celebration screen) |

**Checkpoint 2.8:** Full step-by-step walkthrough works end-to-end: 3D animation plays for each move, Previous/Next work correctly, progress bar fills.

---

## Phase 3 — Polish & Mobile Optimization (Week 5–6)

### 3.1 PWA Configuration (DevOps)

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 3.1.1 | Create PWA manifest | `public/manifest.json` | DevOps | Per `mainidea.md` Section 6: `name`, `short_name`, `display: standalone`, `orientation: portrait`, `theme_color: #0F0F1A`, icons array |
| 3.1.2 | Generate icon set | `public/icons/` | DevOps | Generate icons at 72, 96, 120, 128, 144, 152, 167, 180, 192, 384, 512px |
| 3.1.3 | Apple-specific meta tags | `src/app/layout.tsx` | DevOps | `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon` |
| 3.1.4 | Service worker | `public/sw.js` | DevOps | Cache-first strategy for app shell, network-first for dynamic content |
| 3.1.5 | SW registration | `src/app/layout.tsx` | DevOps | Register service worker on app load |
| 3.1.6 | Offline fallback page | `public/offline.html` | DevOps | Graceful offline message when network unavailable |
| 3.1.7 | Lighthouse PWA audit | — | DevOps | Run Lighthouse, achieve score 100 |

**Checkpoint 3.1:** App installs on iPhone home screen, works offline, Lighthouse PWA = 100.

---

### 3.2 Celebration Screen (Visualizer + Designer)

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 3.2.1 | Done page layout | `src/app/done/page.tsx` | Architect | NEW route `/done` — celebration, stats, action buttons |
| 3.2.2 | Confetti component | `src/components/Confetti.tsx` | Visualizer | Canvas-based particle system: 200+ colored particles with gravity, rotation, spread |
| 3.2.3 | Celebration text | `src/app/done/page.tsx` | Designer | "🎉 Congratulations!" with scale-in animation |
| 3.2.4 | Solve statistics | `src/app/done/page.tsx` | Visualizer | Display: total moves, solve computation time, total user time (if timer enabled) |
| 3.2.5 | "Solve Again" button | `src/app/done/page.tsx` | Designer | Reset state → navigate to home |
| 3.2.6 | Confetti auto-cleanup | `src/components/Confetti.tsx` | Visualizer | Stop particle spawning after 3s, clean up canvas after particles settle |

**Checkpoint 3.2:** Celebration screen triggers after final step with confetti, stats, and restart option.

---

### 3.3 Color Calibration Mode (Scanner)

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 3.3.1 | Calibration UI flow | `src/app/settings/calibrate/page.tsx` | Scanner | Guide user to show each color to camera, capture HSV sample |
| 3.3.2 | HSV sampling per color | `src/lib/colorDetection.ts` | Scanner | Sample center region, calculate mean HSV ± 2σ for each of 6 colors |
| 3.3.3 | Save to localStorage | `src/lib/colorDetection.ts` | Scanner | Persist calibrated thresholds as JSON |
| 3.3.4 | Load calibrated thresholds | `src/lib/colorDetection.ts` | Scanner | On app start, check localStorage for custom thresholds, fallback to defaults |
| 3.3.5 | Reset calibration | `src/app/settings/page.tsx` | Scanner | Button to clear custom thresholds and restore defaults |

**Checkpoint 3.3:** Calibration mode lets user customize color thresholds for their lighting conditions.

---

### 3.4 Manual Color Entry (Scanner + Designer)

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 3.4.1 | Manual entry page | `src/app/manual/page.tsx` | Scanner | NEW route — 2D cube net with tap-to-color interface |
| 3.4.2 | Color palette selector | `src/app/manual/page.tsx` | Designer | 6-color strip at bottom, selected color highlighted |
| 3.4.3 | Tap-to-fill interaction | `src/app/manual/page.tsx` | Scanner | Tap a facelet to fill it with selected color |
| 3.4.4 | Auto-set centers | `src/app/manual/page.tsx` | Scanner | Center facelets pre-filled and locked (standard colors) |
| 3.4.5 | Navigate to review | `src/app/manual/page.tsx` | Scanner | When all 54 filled → navigate to `/review` |

**Checkpoint 3.4:** User can manually enter cube state without camera and proceed to solve.

---

### 3.5 Settings Screen (Designer + Architect)

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 3.5.1 | Settings page layout | `src/app/settings/page.tsx` | Architect | List of setting options per `mainidea.md` Section 6.2 |
| 3.5.2 | Settings page styles | `src/styles/settings.css` | Designer | Dark cards, toggle switches, premium feel |
| 3.5.3 | Calibrate colors link | `src/app/settings/page.tsx` | Scanner | Link to calibration flow |
| 3.5.4 | Sound on/off toggle | `src/app/settings/page.tsx` | Architect | Toggle with localStorage persistence |
| 3.5.5 | About section | `src/app/settings/page.tsx` | Architect | App version, credits, link to GitHub |

**Checkpoint 3.5:** Settings screen renders with working toggles and navigation.

---

### 3.6 Performance Optimization (DevOps + All Agents)

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 3.6.1 | Lazy load Three.js | `src/app/solve/page.tsx` | Architect | `next/dynamic` with `ssr: false` and loading spinner |
| 3.6.2 | Lazy load solver | `src/hooks/useSolver.ts` | Solver | Dynamic import of `cubejs`, initialize in background on app load |
| 3.6.3 | Bundle analysis | — | DevOps | Run `@next/bundle-analyzer`, ensure JS < 500KB gzipped initial load |
| 3.6.4 | Camera frame throttling | `src/hooks/useCamera.ts` | Scanner | Throttle color detection to every 3rd frame to reduce CPU usage |
| 3.6.5 | Three.js scene optimization | `src/components/CubeViewer3D.tsx` | Visualizer | Minimize draw calls, use `instancedMesh` if helpful, reduce polygon count |
| 3.6.6 | Lighthouse performance audit | — | DevOps | Run Lighthouse on all pages, target > 90 performance score |
| 3.6.7 | Image optimization | `public/` | DevOps | Convert all images to WebP, compress icons |

**Checkpoint 3.6:** Lighthouse Performance > 90, camera runs at 15+ FPS on iPhone SE, solver < 2 seconds.

---

### 3.7 Responsive Design & iOS Testing (Designer)

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 3.7.1 | Test at 375px (iPhone SE) | All CSS files | Designer | Verify layout, no overflow, readable text |
| 3.7.2 | Test at 390px (iPhone 14) | All CSS files | Designer | Verify layout |
| 3.7.3 | Test at 428px (iPhone 14 Pro Max) | All CSS files | Designer | Verify layout |
| 3.7.4 | Test at 768px (iPad mini) | All CSS files | Designer | Verify layout scales |
| 3.7.5 | Safe area insets | All CSS files | Designer | Verify `env(safe-area-inset-*)` works on notched iPhones |
| 3.7.6 | Camera overlay scaling | `src/styles/scan.css` | Designer | Grid overlay scales correctly across screen sizes |
| 3.7.7 | Real device test | — | Designer | Test complete flow on a physical iPhone via `npm run dev -- --hostname 0.0.0.0` |

**Checkpoint 3.7:** App works flawlessly across all iPhone models and iPad.

---

### 3.8 Sound Effects (Designer + Architect)

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 3.8.1 | Source sound files | `public/sounds/` | Designer | Click (button tap), Whoosh (face rotation), Success (solve complete), Camera (face confirmed) — all < 50KB MP3 |
| 3.8.2 | Sound utility | `src/lib/sounds.ts` | Architect | `playSound(name: SoundName)` — play from preloaded Audio objects, respects settings toggle |
| 3.8.3 | Wire up sound triggers | Various components | Architect | Button clicks, face confirmations, move animations, celebration |

**Checkpoint 3.8:** Sounds play at key moments, can be toggled off in settings.

---

## Phase 4 — Enhanced Features (Week 7–8)

### 4.1 Animations Polish (Designer)

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 4.1.1 | Page transition animations | `src/components/ui/PageTransition.tsx` | Designer | Framer Motion: slide-in/fade-out between routes |
| 4.1.2 | Micro-animations | `src/styles/animations.css` | Designer | Button hover glow, card hover lift, input focus glow |
| 4.1.3 | Loading states | Various components | Designer | Skeleton loaders or spinning cube for solver loading, camera loading |
| 4.1.4 | Home screen ambient animation | `src/styles/home.css` | Designer | Floating gradient orbs, subtle cube rotation in hero |

**Checkpoint 4.1:** Every interaction has subtle, polished animation feedback.

---

### 4.2 CI/CD Pipeline (DevOps)

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 4.2.1 | GitHub Actions CI | `.github/workflows/ci.yml` | DevOps | On push/PR: install → lint → type-check → test → build |
| 4.2.2 | Lighthouse CI | `.github/workflows/lighthouse.yml` | DevOps | Run on deploy preview, assert PWA=100, Perf>90 |
| 4.2.3 | Vercel deployment | `vercel.json` | DevOps | Configure production and preview deploys |
| 4.2.4 | Status badges | `README.md` | DevOps | CI status, Lighthouse score badges |

**Checkpoint 4.2:** Every push runs CI, deploys preview, runs Lighthouse.

---

### 4.3 Optional: Timer Feature (Architect)

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 4.3.1 | Timer component | `src/components/Timer.tsx` | Architect | Start/stop/reset timer, displayed on solve screen |
| 4.3.2 | Timer integration | `src/app/solve/page.tsx` | Architect | Optional: auto-start when solving begins, stop when complete |
| 4.3.3 | Time display on done screen | `src/app/done/page.tsx` | Architect | Show solve duration in celebration stats |

---

### 4.4 Optional: OpenRouter Vision Fallback (Architect)

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 4.4.1 | API route for OpenRouter | `src/app/api/vision/route.ts` | Architect | Server-side endpoint: receives image, calls OpenRouter with `qwen/qwen3.6-plus:free`, returns detected colors |
| 4.4.2 | Fallback trigger | `src/components/CameraScanner.tsx` | Scanner | If color detection confidence < 70%, offer "Use AI detection" button |
| 4.4.3 | Environment variable | `.env.local` | Architect | `OPENROUTER_API_KEY` — never exposed to client |

---

### 4.5 Documentation (Architect)

| # | Task | File(s) | Agent | Details |
|---|---|---|---|---|
| 4.5.1 | Architecture doc | `docs/ARCHITECTURE.md` | Architect | Module diagram, data flow, design decisions |
| 4.5.2 | Color detection doc | `docs/COLOR_DETECTION.md` | Scanner | HSV pipeline explanation, thresholds, calibration |
| 4.5.3 | Solving algorithm doc | `docs/SOLVING_ALGORITHM.md` | Solver | Kociemba explanation, performance characteristics |
| 4.5.4 | Final README | `README.md` | Architect | Complete setup guide, screenshots, contribution guide |

---

## Verification Plan

### Automated Tests
```bash
npm test                    # All unit tests (>80% coverage on src/lib/)
npm run test:integration    # Scan → Solve flow tests
npm run lint                # ESLint zero errors
npx tsc --noEmit            # TypeScript zero errors
npm run build               # Production build succeeds
npx lighthouse <url>        # PWA=100, Perf>90
```

### Manual Verification
| Test | Method |
|---|---|
| Camera works on iPhone Safari | Deploy to HTTPS, test on real device |
| Color detection accuracy > 95% | Test with real cube in various lighting |
| Son can follow instructions | User test with your son! |
| PWA installs on home screen | Safari → Share → Add to Home Screen |
| Offline mode works | Enable airplane mode after first visit |
| 3D animations are smooth | Verify 30+ FPS on iPhone SE |

---

## Open Questions

> [!IMPORTANT]
> Please confirm the pre-implementation decisions in the table at the top of this plan before I begin execution. If you approve the recommended defaults, just say "approved" and I'll start building.

---

## Total Task Count Summary

| Phase | Tasks | Agent Focus |
|---|---|---|
| **Phase 1** — Foundation & Scanning | **~45 tasks** | Designer, Scanner, Architect |
| **Phase 2** — Solver & 3D Visualization | **~42 tasks** | Solver, Visualizer, Designer |
| **Phase 3** — Polish & Optimization | **~30 tasks** | DevOps, Designer, All |
| **Phase 4** — Enhanced Features | **~15 tasks** | Architect, DevOps |
| **TOTAL** | **~132 tasks** | 6 agents |

---

*Plan version: 1.0.0*
*Derived from: `mainidea.md` v1.0*
*Created: April 3, 2026*
