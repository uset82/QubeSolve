# QubeSolve

QubeSolve is a mobile-first Rubik's cube solver built with Next.js App Router. The app is planned to scan cube faces, validate cube state, and guide the solve step by step.

## Local Setup

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## OpenRouter Setup

The AI vision fallback is wired through a server-only OpenRouter integration and defaults to the free model `qwen/qwen3.6-plus:free`.

1. Copy `.env.example` to `.env.local`.
2. Set `OPENROUTER_API_KEY` in `.env.local`.
3. Optionally override `OPENROUTER_MODEL`, `OPENROUTER_APP_NAME`, or `OPENROUTER_SITE_URL`.

The route handler lives at `POST /api/vision` and expects JSON like:

```json
{
  "imageDataUrl": "data:image/jpeg;base64,...",
  "face": "F"
}
```

The response shape is:

```json
{
  "requestedFace": "F",
  "colors": ["green", "green", "white", "orange", "green", "red", "yellow", "blue", "white"],
  "confidence": 0.73,
  "notes": "Top row is slightly obscured but still readable.",
  "model": "qwen/qwen3.6-plus:free"
}
```

## Verification

Useful local checks:

```bash
npm run lint
npm run build
```
