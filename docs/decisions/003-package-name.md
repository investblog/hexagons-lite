---
type: decision
status: accepted
date: 2026-08-08
project: hexagons
---

# 003 — Package name: `hexagons-lite`

## Context

npm `hexagons` is squatted (0.0.0 stub); `honeycombs`, `hexes` are taken. Free
candidates as of 2026-08-08: `hexlines`, `hexagon-bg`, `hexagons.js`,
`hexagons-lite` (all verified E404). An external review (Codex) independently
confirmed the availability picture.

## Decision

**`hexagons-lite`** — user's call. It keeps the shape word intact (search:
"hexagons"), the `-lite` suffix is house style (the octagons project folder is
`octagons-lite`) and reads honestly for a few-KB zero-dependency library.

Unchanged by the package name: global `Hexagons`, source `hexagons.js` /
`hexagons.min.js`, repo `investblog/hexagons`, GitHub Pages demo.

## Consequences

- Reserve the name early: configure the npm Trusted Publisher for `hexagons-lite`
  before the first tag (order per ADR 001/3).
- A future dispute for the squatted `hexagons` stays possible; if ever won, it
  would be a rename release, not a blocker for anything now.
