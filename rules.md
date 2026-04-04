# RULES.md — QubeSolve Agent Governance & Behavioral Rules

> Defines how agents must behave, constraints they must follow, and policies governing the project.
> Follows [OpenAI Codex Rules](https://developers.openai.com/codex/rules) and industry best practices.

---

## 1. Universal Agent Rules

These rules apply to **ALL agents** working on the QubeSolve project, without exception.

### 1.1 Source of Truth
- **`mainidea.md`** is the authoritative product specification. All implementation decisions must align with it.
- **`AGENTS.md`** defines agent roles and ownership. Respect agent boundaries.
- **`skills.md`** defines capabilities. Use the documented procedures.
- **This file (`rules.md`)** governs behavior. Follow every rule.

### 1.2 Code Quality Standards
- All code must be written in **TypeScript** with strict mode enabled.
- All public functions and interfaces must have **JSDoc comments**.
- All files must pass **ESLint** with zero errors before commit.
- All files must pass **TypeScript compiler** (`tsc --noEmit`) with zero errors.
- Maximum file length: **300 lines**. If a file exceeds this, refactor into smaller modules.
- No `any` types unless explicitly justified with a `// eslint-disable-next-line` comment explaining why.
- No `console.log` in production code. Use a structured logger or remove before commit.

### 1.3 Naming Conventions
| Entity | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `CubeViewer3D.tsx` |
| Files (utilities) | camelCase | `colorDetection.ts` |
| Files (styles) | kebab-case or camelCase | `globals.css`, `home.css` |
| Components | PascalCase | `CameraScanner` |
| Functions | camelCase | `detectFaceColors()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_SOLVE_TIME_MS` |
| CSS variables | kebab-case with `--` prefix | `--bg-primary` |
| Types/Interfaces | PascalCase with `I` prefix optional | `CubeState`, `MoveData` |
| Hooks | camelCase with `use` prefix | `useCamera`, `useCubeState` |

### 1.4 File Ownership
- **Never modify files owned by another agent** without explicit Architect approval.
- Ownership is defined in `AGENTS.md` under each agent's `Owns` field.
- If a change requires modifying files across agent boundaries, the Architect must coordinate.
- Shared interfaces in `src/lib/` require agreement from all consuming agents before modification.

### 1.5 Git & Version Control
- **Commit messages** must follow Conventional Commits format:
  - `feat(scanner): add HSV color classification`
  - `fix(solver): handle already-solved cube edge case`
  - `style(designer): update button hover states`
  - `docs(architect): update ARCHITECTURE.md with module diagram`
  - `test(solver): add validation test for invalid corner orientations`
  - `chore(devops): configure Lighthouse CI threshold`
- **Branch naming**: `agent/description` (e.g., `scanner/camera-setup`, `solver/kociemba-integration`)
- **Never force push** to `main`.
- **Never commit** `node_modules/`, `.next/`, `.env.local`, or sensitive credentials.

---

## 2. Licensing Rules

### 2.1 License Compliance
- QubeSolve is licensed under **MIT**.
- All code must be **original** or sourced from **MIT/Apache-2.0/BSD** licensed projects.
- **GPL-3.0 code must NEVER be copied, adapted, or derived from.**
- Specifically regarding reference repositories:
  - `kkoomen/qbr` (MIT ✅): May study and adapt algorithms. Attribution required.
  - `ajdonich/rubiks-cube` (GPL-3.0 ⚠️): May study **concepts only**. Do NOT copy, port, or derive any code. Rewrite from scratch if inspired by the approach.

### 2.2 Dependency Licensing
- Before adding any npm dependency, verify its license is compatible with MIT.
- **Allowed licenses**: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Unlicense
- **Denied licenses**: GPL-2.0, GPL-3.0, LGPL, AGPL, SSPL, any copyleft license
- If uncertain about a dependency's license, consult the Architect before adding it.

### 2.3 Attribution
- Maintain a `CREDITS.md` or section in `README.md` acknowledging:
  - Inspirational references (QBR, rubiks-cube)
  - Open source libraries used
  - Algorithm sources (Herbert Kociemba's two-phase algorithm)

---

## 3. Security Rules

### 3.1 API Keys & Secrets
- **NEVER** hardcode API keys, secrets, or credentials in source code.
- Use `.env.local` for local development (excluded from git via `.gitignore`).
- Use Vercel environment variables for production.
- The Gemini API key (if used) must ONLY be accessed server-side via Next.js API routes.

### 3.2 Client-Side Security
- All user data stays **in the browser** (localStorage). No data is sent to external servers without explicit user consent.
- Camera frames are processed **locally** — never uploaded unless the user explicitly triggers Gemini Vision fallback.
- No analytics or tracking without user consent.
- Sanitize any user input (e.g., manual color entry) before processing.

### 3.3 Content Security Policy
- Configure CSP headers in `next.config.js` to prevent XSS:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-eval'` (required for Three.js)
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
  - `font-src 'self' https://fonts.gstatic.com`
  - `img-src 'self' blob: data:`
  - `media-src 'self' blob:`
  - `connect-src 'self' https://generativelanguage.googleapis.com` (for Gemini API if used)

---

## 4. Performance Rules

### 4.1 Bundle Size Constraints
- Total JavaScript bundle must not exceed **500KB gzipped** for initial page load.
- Three.js and solver modules must be **lazy loaded** (dynamic imports).
- Use `next/dynamic` with `ssr: false` for client-only components (camera, 3D viewer).
- Tree-shake unused Three.js modules — import only what's needed.

### 4.2 Runtime Performance Targets
| Metric | Target | Measurement |
|---|---|---|
| First Contentful Paint | < 1.5s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Time to Interactive | < 3.0s | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| Camera frame processing | < 50ms per frame | Performance.now() |
| Solver computation | < 2000ms | Performance.now() |
| 3D animation frame rate | ≥ 30 FPS (iPhone SE), ≥ 60 FPS (iPhone 12+) | Chrome DevTools |
| Lighthouse Performance | > 90 | Lighthouse CI |
| Lighthouse PWA | 100 | Lighthouse CI |

### 4.3 Image & Asset Rules
- All images must be in **WebP** format where possible (PNG fallback).
- Icon set must include sizes: 72, 96, 120, 128, 144, 152, 167, 180, 192, 384, 512px.
- No image larger than **200KB** unless it's a splash screen.
- Use CSS gradients and SVGs instead of raster images wherever possible.
- Sounds (if used) must be in **MP3** format, compressed, < 50KB each.

---

## 5. Accessibility Rules

### 5.1 WCAG 2.1 AA Compliance
- All text must have a **contrast ratio ≥ 4.5:1** against its background.
- Large text (≥ 24px) must have a **contrast ratio ≥ 3:1**.
- All interactive elements must be **keyboard navigable** (Tab, Enter, Escape).
- All images and icons must have `alt` text or `aria-label`.
- All form controls must have associated `<label>` elements.
- Focus indicators must be visible on all interactive elements.

### 5.2 Touch Accessibility
- All touch targets must be **minimum 48×48px** with 8px spacing between targets.
- Swipe gestures must have button alternatives.
- Long press actions must have tap alternatives.

### 5.3 Screen Reader Support
- Use semantic HTML (`<main>`, `<nav>`, `<section>`, `<article>`, `<button>`).
- Use `aria-live="polite"` for dynamic status updates (e.g., "Scanning face 3 of 6").
- Use `role="alert"` for error messages.
- The 3D cube viewer must have a text alternative describing the current state.

### 5.4 Color Independence
- Color must NEVER be the **only** means of conveying information.
- Cube face colors must be supplemented with **labels** or **patterns** for colorblind users (Phase 2 feature).

---

## 6. iOS & Safari Compatibility Rules

### 6.1 Safari-Specific Constraints
- Test all features on **Safari 16+** on a real iPhone (not just simulator).
- Do NOT use features unavailable in Safari:
  - ❌ Push notifications (not supported in iOS PWA)
  - ❌ Background sync
  - ❌ `window.showSaveFilePicker()`
  - ❌ Web Bluetooth / Web USB
- DO use with caution:
  - ⚠️ `getUserMedia` — works but requires HTTPS and user interaction to trigger
  - ⚠️ Service Worker — works but has stricter caching limits in iOS
  - ⚠️ WebGL — works but monitor GPU memory carefully

### 6.2 iOS PWA Rules
- Include all Apple-specific meta tags:
  ```html
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="QubeSolve" />
  <link rel="apple-touch-icon" href="/icons/icon-180.png" />
  ```
- Handle iOS safe areas with `env(safe-area-inset-*)` CSS functions.
- Handle iPhone keyboard pushing content up — use `visualViewport` API.
- Test that the app works correctly when added to Home Screen (standalone mode).

### 6.3 Camera Rules for iOS
- Always request camera with `{ facingMode: 'environment' }` for rear camera.
- The initial camera request **must** be triggered by a user gesture (tap/click).
- Handle the case where the user denies camera permission gracefully.
- Provide manual color entry as a fallback when camera is unavailable.

---

## 7. Testing Rules

### 7.1 Test Coverage Requirements
- All `src/lib/` modules must have **≥80% code coverage**.
- All validation logic must have **100% branch coverage**.
- All error handling paths must be tested.
- Color detection must be tested against a fixture set of cube images.

### 7.2 Test Structure
```
tests/
├── unit/
│   ├── colorDetection.test.ts
│   ├── cubeState.test.ts
│   ├── solver.test.ts
│   ├── validation.test.ts
│   └── moveParser.test.ts
├── integration/
│   ├── scanFlow.test.ts
│   └── solveFlow.test.ts
├── e2e/
│   └── fullUserJourney.test.ts
└── fixtures/
    ├── cubeImages/          # Test cube photographs
    ├── knownScrambles.json  # Known scrambles + expected solutions
    └── mockCameraFrames/    # Synthetic camera frames for testing
```

### 7.3 Test Commands
- `npm test` — Run all unit tests
- `npm run test:unit` — Run unit tests only
- `npm run test:integration` — Run integration tests
- `npm run test:e2e` — Run end-to-end browser tests
- `npm run test:coverage` — Generate coverage report

---

## 8. Documentation Rules

### 8.1 Required Documentation
Every module must have:
- JSDoc comments on all exported functions, types, and interfaces
- A section in the relevant `docs/*.md` file explaining the module's purpose and API
- Inline comments for any non-obvious logic (especially math: HSV conversion, cube state transforms)

### 8.2 Documentation Files
| File | Owner | Purpose |
|---|---|---|
| `mainidea.md` | User (Carlos) | Product specification — read-only for agents |
| `AGENTS.md` | Architect | Agent definitions and ownership |
| `skills.md` | Architect | Agent capabilities registry |
| `rules.md` | Architect | Governance rules (this file) |
| `README.md` | Architect | Project overview, setup, usage |
| `docs/ARCHITECTURE.md` | Architect | Technical architecture details |
| `docs/COLOR_DETECTION.md` | Scanner | Color detection algorithm documentation |
| `docs/SOLVING_ALGORITHM.md` | Solver | Solving algorithm documentation |

### 8.3 Documentation Updates
- Documentation must be updated **in the same commit** as the code it describes.
- Stale documentation is worse than no documentation — keep it current.
- Use code examples in documentation wherever possible.

---

## 9. Communication Rules

### 9.1 Agent Communication Protocol
- Agents communicate changes via **TypeScript interfaces** in `src/lib/`.
- When an interface changes, the modifying agent must:
  1. Document the change with a clear description of what changed and why
  2. Update all consuming code within their ownership
  3. Notify the Architect to coordinate updates in other agents' code

### 9.2 User Communication
- Always explain changes in **plain language** — avoid unnecessary jargon.
- When presenting options, provide a **recommendation** with rationale.
- Do NOT present implementation details unless the user asks.
- Do NOT ask for permission when the `mainidea.md` already specifies the answer.
- **Bias towards action** — if you can figure it out, do it rather than asking.

### 9.3 Error Communication
- Error messages shown to the user must be:
  - Written in **plain language** a child could understand
  - Accompanied by a **suggested action** ("Try again" / "Re-scan this face")
  - **Never** technical (no stack traces, error codes, or jargon in the UI)
- Error logs for debugging can be technical but must be in the console only.

---

## 10. Allowed & Denied Commands

### 10.1 Auto-Approved Commands (Safe to run without user approval)
```
npm run dev
npm run build
npm run lint
npm test
npm run type-check
npx tsc --noEmit
npx eslint .
npx lighthouse <url> --view
```

### 10.2 Requires User Approval
```
npm install <package>
npm uninstall <package>
rm -rf / del (any destructive file operations)
git push
git push --force
Any command that makes external network requests
Any command that modifies system-level configuration
```

### 10.3 Explicitly Denied
```
npm publish (this is not a published package)
Any command that accesses or modifies files outside the project directory
Any command that installs system-level packages (apt, brew, choco, etc.)
Any command that starts background daemons or services
Any command that modifies git history (rebase, filter-branch on shared branches)
```

---

## 11. Review Checklist

Before any code is merged, verify:

- [ ] Code compiles without errors (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] ESLint has zero errors (`npm run lint`)
- [ ] No `any` types without justification
- [ ] JSDoc comments on all public APIs
- [ ] Responsive design tested at target breakpoints
- [ ] Touch targets are ≥48×48px
- [ ] No hardcoded colors, sizes, or fonts (uses design tokens)
- [ ] No GPL-3.0 code copied or derived
- [ ] No API keys or secrets in source code
- [ ] Documentation updated if behavior changed
- [ ] Performance: no bundle size regression >10KB
- [ ] Accessibility: keyboard navigation works, aria attributes present

---

*Rules version: 1.0.0*
*Compatible with: OpenAI Codex Rules, AGENTS.md open format, AgentSkills specification*
*Last updated: April 3, 2026*
