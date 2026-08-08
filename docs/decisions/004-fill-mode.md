---
type: decision
status: accepted
date: 2026-08-09
project: hexagons
---

# 004 — `fill` mode: crumpled-crystal filled honeycomb (trigons pattern language)

## Context

ADR 001 adopted "line art over fills — nothing is filled" as the library's
identity. The user explicitly requested a filled-background mode like
`W:\Projects\trigons-lite`: a faceted low-poly fill that assembles itself with a
staggered entrance animation and then stays a static painting. Of the three
candidate looks (organic cells / crumpled crystal / strict comb) the user chose
**crumpled crystal**: every hexagon split into six centre-fan triangles, each
flat-shaded by its own pseudo-normal — trigons' crumpled-paper read on hexagonal
topology.

## Decision

Add `mode: 'fill'` as a **third visual language**, narrowing (not reverting)
ADR 001: line art remains the identity of `field`, `hive`, and `pattern()`;
fill is a deliberate, separate mode following trigons' mechanics:

- mesh of hive lattice vertices + cell centres, jittered by `chaos`; six
  triangles per cell; colours baked at generation: diagonal ramp × pseudo-normal
  lighting `(0.6, 0.4)` scaled by `depth`; anti-aliasing seams closed by
  stroking each triangle with its own fill colour;
- entrance/exit animation: `fade | scale | spin | fly`, staggered by
  `direction: top | bottom | left | right | center | random`, cubic easings;
  after completion the rAF loop stops — the fill is a static painting;
- default ramp comes from the auto-palette: `[background, halo, colors[0]]`
  (a pinned `colors` becomes the ramp verbatim).

Trigons' known weaknesses are **not** ported: hexagons keeps DPR capping and
`destroy()`, the jitter is `hash()`-based so the mesh is deterministic and
stable across resizes (trigons re-randomises), and entrance randomness routes
through the seeded RNG so `seed` + `step(dt)` reproducibility extends to fill.

## Consequences

- Size ceiling moves 5.5 → **6.5 KB** gzipped (estimate +1.0–1.3 KB; measure
  immediately after the port — AGENTS.md: trim/size only by measurement — and
  freeze the real number in the spec).
- `sweep`, `bond`, `inset`, `weight`, `glow`, `count`, `nesting`, `parallax`
  do not apply to fill and are ignored by it.
- The handle gains `animateIn()` / `animateOut()` (no-ops outside fill mode).
