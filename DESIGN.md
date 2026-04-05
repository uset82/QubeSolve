# Design System

## Overview
QubeSolve should feel like a pocket sci-fi toy for a young cuber: dark, glowing, playful, and immediately understandable on an iPhone screen.
The first screen is a single poster-like composition, not a dashboard. Brand first, hero second, guidance third, action fourth.
Use a premium dark background with cyan and magenta light accents, but keep the structure clean and legible. The UI should feel exciting without becoming noisy.

## Colors
- **Primary** (`#34c8ff`): Primary actions, active highlights, orbit accents, interactive focus.
- **Secondary** (`#ff4fc3`): Brand glow, secondary neon accents, supporting hero energy.
- **Tertiary** (`#58f0d1`): Confirmation cues, mixed-gradient energy, success-leaning highlights.
- **Surface** (`#0a1322`): Main app background and lower screen field.
- **Surface Elevated** (`#151d34`): Pills, chips, secondary buttons, contained panels.
- **On Surface** (`#edf3ff`): Primary text.
- **On Surface Muted** (`#a9b6cf`): Supporting copy, helper text, version labels.
- **Outline** (`rgba(126, 156, 228, 0.28)`): Secondary button borders, chip borders, subtle framing.

## Typography
- **Headline Font**: Outfit.
- **Body Font**: Inter.
- **Label Font**: Inter.
Headlines should be large, rounded, and glowing with a soft cyan-to-pink gradient.
Body text should stay compact and readable on narrow screens, generally 14px to 16px.
Uppercase labels should be small, widely tracked, and used sparingly for pills and small metadata.

## Elevation
This design relies on glow, blur, and subtle border contrast more than large shadows.
Use soft ambient light around the hero and key CTA. Surfaces should feel glassy or coated, not heavy.

## Components
- **Hero**: One centered composition with a glowing cube, orbital rings, and controlled atmospheric texture behind it.
- **Top Pills**: Compact rounded capsules with low-contrast dark fills and thin luminous borders.
- **Primary Button**: Full-width pill with cyan-to-magenta gradient, dark text, and one small embedded icon/badge.
- **Secondary Button**: Full-width dark pill with luminous outline and high legibility.
- **Feature Chips**: Three compact metric chips in a single row, consistent height, two-line hierarchy.
- **Settings Button**: Small circular glass button in the top-right with a subtle outer glow.

## Do's and Don'ts
- Do keep the first viewport fully readable on iPhone-sized screens without accidental clipping.
- Do keep one dominant hero composition and one dominant CTA.
- Do use glow to emphasize hierarchy, not to decorate every element equally.
- Do maintain at least 48px touch targets for tappable elements.
- Don't introduce dashboard cards, large boxed sections, or multiple competing heroes on the home screen.
- Don't let decorative motion or patterns interfere with text contrast.
- Don't use more than two accent hues in the first viewport outside of cube sticker colors.
