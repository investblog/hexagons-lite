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
  User decision — then record it as ADR 002 and optionally file an npm support
  dispute for `hexagons` in parallel (must not block v0.1).
- **Sample the spintax.net palette** for default `colors`/`accent`/`background`/`hot`
  before coding — the spec deliberately leaves them tbd rather than inventing values.
- **Create the GitHub repo** (`investblog/hexagons` — verify the name is free) and
  configure **npm Trusted Publisher BEFORE the first tag**. Order: repo → trusted
  publisher → `release.yml` → tag. No `NPM_TOKEN` secret, ever — octagons' three
  provenance-less releases are the incident this rule comes from.

## Open — implementation, in order

1. Port the engine from `W:\Projects\octagons-lite\octagons.js`: field mode with a
   6-vertex path, seed/mulberry32, step(dt), sleeping, cached gradients.
2. Hive mode: 6.6.6 lattice, sweep, deterministic bonding (`hash(i,j,d)`, 3 owned
   walls per cell), `orientation`, `inset`.
3. `pattern()` with the `√3·s × 3s` rectangular repeat; verify seamlessness.
4. Demo `index.html`: controls for every option, fps meter, both themes, and the
   **spintax.net hero section** (the ad surface).
5. Verify the spec's unverified numbers before they reach the README: `bond` useful
   range (claimed 0.10–0.20), `pattern()` legibility floor (claimed ~14 px),
   seed determinism at 300 frames.
6. **Tests from day one** — octagons still has none and regrets it: a headless
   frame-hash test (render N frames at a fixed seed, compare hash) would have caught
   its `set({seed})` no-op automatically. `seed` + `step(dt)` make this cheap; wire
   it into the pre-push gate.

## Ideas, not scheduled

- **`organic` mode** — jittered/relaxed Voronoi honeycomb. Mathematically native to
  hexagons (Voronoi cells average exactly 6 sides), impossible for octagons; this is
  the differentiator feature. Needs Lloyd relaxation or a jittered-lattice Voronoi
  with deterministic per-cell jitter to stay seedable. v0.2 candidate.
- Snap field rotation to 30° steps for a stricter, more brand-like field.
- Pulsing "cell fill" highlight (one cell at a time breathes with the accent
  colour) — would break the nothing-is-filled rule; decide deliberately if wanted.
