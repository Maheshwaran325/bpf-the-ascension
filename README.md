# BPF: The Ascension

Browser-based boss-rush game built with Phaser 3 + TypeScript + Vite.

## Core Features

- 6-level gauntlet mapped to the Founder eras
- Keyboard-first controls (`WASD`, `J`, `SPACE`)
- Restart-current-level failure model
- Deterministic scoring system
- Local top-10 leaderboard (`localStorage`)
- Accessibility toggles for reduced flash and reduced shake

## Quick Start

```bash
npm install
npm run dev
```

Then open the Vite URL (usually `http://localhost:5173`).

## Scripts

```bash
npm run dev         # local dev server
npm run build       # typecheck + production build
npm run preview     # serve production build
npm run test:unit   # Vitest unit tests
npm run test:e2e    # Playwright integration tests
```

## Competitive Rules Implemented

- Level clear bonus: `1000 * levelNumber`
- Time bonus: `max(0, targetMs - actualMs) / 10`
- Damage penalty: `-5 * damageTaken`
- Death penalty: `-300 * deathsInLevel`
- Godmode survival bonus: `+10 / second`
- Score floor: `0`

## Local Persistence Keys

- Accessibility: `bpf_ascension_accessibility_v1`
- Leaderboard: `bpf_ascension_leaderboard_v1`

## Test Coverage

Unit tests cover:

- score calculation behavior
- mutation scheduling
- leaderboard sorting/trim/serialization
- temperature, RAM, and parry timing helpers

Integration tests cover:

- gauntlet start flow
- restart on health depletion
- reduced-flash propagation into levels
- gauntlet completion + leaderboard write
