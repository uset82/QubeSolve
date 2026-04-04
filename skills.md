# SKILLS.md — QubeSolve Agent Skills Registry

> Defines the capabilities, tools, and expertise each agent possesses.
> Follows the [AgentSkills specification](https://agentskills.io/specification) and [OpenAI Codex Skills](https://developers.openai.com/codex/skills).

---

## Overview

Skills are bundles of instructions, scripts, and domain knowledge that agents use to accomplish specialized tasks. Each skill is owned by a specific agent and defines:

- **What** the agent can do (capability)
- **How** to execute it (procedure + tools)
- **When** to apply it (trigger conditions)
- **Outputs** expected upon completion

---

## 🏗️ Architect Skills

### SKILL: `project-init`
| Field | Value |
|---|---|
| **Description** | Initialize a Next.js 14+ project with TypeScript, configured for PWA |
| **Trigger** | Project directory is empty or `package.json` does not exist |
| **Tools** | `npx`, `npm`, terminal commands |
| **Procedure** |
1. Run `npx -y create-next-app@latest ./ --typescript --app --eslint --no-tailwind --src-dir --import-alias "@/*"`
2. Install core dependencies: `three`, `@react-three/fiber`, `@react-three/drei`, `framer-motion`, `cubejs`
3. Install dev dependencies: `@types/three`, `eslint-config-next`
4. Configure `tsconfig.json` with strict mode and path aliases
5. Create directory structure per `mainidea.md` Section 8
6. Initialize git repository with `.gitignore`

**Output:** Working Next.js project that compiles with `npm run build`

---

### SKILL: `dependency-audit`
| Field | Value |
|---|---|
| **Description** | Audit and manage npm dependencies for security and compatibility |
| **Trigger** | Before any new dependency addition or on security alert |
| **Tools** | `npm audit`, `npm outdated`, `npx depcheck` |
| **Procedure** |
1. Run `npm audit` and resolve critical/high vulnerabilities
2. Check for unused dependencies with `npx depcheck`
3. Verify all dependencies are compatible with Next.js 14+ and React 18+
4. Ensure no GPL-3.0 transitive dependencies are introduced
5. Update `package.json` with pinned versions

**Output:** Clean audit report, updated `package.json`

---

### SKILL: `architecture-review`
| Field | Value |
|---|---|
| **Description** | Review module boundaries and interface contracts |
| **Trigger** | When any agent proposes changes to `src/lib/` interfaces |
| **Tools** | TypeScript compiler, ESLint |
| **Procedure** |
1. Verify TypeScript interfaces are properly exported
2. Check for circular dependencies between modules
3. Ensure all public functions have JSDoc comments
4. Validate that no UI components import directly from other agents' domains
5. Run `npm run build` to confirm no type errors

**Output:** Approved or rejected change with specific feedback

---

## 📷 Scanner Skills

### SKILL: `camera-setup`
| Field | Value |
|---|---|
| **Description** | Initialize WebRTC camera access with iOS Safari compatibility |
| **Trigger** | User navigates to scan screen |
| **Tools** | WebRTC API, Canvas API |
| **Procedure** |
1. Request camera permission via `navigator.mediaDevices.getUserMedia()`
2. Configure constraints: `{ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } }`
3. Attach stream to hidden `<video>` element
4. Set up `requestAnimationFrame` loop to draw frames to `<canvas>`
5. Handle permission denied with user-friendly fallback message
6. Handle unsupported browsers with graceful degradation

**Output:** Active camera feed rendered to canvas at ≥15 FPS

---

### SKILL: `color-detection`
| Field | Value |
|---|---|
| **Description** | Detect and classify Rubik's cube face colors from a camera frame |
| **Trigger** | Camera frame is captured and grid overlay is aligned |
| **Tools** | Canvas API, custom HSV conversion, pixel sampling |
| **Procedure** |
1. Capture current video frame to canvas
2. Calculate 9 grid cell center positions from overlay geometry
3. For each cell: sample a 20×20px region at cell center
4. Calculate average RGB from sampled pixels
5. Convert RGB → HSV using standard formula
6. Classify HSV values against threshold table:
   - White: `S < 40, V > 180`
   - Red: `H < 10 OR H > 340`
   - Orange: `10 ≤ H < 40`
   - Yellow: `40 ≤ H < 80`
   - Green: `80 ≤ H < 170`
   - Blue: `170 ≤ H < 260`
7. Return array of 9 classified colors
8. Display detected colors in real-time preview

**Output:** `FaceColors[9]` array with confidence scores

---

### SKILL: `color-calibration`
| Field | Value |
|---|---|
| **Description** | Allow user to calibrate custom color thresholds |
| **Trigger** | User enters calibration mode from settings |
| **Tools** | Canvas API, localStorage |
| **Procedure** |
1. Display instructions: "Hold the WHITE face to the camera"
2. Sample center region and record HSV range for white
3. Repeat for Yellow, Red, Orange, Blue, Green
4. Calculate optimal HSV boundaries from samples (mean ± 2σ)
5. Save calibrated thresholds to `localStorage`
6. Validate calibration by asking user to show a known face
7. Show success/failure feedback

**Output:** Calibrated HSV threshold table saved to localStorage

---

### SKILL: `face-scanning-guide`
| Field | Value |
|---|---|
| **Description** | Guide user through scanning all 6 faces in correct order |
| **Trigger** | User starts scanning flow |
| **Tools** | State machine, UI overlay |
| **Procedure** |
1. Initialize scan state: `{ scannedFaces: 0, faceOrder: ['F','R','B','L','U','D'] }`
2. Display instruction for current face with 3D rotation hint
3. Wait for user to align cube and confirm detection
4. On confirm: validate detected colors, save face state
5. Advance to next face with rotation instruction animation
6. After 6 faces: validate complete cube state
7. If invalid: highlight problematic face, offer re-scan

**Output:** Complete `CubeState[54]` array ready for solver

---

## 🧠 Solver Skills

### SKILL: `cube-state-validation`
| Field | Value |
|---|---|
| **Description** | Validate that 54 scanned facelets form a legal Rubik's cube state |
| **Trigger** | All 6 faces have been scanned |
| **Tools** | TypeScript logic, combinatorial validation |
| **Procedure** |
1. Verify exactly 9 facelets of each of the 6 colors
2. Verify center pieces match expected face assignments
3. Validate corner piece combinations (8 corners, each with 3 colors)
4. Validate edge piece combinations (12 edges, each with 2 colors)
5. Check corner orientation sum (must be divisible by 3)
6. Check edge orientation sum (must be divisible by 2)
7. Check permutation parity (corners and edges must match)

**Output:** `{ valid: boolean, errors: ValidationError[] }`

---

### SKILL: `kociemba-solve`
| Field | Value |
|---|---|
| **Description** | Compute optimal solution using Kociemba two-phase algorithm |
| **Trigger** | Valid cube state is confirmed |
| **Tools** | `cubejs` npm package or min2phase WASM, Web Worker |
| **Procedure** |
1. Convert `CubeState[54]` to Kociemba input string format
2. Spawn Web Worker to avoid blocking UI thread
3. Call `Cube.fromString(facelets).solve()`
4. Parse solution string into array of moves
5. Validate solution length ≤ 20 moves
6. Post solution back to main thread
7. Handle edge case: already-solved cube (empty solution)

**Output:** `Solution { moves: Move[], totalSteps: number, computeTimeMs: number }`

---

### SKILL: `move-parsing`
| Field | Value |
|---|---|
| **Description** | Parse Rubik's cube notation into structured animation data |
| **Trigger** | Solution has been computed |
| **Tools** | TypeScript parser |
| **Procedure** |
1. Split solution string by spaces: `"R U' F2"` → `["R", "U'", "F2"]`
2. For each move token, extract:
   - `face`: R/L/U/D/F/B
   - `direction`: CW (none), CCW ('), 180° (2)
   - `axis`: x/y/z mapping
   - `angle`: π/2, -π/2, or π
   - `layer`: which slice indices to rotate
3. Generate plain-English label for each move
4. Return array of `MoveData` objects

**Output:** `MoveData[] { face, direction, axis, angle, layer, label, notation }`

---

## 🎮 Visualizer Skills

### SKILL: `cube-3d-render`
| Field | Value |
|---|---|
| **Description** | Render an interactive 3D Rubik's cube using Three.js |
| **Trigger** | Cube state data is available |
| **Tools** | Three.js, React Three Fiber, `@react-three/drei` |
| **Procedure** |
1. Create 27 cubies (3×3×3 grid) as `BoxGeometry` meshes
2. Apply face colors from cube state to each cubie's materials
3. Add rounded edges and subtle bevel for premium look
4. Set up OrbitControls for touch-based rotation (constrained)
5. Configure lighting: ambient + directional with soft shadows
6. Set camera position for optimal initial view angle
7. Enable touch interaction: drag to rotate cube view

**Output:** Interactive 3D cube rendered in canvas, responding to touch

---

### SKILL: `move-animation`
| Field | Value |
|---|---|
| **Description** | Animate a single face rotation on the 3D cube |
| **Trigger** | User advances to next step in solution guide |
| **Tools** | Three.js groups, `requestAnimationFrame`, easing functions |
| **Procedure** |
1. Receive `MoveData` for current step
2. Identify 9 cubies on the target face layer
3. Create temporary `THREE.Group` and parent the 9 cubies to it
4. Animate group rotation over 500ms using ease-in-out curve
5. On animation complete: update internal cubie positions
6. Unparent cubies from group, destroy group
7. Update cube state to reflect new arrangement
8. Emit `animationComplete` event

**Output:** Smooth 500ms face rotation animation at 60 FPS target

---

### SKILL: `cube-net-2d`
| Field | Value |
|---|---|
| **Description** | Render a 2D unfolded cube net showing all 54 facelets |
| **Trigger** | Review screen, settings, or minimap display |
| **Tools** | SVG or Canvas 2D |
| **Procedure** |
1. Layout 6 faces in cross pattern: `[_U_] [L F R B] [_D_]`
2. Draw 9 colored squares per face with 1px gap
3. Add face labels (U/D/F/B/L/R) in subtle text
4. Make each facelet tappable for manual color editing
5. Highlight the current face being scanned (pulsing border)

**Output:** Interactive 2D cube net SVG/Canvas component

---

### SKILL: `celebration-effects`
| Field | Value |
|---|---|
| **Description** | Display celebration animations when the cube is solved |
| **Trigger** | User completes the final step |
| **Tools** | Canvas 2D particles, CSS animations, optional Web Audio |
| **Procedure** |
1. Trigger confetti burst from center of screen
2. Spawn 200+ colored particles with physics (gravity, spread, rotation)
3. Display "🎉 Congratulations!" text with scale-in animation
4. Show solve statistics (time, moves, etc.)
5. Provide "Solve Again" and "Share" buttons
6. Auto-cleanup particles after 3 seconds

**Output:** Confetti animation + congratulations screen

---

## 🎨 Designer Skills

### SKILL: `design-system-init`
| Field | Value |
|---|---|
| **Description** | Initialize the CSS design system with tokens, reset, and base styles |
| **Trigger** | Project is initialized, before any component work begins |
| **Tools** | Vanilla CSS, Google Fonts |
| **Procedure** |
1. Create `src/styles/globals.css` with CSS custom properties from `mainidea.md` Section 6.3
2. Import Google Fonts: Outfit (headings), Inter (body), JetBrains Mono (notation)
3. Implement CSS reset (normalize box-sizing, margin, padding)
4. Define spacing scale: `--space-xs` through `--space-3xl`
5. Define border-radius tokens: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`
6. Define shadow tokens for glassmorphism effects
7. Define transition tokens for micro-animations
8. Set up responsive breakpoints: 375px, 428px, 768px, 1024px
9. Configure safe area insets for iOS notch

**Output:** Complete `globals.css` design system file

---

### SKILL: `component-styling`
| Field | Value |
|---|---|
| **Description** | Style a UI component using the design system tokens |
| **Trigger** | New component is being built |
| **Tools** | Vanilla CSS modules, CSS custom properties |
| **Procedure** |
1. Create a CSS file named after the component (e.g., `Button.css`)
2. Use only design system tokens — no hardcoded colors, sizes, or fonts
3. Implement mobile-first responsive styles
4. Add hover, focus, and active states for interactive elements
5. Ensure minimum 48×48px touch targets
6. Add subtle micro-animations for state transitions
7. Test across light/dark themes (if applicable)

**Output:** Styled component meeting accessibility and design standards

---

### SKILL: `responsive-audit`
| Field | Value |
|---|---|
| **Description** | Audit all screens for responsive behavior across target devices |
| **Trigger** | Before any release or milestone completion |
| **Tools** | Chrome DevTools device simulation, real device testing |
| **Procedure** |
1. Test at breakpoints: 375px (iPhone SE), 390px (iPhone 14), 428px (iPhone 14 Pro Max), 768px (iPad mini), 1024px (iPad)
2. Verify no horizontal overflow on any screen
3. Verify all text is readable without zooming
4. Verify all touch targets are ≥48×48px
5. Verify safe area insets don't clip content
6. Verify camera overlay scales correctly
7. Screenshot each screen at each breakpoint

**Output:** Responsive audit report with screenshots and issues

---

## 🔧 DevOps Skills

### SKILL: `pwa-setup`
| Field | Value |
|---|---|
| **Description** | Configure Progressive Web App manifest and service worker |
| **Trigger** | After project initialization |
| **Tools** | `next-pwa` or manual service worker, manifest generator |
| **Procedure** |
1. Create `public/manifest.json` with:
   - `name`: "QubeSolve"
   - `short_name`: "QubeSolve"
   - `display`: "standalone"
   - `orientation`: "portrait"
   - `theme_color`: "#0F0F1A"
   - `background_color`: "#0F0F1A"
   - `icons`: all required sizes (72–512px)
   - `start_url`: "/"
   - `scope`: "/"
2. Generate icon set from app logo at required sizes
3. Create `public/sw.js` service worker with cache-first strategy
4. Register service worker in `src/app/layout.tsx`
5. Add `<link rel="manifest">` and iOS meta tags to `<head>`
6. Configure `next.config.js` for PWA headers

**Output:** Installable PWA passing Lighthouse PWA audit

---

### SKILL: `ci-pipeline`
| Field | Value |
|---|---|
| **Description** | Set up GitHub Actions CI/CD pipeline |
| **Trigger** | Repository is created on GitHub |
| **Tools** | GitHub Actions YAML, Vercel CLI |
| **Procedure** |
1. Create `.github/workflows/ci.yml`:
   - Trigger on push to `main` and PRs
   - Steps: checkout → install → lint → type-check → test → build
2. Create `.github/workflows/lighthouse.yml`:
   - Run Lighthouse CI on deployed preview URL
   - Assert PWA score = 100, Performance > 90
3. Configure Vercel project for automatic deploys from `main`
4. Set up branch preview deploys for PRs
5. Add status badges to `README.md`

**Output:** Automated CI/CD pipeline with quality gates

---

### SKILL: `performance-audit`
| Field | Value |
|---|---|
| **Description** | Run performance analysis and optimization |
| **Trigger** | Before release milestones or when performance regressions detected |
| **Tools** | Lighthouse, Chrome DevTools, `next/bundle-analyzer` |
| **Procedure** |
1. Run Lighthouse on all pages (Home, Scan, Review, Solve, Done)
2. Analyze bundle size with `@next/bundle-analyzer`
3. Check Three.js scene for polygon count and GPU memory usage
4. Profile camera frame processing time
5. Profile Kociemba solver execution time
6. Identify and fix largest render-blocking resources
7. Verify lazy loading for Three.js and solver modules

**Output:** Performance report with Lighthouse scores and optimization recommendations

---

## Cross-Agent Skills

### SKILL: `e2e-flow-test`
| Field | Value |
|---|---|
| **Description** | Validate the complete user flow from scan to solve |
| **Trigger** | Integration testing phase |
| **Agents** | All agents collaboratively |
| **Procedure** |
1. Launch app and verify home screen renders
2. Navigate to scan screen and verify camera initializes
3. Simulate (or perform) scanning 6 faces with test data
4. Verify review screen shows correct 54 facelets
5. Trigger solve and verify solution is computed
6. Step through all solution moves verifying 3D animations
7. Complete final step and verify celebration screen
8. Verify PWA installability and offline functionality

**Output:** Pass/fail report for complete user journey

---

*Skills registry version: 1.0.0*
*Compatible with: AgentSkills specification, OpenAI Codex Skills, Anthropic Claude Skills*
*Last updated: April 3, 2026*
