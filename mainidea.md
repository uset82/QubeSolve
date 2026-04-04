# 🧊 QubeSolve — Project Specification & Main Idea

> **A mobile-first web app that uses your iPhone camera to see a scrambled Rubik's cube and guides you — step by step — to solve it.**
>
> *Built with ❤️ for a young cuber learning to conquer the 3×3×3.*

---

## 1. Vision & Purpose

### 1.1 The Problem
Learning to solve a Rubik's cube is intimidating. Tutorials exist on YouTube, but they require constant pausing, rewinding, and translating 2D notation into real-world hand moves. A child (or any beginner) needs a **personal, interactive coach** — not a lecture.

### 1.2 The Solution — QubeSolve
QubeSolve is a **Progressive Web App (PWA)** that:

1. **Sees** the cube through the iPhone camera (or any mobile/desktop webcam).
2. **Understands** the current scrambled state by detecting colors on all 6 faces.
3. **Calculates** an optimal or near-optimal solution.
4. **Teaches** the user each move with clear 3D animations, plain-language instructions, and visual cues — at the user's own pace.

### 1.3 Target Audience
| Audience | Needs |
|---|---|
| **Primary — Your son** | Fun, simple, visual, no jargon. Big buttons. Feels like a game. |
| **Secondary — Beginner cubers** | Step-by-step guidance, ability to pause/resume, progress tracking. |
| **Tertiary — Casual users** | "Just solve it for me" quick scan mode. |

---

## 2. Core User Flow

### User Journey Diagram

```
  🏠 Open App  →  📸 Scan Cube  →  ❓ All 6 faces?
                                        │
                          ┌─── No ──────┘
                          │
                          ▼
                  Guide: Rotate &
                  scan next face ──→ 📸 Scan again
                          
  All 6 scanned ──→ 🧠 Validate  →  ❓ Valid state?
                                         │
                           ┌── No ───────┘
                           ▼
                   ⚠️ Re-scan face ──→ 📸 Scan again
                           
  Valid ──→ 🎯 Step-by-Step Solution ──→ User does move
                                              │
                                    ┌── More steps? ──→ Next step
                                    │
                                    ▼
                              🎉 SOLVED! Congratulations!
```

### Step-by-step walkthrough:

1. **Launch** — User opens the app on iPhone (Safari "Add to Home Screen" for PWA).
2. **Scan** — Camera opens with an overlay grid. User holds one face of the cube in view. The app detects the 9 color tiles and confirms them visually.
3. **Rotate & Repeat** — On-screen instructions guide the user to rotate the cube and scan all 6 faces in the correct order.
4. **Validation** — The app validates the scanned state (exactly 9 of each color, valid corner/edge combinations).
5. **Solution** — A solving algorithm computes the move sequence.
6. **Step-by-Step Guide** — Each move is displayed with:
   - A **3D animated cube** showing the rotation.
   - **Text notation** (e.g., `R`, `U'`, `F2`) with a plain-English label (e.g., "Turn the right face clockwise").
   - **Arrow overlays** on a 2D cube diagram.
   - **Next / Previous** buttons so the user controls the pace.
7. **Celebration** — Confetti animation when the cube is solved! 🎊

---

## 3. Open-Source Foundation & Forking Strategy

> **IMPORTANT:** We will leverage two existing open-source projects to accelerate development significantly, adapting their core logic into a modern web application.

