---
type: note
status: active
tags: [backlog]
project: hexagons
---

# Backlog

The single list of open work. Items link to plans in `../.agents/plans/active/` once
one exists; an item is dropped when its plan moves to `plans/done/`.

## Open — pre-code decisions

- **Package name.** `hexagons` on npm is a 0.0.0 squat; `honeycombs`, `hexes` taken.
  Free (checked 2026-08-08): `hexlines` (recommended), `hexagon-bg`, `hexagons.js`.
  User decision — then record it as ADR 003 and optionally file an npm support
  dispute for `hexagons` in parallel (must not block v0.1).
- **Sample spintax.net's brand hex** — one colour, the only colour constant in the
  source: it seeds the auto-palette (ADR 002) and everything else is derived. Do not
  hand-pick a palette; that mechanism existing is the point.
- **Create the GitHub repo** (`investblog/hexagons` — verify the name is free) and
  configure **npm Trusted Publisher BEFORE the first tag**. Order: repo → trusted
  publisher → `release.yml` → tag. No `NPM_TOKEN` secret, ever — octagons' three
  provenance-less releases are the incident this rule comes from.

## Open — implementation, in order

1. Port the engine from `W:\Projects\octagons-lite\octagons.js`: field mode with a
   6-vertex path, seed/mulberry32, step(dt), sleeping, cached gradients.
2. **Auto-palette module** (ADR 002): LCH↔sRGB, the derivation table, edge-visibility
   guards, achromatic fallback, `Hexagons.palette()`. Reference:
   `casino-platform/packages/core/utils/token-engine/` (`color.ts`, `contrast.ts` —
   port the conversion math, not the role machinery). Budget ~0.6–0.8 KB gzipped.
3. Hive mode: 6.6.6 lattice, sweep, deterministic bonding (`hash(i,j,d)`, 3 owned
   walls per cell), `orientation`, `inset`.
4. `pattern()` with the `√3·s × 3s` rectangular repeat; verify seamlessness.
5. Demo `index.html`: controls for every option **including a `brand` colour
   picker** (visitors repaint the hive to their brand — the option selling itself),
   fps meter, both themes, and the **spintax.net hero section** (the ad surface).
6. Verify the spec's unverified numbers before they reach the README: `bond` useful
   range (claimed 0.10–0.20), `pattern()` legibility floor (claimed ~14 px), seed
   determinism at 300 frames, and the **auto-palette derivation table** (eyeball at
   least: spintax brand, a red, a green, a yellow — light brands break naive ramps —
   and one grey seed; then freeze the constants in the spec).
7. **Tests from day one** — octagons still has none and regrets it: a headless
   frame-hash test (render N frames at a fixed seed, compare hash) would have caught
   its `set({seed})` no-op automatically; plus a `palette()` snapshot test (pure
   function, trivially cheap). Wire both into the pre-push gate.

## Ideas, not scheduled

- **`organic` mode** — jittered/relaxed Voronoi honeycomb. Mathematically native to
  hexagons (Voronoi cells average exactly 6 sides), impossible for octagons; this is
  the differentiator feature. Needs Lloyd relaxation or a jittered-lattice Voronoi
  with deterministic per-cell jitter to stay seedable. v0.2 candidate.
- Snap field rotation to 30° steps for a stricter, more brand-like field.
- Pulsing "cell fill" highlight (one cell at a time breathes with the accent
  colour) — would break the nothing-is-filled rule; decide deliberately if wanted.
