---
type: note
status: active
tags: [architecture, overview, spec]
project: hexagons
---

# hexagons — spec / dev source of truth

Docs for developers and agents. `index.html` is the verification surface.
Contract-first: change the doc here **before** the code, then code.

**Status: SPEC.** No code exists yet. This document is the contract the first
implementation must satisfy. It is a deliberate sibling of
`W:\Projects\octagons-lite` — same engine skeleton, same API, same release
machinery — with the geometry story inverted and the promotion target switched to
**[spintax.net](https://spintax.net)**.

## The pitch, in one paragraph

Animated honeycomb backgrounds built from **regular** hexagons. Line art on canvas —
the colour gradient runs along the edges, nothing is ever filled. Zero dependencies,
under 5 KB gzipped. Two modes: hexagons drifting toward the viewer in depth, or the
living honeycomb lattice. Two knobs span the whole variant space: **`seed`** spins
the geometry (one integer, one hive — reproducibly), **`brand`** spins the colours
(one hex, the whole palette — see Auto-palette). That is the spintax idea applied to
geometry, and it is why the library carries spintax.net's colours in its credits.

## The load-bearing geometry (the inversion of octagons)

Octagons was built around an impossibility: a regular octagon cannot tile the plane,
so the whole library is a workaround. Hexagons is the opposite story — the regular
hexagon is not merely *a* tiler, it is provably the **best** one:

- **6.6.6 is one of exactly three regular tilings** (triangles 3⁶, squares 4⁴,
  hexagons 6³). Interior angle 120°, three cells at every vertex, 360/120 = 3
  exactly. No filler shapes, no gaps — unlike octagons, nothing has to be given up.
- **The honeycomb conjecture — Hales, 1999.** The regular hexagonal grid is the
  partition of the plane into equal-area cells with the **least total perimeter** —
  less than squares (~7% less edge per unit area), less than triangles (~18% less),
  less than any exotic curved-wall partition. Proved, not folklore.
- **This library draws only perimeters.** Nothing is filled; every photon comes from
  an edge. So the hexagon is literally the cheapest tiling in ink — the
  mathematically optimal shape for line art. That sentence is the README's hook.
- **Euler forces Voronoi cells to average exactly 6 sides.** For octagons this
  killed the "organic" route (jittered cells never read as octagons). For hexagons it
  is an endorsement: jitter a hex grid and relax it, and you *stay* in hexagon
  country — bee combs, basalt columns, dragonfly wings all converge there. An
  `organic` mode is therefore mathematically native to this library (backlog, not
  v0.1 — see TODO).

Numbers the implementation will need (pointy-top, side/circumradius `s`):

| Quantity | Value |
|---|---|
| Width across flats | `√3·s` |
| Height point-to-point | `2s` |
| Centre grid | columns `√3·s` apart, rows `1.5s` apart, odd rows offset `√3·s/2` |
| Seamless rectangular tile | `√3·s × 3s` (contains 2 cells) — this is `pattern()`'s repeat |
| **Public `size` option** | **= width across flats = `√3·s`** — the ONE unit every API surface uses (so `s = size/√3`, and the pattern tile is exactly `size × √3·size`) |
| Inradius | `(√3/2)·s ≈ 0.866s` |
| Area | `(3√3/2)·s² ≈ 2.598s²` |

`orientation: 'flat'` is the same lattice rotated 90° — swap the roles of the axes,
do not write a second geometry.

## Modes

| Mode | What |
|---|---|
| `field` | Regular hexagons at varying depth drifting toward the viewer. Billboards, so they stay regular at any distance. Overlapping, varying scale, optional concentric nesting rings, occasional accent-coloured cell, pointer parallax. Direct port of octagons' field with a 6-vertex path. |
| `hive` | The 6.6.6 honeycomb. A soft band of light sweeps across the edges. Optional bonding and inset (below). |

### Bonding (`bond`)

The probability of *omitting* a shared wall, fusing two cells into one outline —
the only chaos available, since cell centres are locked by the tiling. Each cell owns
three unique walls (E, SE, SW in axial terms); selection is a deterministic hash of
cell coordinates + direction, so bonds never flicker. Hexagons have six shared walls
per cell versus the octagon lattice's four, so the structure disintegrates at a lower
probability — start the useful range at **0.10–0.20** and *verify visually* before
publishing numbers (proof-loop: measured, not assumed).

### Inset (`inset`)

Octagons' `nodes` option existed because the 4.8.8 tiling leaves square gaps; 6.6.6
leaves none, so `nodes` disappears. Its replacement is `inset`: shrink every cell
toward its centre by a few pixels, so neighbouring outlines become parallel double
walls — the read of a real comb, where cells share thick wax walls. `inset: 0` (the
default) is the pure shared-edge lattice.

**`inset` and `bond` are mutually exclusive in v0.1.** Bonding produces arbitrary
connected polyhex components, not just pairs; insetting those means computing and
offsetting the union outline of each component — real polygon-offset machinery with
a real byte cost. Until a size-spike proves it fits, `bond > 0` wins and `inset` is
ignored for the run (documented, not silently: the demo greys the control out).
Composition is backlog, after the size-spike (TODO).

## Static pattern — no canvas at all

The tiling is periodic with a `√3·s × 3s` rectangular repeat, so `pattern()` returns
a seamless SVG tile as a ready-to-use `background-image`, same contract as octagons:

```js
document.querySelector('pre').style.backgroundImage =
  Hexagons.pattern({ size: 18, opacity: 0.09 });
```

| Option | Default | What |
|---|---|---|
| `size` | `18` | Width across flats in px (the one unit — see geometry table); the repeat tile is `size × √3·size` |
| `brand` | spintax.net hex | Auto-palette seed; `color` defaults to the derived middle gradient stop |
| `theme` | `'light'` | Derivation profile for `brand` (patterns usually sit on light surfaces) |
| `color` | *derived* | Stroke colour; explicit value overrides derivation |
| `opacity` | `0.12` | Stroke opacity — the contrast knob |
| `weight` | `1` | Stroke width |
| `orientation` | `'pointy'` | `'pointy'` or `'flat'` |
| `inset` | `0` | Cell shrink in px |
| `background` | `null` | Optional solid fill behind the lines |
| `raw` | `false` | Return bare `<svg>` markup instead of `url(...)` |

Legibility floor: six corners at 120° survive smaller pitches than eight at 135° —
expect hexagons to stay legible down to roughly **14 px** where octagons needed 24.
Verify on 1x and retina before the README states the number.

## Auto-palette (`brand`)

Principle inherited from `W:\Projects\casino-platform`'s token-engine, whose
progenitor is `W:\Projects\dark-theme-generator`: **one brand colour in, a full
derived palette out — deterministically, in LCH, with contrast guards.** In
casino-platform every casino stores a single `brand_color_hex` and the server
derives all site tokens from it; the same engine already feeds a sibling background
library via `mapToTrigonsConfig()` (`colors: [bg, surface, accent]`). Hexagons
builds that capability in, so any site drops the background in with nothing but its
brand colour:

```js
Hexagons.init('.bg', { brand: '#7c5cff' });          // whole scene from one hex
Hexagons.init('.bg', { brand: '#7c5cff', accent: '#ffb347' });  // explicit wins
```

What we take is the **principle**, not the code: the full engine does WCAG role
assignment (link/focusRing/accentText) for text UIs — irrelevant to line art and far
too heavy for a 4 KB budget. The hexagons subset:

1. **Derivation in LCH — pinned precisely.** Colour space: **CIE LCh(ab), D65,
   sRGB** (what the token-engine's `color.ts` implements — port that math). Parse
   `brand` → `(L, C, H)`. **Gamut policy:** a derived LCh triple that falls outside
   sRGB is mapped back by **reducing C only**, holding L and H (binary-search C
   until in gamut; never channel-clip, which shifts hue). Derive every colour
   option from the parsed seed (starting values — verify visually per proof-loop,
   then freeze here):

   | Token | Dark (default) | Light |
   |---|---|---|
   | `background` | `L 6, C min(0.2·C, 10), H` | `L 97, C 3, H` |
   | `halo` | `L 12, C min(0.3·C, 15), H` | `L 92, C min(0.2·C, 8), H` |
   | `colors[0..2]` | `L 32/58/82`, `C ×0.9/1.0/0.55`, `H` | `L 72/52/32` (ramp inverted), same chroma scaling |
   | `accent` | `L 70, C, H+40°` | `L 45, C, H+40°` |
   | `hot` | `L 92, C 12, H` | `L 28, C 24, H` |

   The `H+40°` accent rule is the engine's own synthetic-complement rule
   (`buildCandidatePool`), adopted as-is.
2. **Contrast guard, edge-visibility flavour.** No text here, so the constraint is
   not WCAG pairs but *line legibility*: each gradient stop must clear a floor
   against `background` (targets: dimmest stop ≥ 1.5:1, middle ≥ 2.5:1, brightest
   ≥ 5:1; `hot` ≥ 7:1). Repair by shifting **L only** — hue and chroma are the
   brand's identity and are preserved (the engine's fidelity principle).
3. **Achromatic seed.** If brand chroma < 12 (grey/black/white brands), do **not**
   invent a hue — derive a neutral graphite palette (the engine's
   `NEUTRAL_ONLY_FLAG` case, resolved the same way).
4. **Explicit overrides win — with a defined lifecycle.** A colour option is
   **pinned** the moment the caller passes it (at `init` or via `set`), and pinned
   options survive later `set({brand})`/`set({theme})` re-derivations untouched.
   To hand a pinned option back to the auto-palette, pass the sentinel `'auto'`:
   `set({ accent: 'auto' })` unpins it and re-derives immediately. (`null` keeps
   its existing meaning — transparent/disabled — and is a pin like any other
   value.) `set({ brand })` therefore re-derives exactly the unpinned colour
   options, rebuilds cached gradients, and never touches geometry.
5. **Deterministic and exposed.** Same hex ⇒ same palette, no randomness — `brand`
   never touches geometry, `seed` never touches colour. The derivation is public:

   ```js
   Hexagons.palette('#7c5cff')                    // → {colors, accent, hot, background, halo}
   Hexagons.palette('#7c5cff', { theme: 'light' })
   ```

   `pattern({ brand, theme })` uses the same derivation (its `color` = the middle
   gradient stop for the chosen theme).

The default palette **is** the auto-palette: the source ships one constant —
spintax.net's brand hex — and derives everything else from it. No hand-picked
colour table exists in the library at all; spintax.net is client zero of its own
mechanism. Size budget for the whole feature (LCH↔sRGB + guard): ~0.6–0.8 KB
gzipped, inside the raised 4 KB ceiling.

## Options (v0.1 contract)

Identical to octagons wherever the concept carries over — this is deliberate, so a
user of one library can drive the other without relearning:

| Option | Default | Applies to | What |
|---|---|---|---|
| `mode` | `'field'` | — | `'field'` or `'hive'` |
| `brand` | spintax.net hex | both | Auto-palette seed; derives all colour options below (see Auto-palette). Settable live; re-deriving rebuilds gradients only |
| `theme` | `'dark'` | both | `'dark'` or `'light'` — which derivation profile `brand` uses; ignored when all colour options are explicit |
| `colors` | *derived* | both | Gradient stops along the edges; explicit value overrides derivation |
| `accent` | *derived* | field | Colour of the occasional highlighted cell |
| `hot` | *derived* | hive | Colour of the sweeping light band |
| `background` | *derived* | both | Base fill; `null` = transparent canvas |
| `halo` | *derived* | both | Soft central glow; `null` disables |
| `size` | `90` | both | Width across flats in px (the one unit — see geometry table); scale factor for the field |
| `count` | `110` | field | Number of hexagons |
| `seed` | *none* | field | Integer; reproducible scatter (see determinism). Settable live; re-seeding rebuilds the field |
| `speed` | `1` | both | Animation rate; `0` freezes |
| `weight` | `1` | both | Line thickness multiplier |
| `glow` | `true` | both | Soft halo around bright edges (no `shadowBlur` — see covenants) |
| `sweep` | `1` | hive | Light-band speed; `0` disables |
| `bond` | `0` | hive | Probability of fusing neighbours (useful ~0.10–0.20, verify) |
| `orientation` | `'pointy'` | hive | `'pointy'` or `'flat'` |
| `inset` | `0` | hive | Double-wall gap in px |
| `nesting` | `true` | field | Concentric inner rings on some cells |
| `parallax` | `true` | field | Pointer-driven drift |
| `vignette` | `0.45`* | both | Edge darkening; `0` disables. ***Effective default is `0` when `background: null`** — the vignette bakes into the alpha channel on a transparent canvas, so unless the caller pins `vignette` explicitly, transparency switches it off automatically (resolving the octagons footgun instead of documenting it) |
| `maxDpr` | `2` | both | Device-pixel-ratio ceiling |
| `autoplay` | `true` | both | Start immediately |

Dropped from octagons: `nodes`, `nodeSize` (no gaps to decorate — see Inset).

## API (unchanged contract)

`Hexagons.init(selector, opts)` returns `null` if the selector matches nothing,
otherwise the same handle as octagons:

```js
var hx = Hexagons.init('.bg');
hx.set({ mode: 'hive', bond: 0.15 });  // change options live — set({seed}) MUST work (octagons shipped that bug)
hx.set({ brand: '#e0356b' });          // re-derives palette, rebuilds cached gradients, geometry untouched
hx.stop(); hx.start();
hx.step(1 / 60);                       // one frame off the rAF clock
hx.resize(); hx.destroy();
hx.canvas;
hx.get();                              // effective options snapshot: derived colours
                                       // resolved, pins visible — makes set() testable
                                       // and lets users read what brand produced

Hexagons.palette('#e0356b');           // pure: the derived set, no canvas involved
```

Single global `Hexagons`, browser script, no module build; `main` points at the
unminified source.

## Determinism and time (the spintax story)

Carried verbatim from octagons, because both properties are load-bearing:

- **`seed`** routes all field randomness through mulberry32. Randomness is not only
  at start-up — cells re-scatter when they pass the camera, so an unseeded run
  diverges mid-animation. Same seed + same `dt` sequence ⇒ byte-identical canvases
  (octagons verified this at 300 frames; hexagons must re-verify, not inherit the
  claim).
- **`step(dt)`, not `render(absoluteTime)`** — field motion is integrated and respawn
  re-randomises position, so there is no closed form to seek to. Frames are produced
  in order. (Octagons ADR 002, adopted — see decisions/001.)
- The hive mode is deterministic by construction: bonds come from `hash(i, j, d)`,
  never `Math.random`.

Offline rendering contract is octagons' with one improvement: `background: null`
automatically yields an effective `vignette: 0` unless the caller pinned vignette
explicitly (octagons documented the alpha-channel footgun; hexagons removes it).
Playwright screenshots need `omitBackground: true`, ProRes 4444 keeps alpha, and
`step()` is not gated by the visibility/intersection sleeping (only the rAF loop
is).

Scope of the determinism claim: "identical frames" is promised **per environment**
— a fixed browser build, viewport, and DPR, compared as raw RGBA (`getImageData`),
which is what the frame-hash test pins. Canvas rasterization differs across
browsers and GPUs, so cross-browser byte-identity is explicitly not claimed.

This section is also the marketing bridge: **one template, thousands of variants** is
exactly what [spintax.net](https://spintax.net) does for text. The demo and README
frame `seed` in those terms.

## Performance covenants (inherited, non-negotiable)

Paid for in octagons; port them, do not rediscover them (full incident log in
`../AGENTS.md`):

- Sleep off screen: `IntersectionObserver` + page-visibility gate the rAF loop.
- Gradients built once, cached; cache dropped on resize and `set()`.
- `shadowBlur` is banned — wide dim stroke under thin bright stroke instead.
- DPR capped at 2.
- Degrade gracefully without `ResizeObserver`/`IntersectionObserver` (fall back to
  `window.resize`, stay awake).

## Promotion: spintax.net

The promo surfaces, mirroring how octagons carries generator.ink / oktagon.bet:

| Surface | Content |
|---|---|
| README Credits | "Built by [301ST](https://301.st) for [spintax.net](https://spintax.net)." + one sentence tying `seed` to template expansion |
| Demo panel | "Made in 301 · for spintax.net" (link) |
| Demo section | One of the demo sections is a mock **spintax.net hero** — the hive behind spintax's actual tagline, with a live "see it on spintax.net →" link. The demo is the ad. |
| `package.json` | `author: "301st (https://301.st)"`, homepage → repo; keywords stay honest npm search terms (hexagon, honeycomb, background, canvas, generative, line-art, …) — no keyword spam |
| Default palette | The auto-palette seeded with **spintax.net's brand hex** — the only colour constant in the source. Every default embed is on-brand, and spintax.net is client zero of the `brand` mechanism. Sample the one hex from the live site before coding. |
| Demo control | A `brand` colour picker in the demo panel — visitors repaint the hive to *their* brand in one click, which is the `brand` option selling itself (and the spintax one-template-many-variants story again). |

## Naming (decided — ADR 003)

Package: **`hexagons-lite`** (verified free on npm, E404 2026-08-08). npm
`hexagons` is squatted (a 0.0.0 stub), `honeycombs` and `hexes` are taken; the
`-lite` suffix is house style (the octagons project folder carries it too) and
reads honestly for a ~4 KB library. Global stays `Hexagons`, source file
`hexagons.js`, repo `investblog/hexagons`, demo on GitHub Pages. A dispute for the
squatted `hexagons` via npm support remains possible later but does not block v0.1.

## Layout & release engineering

| Path | Role |
|---|---|
| `hexagons.js` | The source — the only hand-edited **distributable** (demo, tests, workflows are edited too, but only this file ships). ES5-style browser script, zero runtime deps. |
| `hexagons.min.js` | **Generated** by `npm run build` (terser), **gitignored** — exists only locally and at publish time. |
| `index.html` | Demo playground: sections incl. the spintax hero; live controls; own fps meter. |
| `test/` | Frame-hash + `palette()` snapshot tests (see below). |

Scripts: `build` (terser), `size` (gzip byte count), `lint` (eslint 9 flat config),
`test` (the runner below). License MIT © 301ST.

**Testing needs a real browser, so the zero-deps claim is scoped precisely:** the
*library* has zero dependencies; the *repo* carries `eslint`, `terser`, and
**`playwright`** as devDependencies — the frame-hash test must rasterize a canvas
reproducibly, and a pinned Chromium is the only way to do that in CI. `npm test`
runs headless locally and in the release workflow; the pre-push gate calls it.
(This resolves the spec-vs-backlog conflict the external review caught: tests were
demanded but no runner was budgeted.)

**Trusted Publisher (OIDC) is configured BEFORE the first release** — octagons
shipped 0.1.0–0.1.2 without provenance and the cleanup is still on its TODO three
releases later. Here the order is: repo → trusted publisher → `release.yml` → tag.
No `NPM_TOKEN` secret ever enters the repository. (Octagons ADR 003, adopted.)

## Acceptance criteria for v0.1.0

- ≤ 5.0 KB gzipped (`npm run size`). Grounded in measurement, not hope: octagons'
  actual `npm run size` is **3764 B**, so the old 4.0 KB ceiling left ~330 B for
  the auto-palette, `orientation`, `inset`, and hive — unrealistic (external review
  caught this). Budget: ~3.7 KB engine + ~0.8 KB palette + ~0.5 KB hexagon-specific.
  An early size-spike (TODO) validates the split before features pile up.
- `Hexagons.palette()` is pure and deterministic: same hex ⇒ identical output, both
  themes; snapshot-tested. Derived stops clear the edge-visibility floors vs
  `background`; achromatic seeds (chroma < 12) produce a neutral palette, never an
  invented hue; out-of-gamut derivations reduce chroma, never clip channels.
- Pin lifecycle verified via `hx.get()`: explicit options survive `set({brand})`,
  `'auto'` unpins, and `get()` reflects both states plus resolved derived colours.
- Steady ~60 fps, one full-screen instance, one clean tab (page's own meter).
- Two runs with the same seed: identical raw-RGBA frames after 300 frames, in the
  pinned test browser at fixed viewport/DPR (per-environment claim — see
  Determinism).
- Loop verifiably pauses when scrolled out of view and on a hidden tab.
- `set()` round-trips every option in the table above, including `seed` — verified
  observably through `get()` plus a frame-hash change/no-change assertion (the
  external review is right that "round-trips" is untestable without a getter).
- `bond > 0` cleanly disables `inset` (v0.1 exclusion), and the demo reflects it.
- `pattern()` tile is seamless (visually check the `√3·s × 3s` repeat at 3 sizes).
- Demo renders in both themes; spintax.net link present on every promo surface.
- Published to npm **with provenance** on the first release.

## See also
- [TODO.md](TODO.md) — backlog and open decisions
- [decisions/](decisions/) — ADRs (001 adopts three octagons ADRs)
- `../.agents/REGISTRY.md` — why the environment is set up as it is
- `W:\Projects\octagons-lite` — the sibling; its `docs/` and `AGENTS.md` are the
  reference implementation of this spec's engine
- `W:\Projects\casino-platform\packages\core\utils\token-engine\` — the auto-palette
  reference (LCH derivation, contrast guards, `mapToTrigonsConfig` precedent);
  progenitor: `W:\Projects\dark-theme-generator`
