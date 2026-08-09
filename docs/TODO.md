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

- ~~Package name~~ — **decided: `hexagons-lite`** (ADR 003, verified free E404).
  Optional later: npm support dispute for the squatted `hexagons`.
- ~~Size-spike first~~ — **done 2026-08-08, estimate lost to measurement**: the
  full v0.1 feature set minifies to **5232 B** gzip, not under 5120. Trims tried
  and measured: matrix-precision + compact guards (−37 B, kept), vertex dedup
  (+20 B — gzip compresses repetition better than a shared function; reverted the
  loop forms, kept the dedup for source clarity), `Math` aliasing (−4 B, not worth
  it), terser `passes=3,unsafe` (−3 B). Ceiling moved to 5.5 KB in the spec;
  cutting spec'd features (`get()`, `inset`, pattern `brand`) to save ~2% was
  rejected as backwards. Lesson recorded in AGENTS.md.
- ~~Sample spintax.net's brand~~ — **done 2026-08-08**: the logo triad
  `['#00abf3', '#d6af3c', '#a91455']` (blue/gold/magenta), confirmed by both the
  logo SVG and spintax.net's `theme.css` header comment. `brand` extended to
  hex | hex[] (ADR 002 addendum).
- ~~Create the GitHub repo~~ — **done 2026-08-09**: `investblog/hexagons-lite`
  (repo = package name, house style), Pages legacy/main/root like octagons and
  trigons-lite, live demo at https://investblog.github.io/hexagons-lite/.
- ~~Publish v0.1.0~~ — **done 2026-08-09**: `hexagons-lite@0.1.0` on npm **with
  provenance** (bootstrap run 31298600990, transparency log 2389655718 — the
  id-token+--provenance improvement over octagons' bootstrap worked). Tag
  v0.1.0 pushed; release.yml exited green idempotently ("already on the
  registry"); bootstrap workflow deleted from the repo.
- ~~Trusted Publisher + token cleanup~~ — **done 2026-08-09**: TP configured by
  the maintainer (`investblog` / `hexagons-lite` / `release.yml`); `NPM_TOKEN`
  repo secret deleted the same day (lifetime: one workflow run — the octagons
  counter-example is closed). Remaining on the maintainer only: **revoke the
  Automation token on npmjs.com** if not already done. From here every release
  is `npm version patch && git push --follow-tags`, OIDC + provenance, zero
  secrets.

## Open — implementation, in order

1. ~~Port the engine~~ / ~~auto-palette module~~ / ~~hive mode~~ / ~~pattern()~~ /
   ~~demo~~ — **done 2026-08-09** (`hexagons.js`, `index.html`). Verified visually
   in Chrome, dark + light, per AGENTS.md: hive lattice correct (no gaps, no
   double-strokes), bond fuses polyhexes, inset gives double walls, flat
   orientation works, pattern seamless at 22 px, 61 fps steady in one clean tab.
   Verified in-browser: seed determinism (two 300-frame runs pixel-identical),
   corner alpha 0 with `background: null`, `palette()` pure, grey seed → graphite.
2. **Verification still owed before the README publishes numbers:** `bond` useful
   range across sizes (0.12 looked right at size 90 — check 0.10–0.20 claim at
   other sizes), `pattern()` legibility floor (claimed ~14 px — eyeballed only at
   22 px so far, check 1x vs retina), red/green/yellow brand seeds (light brands
   break naive ramps — only blue triad + violet + grey checked).
3. ~~Playwright tests~~ — **cut by user decision 2026-08-09**: no test-runner
   dependency. Verification = the documented in-browser check run executed by the
   reviewer agent (see spec, "Verification model"). Revisit only after a real
   escaped regression.

## Ideas, not scheduled

- **`bond` × `inset` composition** — insetting fused polyhex components means
  building and offsetting each component's union outline (polygon offsetting).
  Excluded from v0.1 by spec (external review, accepted: no unambiguous cheap
  algorithm); revisit only after the size-spike shows slack.

- **`organic` mode** — jittered/relaxed Voronoi honeycomb. Mathematically native to
  hexagons (Voronoi cells average exactly 6 sides), impossible for octagons; this is
  the differentiator feature. Needs Lloyd relaxation or a jittered-lattice Voronoi
  with deterministic per-cell jitter to stay seedable. v0.2 candidate.
- Snap field rotation to 30° steps for a stricter, more brand-like field.
- ~~Pulsing "cell fill" highlight~~ — superseded by the full `fill` mode
  (ADR 004, shipped 2026-08-09): the nothing-is-filled rule was deliberately
  narrowed to the line-art modes.
- Fill-mode shimmer: a slow light band re-tinting facets after the entrance
  (trigons has none either; would need a re-tint pass — costs the static-sleep
  covenant, so only behind an explicit option).
- Fill × `bond`/`inset`: fused-cell facet groups. Same polygon-union problem as
  line-art bond×inset; revisit after a real request.