### 3.1 Reference Repository: QBR
| Property | Detail |
|---|---|
| **Repo** | [github.com/kkoomen/qbr](https://github.com/kkoomen/qbr) |
| **License** | MIT ✅ (fully permissive) |
| **Stars** | 653 |
| **Language** | Python 3 + OpenCV |
| **What it does** | Webcam-based color detection for all 6 faces, calibration mode, Kociemba solving algorithm |
| **What we take** | Color detection logic, HSV thresholding strategy, face scanning order, Kociemba solver integration |
| **What we change** | Port from desktop Python/OpenCV → browser-based JavaScript using WebRTC + Canvas API. Replace OpenCV with TensorFlow.js or pure JS color processing. |

**Key QBR features to port:**
- 🌈 Accurate color detection via HSV color space
- 🔍 3×3 grid detection (contour finding on webcam frames)
- 🔧 Calibration mode (user shows each color for custom thresholds)
- 🔠 Multilingual interface
- 📦 Kociemba two-phase algorithm for solving (via `kociemba` Python package → JS port)

### 3.2 Reference Repository: rubiks-cube
| Property | Detail |
|---|---|
| **Repo** | [github.com/ajdonich/rubiks-cube](https://github.com/ajdonich/rubiks-cube) |
| **License** | GPL-3.0 ⚠️ (copyleft — derivative works must also be GPL-3.0) |
| **Language** | Python (82% Jupyter Notebook, 18% Python) |
| **What it does** | Rubik's cube modeling, 3D visualization, CFOP algorithm, neural network exploration |
| **What we take** | Cube state modeling, CFOP solving strategy concepts, entropy/validation math |
| **What we change** | Rewrite cube model in JavaScript/TypeScript. Use Three.js for 3D visualization instead of Matplotlib. |

**Key rubiks-cube features to study:**
- 🧮 Cube state representation (facelet arrays, corner/edge encoding)
- 🧠 CFOP algorithm implementation (Cross → F2L → OLL → PLL)
- 📊 Notebooks with visual explanations (great reference for our step-by-step UI)

### 3.3 Forking Strategy

```
  Open Source References                    QubeSolve Project
  ========================                  ==================

  kkoomen/qbr (MIT) ─────────────────────→ Scanning Module
    • Color detection logic        ────→    (JS port of QBR color detection)
    • Kociemba integration         ────→  Solver Engine
                                            (Kociemba JS + CFOP guide)

  ajdonich/rubiks-cube (GPL-3.0) ────────→ Cube Model
    • Cube state representation    ────→    (Inspired by rubiks-cube concepts)
    • CFOP strategy                ────→  
    • 3D visualization             ────→  3D Visualization (Three.js)

                                          Web UI (Original PWA)
```

> **⚠️ GPL-3.0 Consideration:** Since `ajdonich/rubiks-cube` is GPL-3.0, we should **study its concepts** but **rewrite all code from scratch** if we want to keep QubeSolve under MIT license. If we directly copy GPL code, the entire project must be GPL-3.0. **Decision needed: MIT vs GPL-3.0 for QubeSolve.**

---

## 4. Technical Architecture

### 4.1 High-Level Architecture

```
  ╔═══════════════════════════════════════════════════╗
  ║              CLIENT — PWA (Browser)               ║
  ╠═══════════════════════════════════════════════════╣
  ║                                                   ║
  ║  📷 Camera Module ──→ 🎨 Color Detector           ║
  ║     (WebRTC + Canvas)    (JS Image Processing)    ║
  ║                              │                    ║
  ║                              ▼                    ║
  ║                     🧊 Cube State Manager         ║
  ║                              │                    ║
  ║                              ▼                    ║
  ║                     🧠 Solver Engine              ║
  ║                        (Kociemba WASM)            ║
  ║                              │                    ║
  ║                              ▼                    ║
  ║                     📖 Step Guide UI              ║
  ║                              │                    ║
  ║                              ▼                    ║
  ║                     🎮 3D Cube Viewer             ║
  ║                        (Three.js)                 ║
  ║                                                   ║
  ║  ⚙️ Service Worker (Offline PWA)                  ║
  ╚═══════════════════════════════════════════════════╝
                         │ (optional)
                         ▼
  ╔═══════════════════════════════════════╗
  ║         Optional Backend              ║
  ║  🌐 API Server  →  🤖 Gemini Vision  ║
  ║  (Node.js)         (Color fallback)   ║
  ╚═══════════════════════════════════════╝
```

### 4.2 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | **Next.js 14+ (App Router)** | SSR, PWA support, great DX, React ecosystem |
| **Language** | **TypeScript** | Type safety for complex cube math |
| **3D Rendering** | **Three.js + React Three Fiber** | Interactive 3D cube visualization & animation |
| **Camera Access** | **WebRTC (`getUserMedia`)** | Native browser camera API, works on iOS Safari |
| **Image Processing** | **Canvas API + custom JS** | Extract pixel colors from video frames, HSV conversion |
| **AI Fallback (optional)** | **Gemini 2.5 Pro Vision API** | For ambiguous color detection in poor lighting |
| **Cube Solver** | **Kociemba algorithm (WASM)** | Fast two-phase solver, runs entirely client-side |
| **Styling** | **Vanilla CSS + CSS Variables** | Full control, premium dark-mode design |
| **PWA** | **next-pwa / Service Worker** | Offline support, "Add to Home Screen" on iPhone |
| **Animations** | **Framer Motion** | Smooth step transitions, celebration effects |
| **Deployment** | **Vercel** | Zero-config Next.js hosting, HTTPS (required for camera) |

### 4.3 Key Technical Decisions

#### Camera & Color Detection (Client-Side)
```
iPhone Camera → WebRTC stream → Canvas frame capture →
  → Pixel sampling at 9 grid positions →
    → RGB → HSV conversion →
      → Color classification (W/Y/R/O/B/G) →
        → Face state array [9 colors]
```

- **Grid overlay**: Draw a 3×3 grid on the camera preview. User aligns the cube face within it.
- **Sampling**: Sample a small region (e.g., 20×20px) at the center of each grid cell.
- **HSV thresholds**: Use QBR's HSV ranges as defaults, with user calibration option.
- **Confirmation**: Show detected colors in real-time; user taps "Confirm" to lock in the face.

#### Cube State Representation
```
Standard Rubik's Cube notation for 54 facelets:

         U1 U2 U3
         U4 U5 U6
         U7 U8 U9

L1 L2 L3 F1 F2 F3 R1 R2 R3 B1 B2 B3
L4 L5 L6 F4 F5 F6 R4 R5 R6 B4 B5 B6
L7 L8 L9 F7 F8 F9 R7 R8 R9 B7 B8 B9

         D1 D2 D3
         D4 D5 D6
         D7 D8 D9

Faces: U(Up) D(Down) F(Front) B(Back) L(Left) R(Right)
Each facelet stores a color: W(White) Y(Yellow) R(Red) O(Orange) B(Blue) G(Green)
```

#### Kociemba Solver
- Use the **`cubejs`** npm package or **`min2phase`** WASM port.
- Input: 54-character string of facelet colors.
- Output: Solution string e.g., `"R U R' U' R' F R2 U' R' U' R U R' F'"`.
- Typical solution: **20 moves or fewer** (God's number).

---

## 5. Feature Specification

### 5.1 MVP Features (Phase 1)

| # | Feature | Description | Priority |
|---|---|---|---|
| F1 | **Camera Scanning** | Open camera, overlay 3×3 grid, detect face colors | 🔴 Critical |
| F2 | **Guided Face Order** | Instructions to rotate cube for all 6 faces | 🔴 Critical |
| F3 | **Color Confirmation** | Show detected colors, allow manual correction | 🔴 Critical |
| F4 | **Cube State Validation** | Verify 54 facelets form a valid cube state | 🔴 Critical |
| F5 | **Solution Calculation** | Compute move sequence via Kociemba | 🔴 Critical |
| F6 | **Step-by-Step Guide** | Navigate through moves with Previous/Next | 🔴 Critical |
| F7 | **3D Cube Animation** | Animated Three.js cube showing each move | 🔴 Critical |
| F8 | **Move Notation Display** | Show `R`, `U'`, `F2` with plain-English labels | 🟡 High |
| F9 | **PWA / Add to Home Screen** | Installable on iPhone, works offline | 🟡 High |
| F10 | **Celebration Screen** | Confetti + congratulations when solved | 🟡 High |

### 5.2 Enhanced Features (Phase 2)

| # | Feature | Description | Priority |
|---|---|---|---|
| F11 | **Color Calibration** | User shows each color to set custom thresholds | 🟡 High |
| F12 | **Manual Color Entry** | Tap grid to manually set colors (no camera) | 🟡 High |
| F13 | **Beginner Mode (CFOP)** | Teach layer-by-layer with explanations per stage | 🟢 Medium |
| F14 | **Timer** | Optional solve timer for speed tracking | 🟢 Medium |
| F15 | **Sound Effects** | Click sounds for moves, fanfare for completion | 🟢 Medium |
| F16 | **Dark Mode** | Premium dark theme (default) | 🟡 High |

### 5.3 Future Features (Phase 3)

| # | Feature | Description | Priority |
|---|---|---|---|
| F17 | **AI Vision (Gemini)** | Send camera frame to Gemini for robust detection | 🟢 Medium |
| F18 | **History / Stats** | Track solves, times, improvement over time | 🔵 Low |
| F19 | **Multiple Cube Sizes** | Support 2×2, 4×4 (stretch goal) | 🔵 Low |
| F20 | **Multiplayer / Share** | Share scramble challenges with friends | 🔵 Low |
| F21 | **AR Overlay** | Show arrows on the real cube via AR | 🔵 Low |
| F22 | **Multi-language** | English, Spanish, Norwegian, etc. | 🟢 Medium |

---

## 6. UI/UX Design Specification

### 6.1 Design Principles
1. **Kid-Friendly First** — Large touch targets (min 48px), playful colors, clear icons.
2. **Mobile-First** — Designed for iPhone SE through iPhone 15 Pro Max.
3. **Dark Mode Default** — Premium feel, easier on eyes, better camera contrast.
4. **Minimal Text, Maximum Visual** — Show, don't tell. Animations over paragraphs.
5. **Forgiving** — Easy undo, re-scan, manual override for every detection.

### 6.2 Screen Map

```
  🏠 Home Screen
  │  • Logo & tagline
  │  • "Scan My Cube" button
  │  • "Manual Entry" link
  │  • Settings gear icon
  │
  ├──→ 📸 Scan Screen
  │    │  • Live camera feed
  │    │  • 3×3 overlay grid
  │    │  • Detected colors display
  │    │  • "Confirm Face" button
  │    │  • Face counter (2/6)
  │    │  • Rotation instructions
  │    │
  │    ▼
  │    ✅ Review Screen
  │    │  • 2D unfolded cube
  │    │  • All 54 colors shown
  │    │  • Tap to edit any color
  │    │  • "Solve It!" button
  │    │
  │    ▼
  │    🎯 Solve Screen
  │    │  • 3D animated cube
  │    │  • Step counter (3/18)
  │    │  • Move notation (R U' F)
  │    │  • Plain English label
  │    │  • Arrow diagram
  │    │  • Prev / Next buttons
  │    │  • Progress bar
  │    │
  │    ▼
  │    🎉 Done Screen
  │       • Confetti animation
  │       • Solve stats
  │       • "Solve Again" button
  │       • "Share" button
  │
  └──→ ⚙️ Settings
       • Calibrate colors
       • Language
       • Sound on/off
       • Theme
       • About
```

### 6.3 Color Palette

```css
/* QubeSolve Design Tokens */
:root {
  /* Background */
  --bg-primary: #0F0F1A;        /* Deep dark blue-black */
  --bg-secondary: #1A1A2E;      /* Card backgrounds */
  --bg-glass: rgba(255,255,255,0.06); /* Glassmorphism panels */

  /* Accent */
  --accent-primary: #6C63FF;    /* Electric purple */
  --accent-secondary: #00D4AA;  /* Teal green */
  --accent-warm: #FF6B6B;       /* Coral red */

  /* Cube Colors (vibrant, slightly neon) */
  --cube-white:  #F0F0F0;
  --cube-yellow: #FFD93D;
  --cube-red:    #FF4444;
  --cube-orange: #FF8C00;
  --cube-blue:   #4488FF;
  --cube-green:  #44CC44;

  /* Text */
  --text-primary: #EAEAEA;
  --text-secondary: #8888AA;

  /* Gradients */
  --gradient-hero: linear-gradient(135deg, #6C63FF 0%, #00D4AA 100%);
  --gradient-card: linear-gradient(145deg, #1A1A2E 0%, #16213E 100%);
}
```

### 6.4 Typography
- **Headings**: `'Outfit', sans-serif` — Modern, geometric, playful.
- **Body**: `'Inter', sans-serif` — Clean, highly legible on small screens.
- **Mono (notation)**: `'JetBrains Mono', monospace` — For move notation display.

### 6.5 Key UI Components

#### Camera Overlay
```
┌──────────────────────────┐
│  ┌────┬────┬────┐        │
│  │    │    │    │  Face 2/6│
│  ├────┼────┼────┤  "Front"│
│  │    │    │    │        │
│  ├────┼────┼────┤        │
│  │    │    │    │        │
│  └────┴────┴────┘        │
│                          │
│  [🟥🟦🟧]  Detected      │
│  [🟩🟨🟥]  Colors        │
│  [🟦🟩🟧]                │
│                          │
│  ◄ Rotate cube left →    │
│  [ ✅ Confirm Face ]     │
└──────────────────────────┘
```

#### Step-by-Step Guide
```
┌──────────────────────────┐
│  Step 5 of 18        ━━━▶│
│  ════════════════════    │
│                          │
│     ┌─────────────┐      │
│     │  [3D CUBE]  │      │
│     │  Animated   │      │
│     │  Rotation   │      │
│     └─────────────┘      │
│                          │
│      R'  (R prime)       │
│  "Turn the RIGHT face    │
│   counter-clockwise"     │
│                          │
│  [◀ Prev]    [Next ▶]   │
└──────────────────────────┘
```

---

## 7. Solving Algorithm Strategy

### 7.1 Primary: Kociemba Two-Phase Algorithm
- **What**: Herbert Kociemba's algorithm finds near-optimal solutions (≤20 moves).
- **Why**: Fast (< 1 second), always finds short solutions, well-established.
- **How**: Use `cubejs` npm package or compile min2phase to WebAssembly.
- **Output**: Standard notation string, e.g., `"D2 R' D' F2 B D R2 D2 R' F2 D' R2 B2"`.

### 7.2 Secondary: Layer-by-Layer (Beginner Mode)
For teaching purposes, optionally break the solution into **CFOP stages**:

| Stage | Name | What it does | Approx Moves |
|---|---|---|---|
| 1 | **Cross** | Solve 4 edge pieces on the bottom layer | ~8 |
| 2 | **F2L** | First Two Layers — corners + edges | ~28 |
| 3 | **OLL** | Orient Last Layer — all yellow on top | ~10 |
| 4 | **PLL** | Permute Last Layer — final arrangement | ~12 |

In beginner mode, each stage has its own **intro screen** explaining the goal, making it educational.

### 7.3 Move Notation Reference
| Notation | Meaning | Plain English |
|---|---|---|
| `R` | Right face 90° clockwise | "Turn the right face clockwise" |
| `R'` | Right face 90° counter-clockwise | "Turn the right face counter-clockwise" |
| `R2` | Right face 180° | "Turn the right face twice" |
| `U` | Upper face 90° clockwise | "Turn the top clockwise" |
| `D` | Down face 90° clockwise | "Turn the bottom clockwise" |
| `F` | Front face 90° clockwise | "Turn the front face clockwise" |
| `B` | Back face 90° clockwise | "Turn the back face clockwise" |
| `L` | Left face 90° clockwise | "Turn the left face clockwise" |

---

## 8. Project Structure

```
qubesolve/
├── mainidea.md              # ← This file
├── README.md                # Project overview & setup instructions
├── package.json             # Dependencies & scripts
├── next.config.js           # Next.js configuration
├── tsconfig.json            # TypeScript configuration
│
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service worker
│   ├── icons/               # App icons (multiple sizes)
│   └── sounds/              # UI sound effects
│
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # Root layout (fonts, theme)
│   │   ├── page.tsx         # Home screen
│   │   ├── scan/
│   │   │   └── page.tsx     # Camera scanning screen
│   │   ├── review/
│   │   │   └── page.tsx     # Review & edit scanned state
│   │   ├── solve/
│   │   │   └── page.tsx     # Step-by-step solve screen
│   │   └── settings/
│   │       └── page.tsx     # Settings screen
│   │
│   ├── components/
│   │   ├── CubeViewer3D.tsx     # Three.js 3D cube component
│   │   ├── CameraScanner.tsx    # WebRTC camera + grid overlay
│   │   ├── ColorDetector.tsx    # Color detection logic
│   │   ├── CubeNet2D.tsx        # 2D unfolded cube display
│   │   ├── StepGuide.tsx        # Move instruction display
│   │   ├── MoveArrow.tsx        # Arrow animation for moves
│   │   ├── Confetti.tsx         # Celebration animation
│   │   └── ui/                  # Shared UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── ProgressBar.tsx
│   │
│   ├── lib/
│   │   ├── cubeState.ts         # Cube state management
│   │   ├── colorDetection.ts    # HSV color detection (ported from QBR)
│   │   ├── solver.ts            # Kociemba solver wrapper
│   │   ├── validation.ts        # Cube state validation
│   │   ├── moveParser.ts        # Parse notation → animation data
│   │   └── constants.ts         # Colors, thresholds, face order
│   │
│   ├── hooks/
│   │   ├── useCamera.ts         # Camera access hook
│   │   ├── useCubeState.ts      # Global cube state hook
│   │   └── useSolver.ts         # Solver computation hook
│   │
│   └── styles/
│       ├── globals.css          # Design tokens, reset, base styles
│       ├── home.css             # Home screen styles
│       ├── scan.css             # Scanner screen styles
│       ├── solve.css            # Solve screen styles
│       └── animations.css       # Keyframe animations
│
├── reference/                   # Forked reference code (not deployed)
│   ├── qbr/                     # Fork of kkoomen/qbr
│   └── rubiks-cube/             # Fork of ajdonich/rubiks-cube
│
└── docs/
    ├── ARCHITECTURE.md          # Technical architecture details
    ├── COLOR_DETECTION.md       # How color detection works
    └── SOLVING_ALGORITHM.md     # Algorithm documentation
```

---

## 9. Development Phases & Timeline

### Phase 1 — Foundation & Scanning (Week 1-2)
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up PWA manifest & service worker
- [ ] Implement design system (CSS variables, fonts, dark theme)
- [ ] Build Home screen with premium UI
- [ ] Implement WebRTC camera access (`useCamera` hook)
- [ ] Build camera overlay with 3×3 grid
- [ ] Port QBR's color detection to JavaScript
- [ ] Implement face scanning with visual confirmation
- [ ] Build guided rotation instructions (scan all 6 faces)

### Phase 2 — Solving Engine & 3D Visualization (Week 3-4)
- [ ] Implement cube state representation (54 facelets)
- [ ] Integrate Kociemba solver (npm package or WASM)
- [ ] Build cube state validation
- [ ] Create 3D cube with Three.js / React Three Fiber
- [ ] Implement move animations (smooth face rotations)
- [ ] Build step-by-step guide UI (previous/next navigation)
- [ ] Add move notation with plain-English descriptions
- [ ] Build 2D cube net for review screen

### Phase 3 — Polish & Mobile Optimization (Week 5-6)
- [ ] Full PWA support (offline, installable)
- [ ] iOS Safari testing & optimization
- [ ] Color calibration mode
- [ ] Manual color entry fallback
- [ ] Celebration screen with confetti
- [ ] Sound effects
- [ ] Performance optimization (camera frame rate, solver speed)
- [ ] Responsive design across iPhone models

### Phase 4 — Enhanced Features (Week 7-8)
- [ ] Beginner/CFOP mode with stage explanations
- [ ] Timer feature
- [ ] Gemini Vision API fallback for color detection
- [ ] Multi-language support (English, Spanish)
- [ ] History & stats tracking
- [ ] Deploy to Vercel with custom domain

---

## 10. Technical Deep Dives

### 10.1 Color Detection Pipeline (Ported from QBR)

```javascript
// Simplified color detection flow (ported from QBR's Python/OpenCV approach)

function detectFaceColors(videoFrame, gridPositions) {
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoFrame, 0, 0);

  const colors = gridPositions.map(({ x, y, size }) => {
    // Sample a region of pixels at each grid cell center
    const imageData = ctx.getImageData(x - size/2, y - size/2, size, size);
    const avgRGB = getAverageColor(imageData);
    const hsv = rgbToHsv(avgRGB.r, avgRGB.g, avgRGB.b);
    return classifyColor(hsv);
  });

  return colors; // Array of 9 color names
}

function classifyColor({ h, s, v }) {
  // HSV thresholds (derived from QBR's calibration ranges)
  if (v < 50) return 'unknown';
  if (s < 40 && v > 180) return 'white';
  if (h < 10 || h > 340) return 'red';
  if (h >= 10 && h < 40) return 'orange';
  if (h >= 40 && h < 80) return 'yellow';
  if (h >= 80 && h < 170) return 'green';
  if (h >= 170 && h < 260) return 'blue';
  return 'unknown';
}
```

### 10.2 Cube Scanning Order (from QBR)

The user must scan faces in a specific order for the solver to interpret the state correctly:

1. **Front (F)** — Green center facing camera, White on top
2. **Right (R)** — Rotate cube 90° right
3. **Back (B)** — Rotate cube 90° right again
4. **Left (L)** — Rotate cube 90° right again
5. **Up (U)** — Tilt cube forward (White now faces camera)
6. **Down (D)** — Tilt cube backward past start (Yellow faces camera)

### 10.3 Kociemba Solver Integration

```typescript
import Cube from 'cubejs';

// Initialize solver (may take a few seconds to build lookup tables)
Cube.initSolver();

function solveCube(facelets: string): string[] {
  // facelets: 54-char string e.g., "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
  const cube = Cube.fromString(facelets);
  const solution = cube.solve();
  return solution.split(' '); // ["R", "U'", "F2", ...]
}
```

### 10.4 3D Cube Animation (Three.js)

```typescript
// Pseudo-code for animating a face rotation
function animateMove(move: string, duration: number = 500) {
  const { axis, angle, layer } = parseMoveNotation(move);
  // axis: 'x' | 'y' | 'z'
  // angle: Math.PI/2 (90°), -Math.PI/2 (-90°), Math.PI (180°)
  // layer: which slice to rotate

  // Group the 9 cubies on the target layer
  const group = new THREE.Group();
  getCubiesOnLayer(layer).forEach(cubie => group.add(cubie));
  scene.add(group);

  // Animate rotation using requestAnimationFrame or Framer Motion
  animateRotation(group, axis, angle, duration, () => {
    // After animation: update internal state, un-group cubies
    updateCubeState(move);
    ungroupCubies(group);
  });
}
```

---

## 11. iOS / iPhone Specific Considerations

| Concern | Solution |
|---|---|
| **Camera access in Safari** | Use `navigator.mediaDevices.getUserMedia()` with `{ facingMode: 'environment' }` for rear camera |
| **PWA limitations on iOS** | iOS Safari supports PWA but with caveats: no push notifications, limited background processing. Service worker caching works fine. |
| **Add to Home Screen** | Include proper `manifest.json` with `display: standalone`, icons at 120×120, 152×152, 167×167, 180×180 |
| **Safe area (notch)** | Use `env(safe-area-inset-*)` CSS variables |
| **Touch targets** | Minimum 48×48px for all interactive elements |
| **Haptic feedback** | Not available in web, but can use subtle animations as substitute |
| **Landscape mode** | Lock to portrait via manifest or CSS media query |
| **Performance** | Keep Three.js scene lightweight, use `requestAnimationFrame` throttling |

---

## 12. Deployment & Distribution

### 12.1 Hosting
- **Platform**: Vercel (optimized for Next.js)
- **Domain**: `qubesolve.app` or `qubesolve.vercel.app`
- **HTTPS**: Required (mandatory for camera access)
- **CDN**: Automatic via Vercel Edge Network

### 12.2 Installation on iPhone
1. Open `qubesolve.app` in Safari
2. Tap Share button (↑)
3. Tap "Add to Home Screen"
4. App icon appears on home screen
5. Opens full-screen without Safari UI

### 12.3 No App Store Required
Since this is a PWA, there's **no need for an Apple Developer account or App Store submission**. The app is instantly available via URL, updatable without user action, and works offline after first visit.

---

## 13. Success Metrics

| Metric | Target | How to Measure |
|---|---|---|
| **Scan accuracy** | > 95% correct color detection | Automated test suite with cube images |
| **Solve time** | < 2 seconds to compute solution | Performance profiling |
| **Step clarity** | Son can follow without help | User testing (your son!) |
| **PWA score** | 100 on Lighthouse PWA audit | Lighthouse CI |
| **Mobile perf** | > 90 Lighthouse performance | Lighthouse CI |
| **Camera FPS** | > 15 FPS on iPhone SE | Performance monitoring |

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Poor color detection in bad lighting | Can't scan cube | Calibration mode + manual entry fallback + Gemini Vision AI |
| iOS Safari camera quirks | App doesn't work on iPhone | Early testing on real devices, progressive enhancement |
| Kociemba solver too slow in browser | Bad UX waiting for solution | Pre-built lookup tables, Web Worker for background computation |
| Three.js performance on older iPhones | Laggy animations | Reduce polygon count, use CSS fallback for 2D mode |
| GPL-3.0 licensing conflict | Legal issues | Rewrite all GPL-sourced code from scratch, keep as reference only |
| Child finds it too complex | Defeats the purpose | User test early and often with your son, simplify relentlessly |

---

## 15. Open Questions for Review

> **Please review these decisions before we begin implementation:**

1. **License**: Should QubeSolve be **MIT** (requires clean-room reimplementation of GPL code) or **GPL-3.0** (simpler if borrowing from rubiks-cube)?

2. **Backend**: Should we go **100% client-side** (simpler, offline-first) or include a **lightweight backend** for Gemini Vision fallback?

3. **Solver Library**: Prefer **`cubejs`** (pure JS, larger bundle) or **min2phase WASM** (smaller, faster, more complex build)?

4. **Beginner Mode**: Should Phase 1 include CFOP layer-by-layer teaching, or save it for Phase 2?

5. **Language**: Start with English only, or English + Spanish from day one?

6. **Domain**: Any preference for the domain name? (`qubesolve.app`, `qbsolve.com`, etc.)

---

*Document created: April 3, 2026*
*Project: QubeSolve (qubesolve)*
*Author: Carlos & Antigravity AI*
*Status: 📋 Specification — Awaiting Review*
