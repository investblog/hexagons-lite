---
type: decision
status: accepted
date: 2026-08-08
project: hexagons
---

# 002 — Auto-palette: one `brand` hex derives all colours

## Context

Every colour default in the v0.1 spec was "tbd, sample spintax.net". Meanwhile the
house already solved this problem twice: `dark-theme-generator` (progenitor) derives
full WCAG-validated themes from a handful of source colours in LCH, and
`casino-platform` ported that engine (`packages/core/utils/token-engine/`) so that a
single stored `brand_color_hex` generates every site token — and even feeds a sibling
background library via `mapToTrigonsConfig()`.

## Decision

Adopt the **principle**, not the code: hexagons gets a `brand` option (plus a public
pure `Hexagons.palette()`) that derives `colors`/`accent`/`hot`/`background`/`halo`
deterministically in LCH, with three rules carried from the engine:

1. **Fidelity** — contrast repairs shift lightness only; the brand's hue and chroma
   are preserved. Accent uses the engine's `H+40°` synthetic-complement rule.
2. **Guards** — not WCAG text pairs (there is no text) but edge-visibility floors:
   each gradient stop must clear a minimum contrast against `background`.
3. **Honest neutrals** — an achromatic seed (chroma < 12) yields a graphite palette;
   no hue is ever invented (the engine's `NEUTRAL_ONLY_FLAG` case).

Explicit colour options always override derivation. `brand` never touches geometry;
`seed` never touches colour — the two knobs are orthogonal by contract.

The full engine's role-assignment/WCAG machinery (link, focusRing, accentText,
quality scoring) is **explicitly not ported** — it solves a text-UI problem this
library does not have, at a cost the 4 KB budget cannot pay.

## Consequences

- The library ships exactly **one** colour constant: spintax.net's brand hex, as the
  default `brand`. No hand-picked palette table exists; spintax.net is client zero.
- Size ceiling raised 3.5 → 4.0 KB gzipped to fund LCH conversion + guards.
- The derivation table in the spec holds starting values; they must be verified
  visually (proof-loop) and frozen before the README publishes them.
- `palette()` being pure makes it snapshot-testable from day one.
