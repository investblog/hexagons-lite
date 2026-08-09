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
~5 KB gzipped. Two modes: hexagons drifting toward the viewer in depth, or the
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

## Fill mode — the crumpled crystal (ADR 004)

The third visual language, adopted from `W:\Projects\trigons-lite` at the user's
request: a **filled** faceted honeycomb that assembles itself once and then
stays a static painting. Line art remains the identity of `field`/`hive`/
`pattern()`; fill is deliberately different.

Mechanics (trigons', with our discipline):

- **Mesh.** The hive lattice's shared vertices plus each cell's centre, jittered
  by `chaos` (± `size·chaos/2`). Jitter is a pure function of the vertex's
  quantised position via `hash()` — shared vertices move together (watertight
  surface) and the mesh is **stable across resizes** (trigons re-randomises;
  we don't). Each cell fans into 6 centre triangles — the "crumpled crystal".
- **Colour, baked at generation.** Per triangle: diagonal ramp parameter
  `t = ((cx/W)+(cy/H))/2` through a 3-stop piecewise lerp, times pseudo-normal
  lighting `1 + dot(n̂, (0.6, 0.4))·depth`. Anti-aliasing seams between fills are
  closed by stroking each triangle with its own fill colour (trigons' seam
  trick). Default ramp is derived from the auto-palette:
  `[halo, colors[0], colors[1]]` — a dark crystal brightening toward a brand
  glow in one corner. (First cut anchored the ramp at `background`, L6–L12: on
  screen it read as flat black — facets need luminance spread; verified
  visually, per proof-loop.) A pinned `colors` becomes the ramp verbatim (so
  the casino-style `[bg, surface, accent]` triple works unchanged).
- **Entrance/exit.** `animation: { effect, direction, duration, stagger,
  easing }` — effects `fade | scale | spin | fly` (unknown → scale without
  twist), directions `top | bottom | left | right | center | random` computed
  from screen-space centroids, cubic easings. `stagger` splits the budget:
  wavefront `duration·stagger`, per-cell `duration·(1−stagger)`.
  `animation: null` appears instantly. `animateOut()` runs the mirror
  (`v = 1−p`). **After completion the loop stops** — the performance covenant
  "sleep when there is nothing to draw" extends to fill; `resize()`/`set()`
  repaint one static frame without replaying.
- **Determinism.** The entrance clock is the shared `t` accumulator, so
  `step(dt)` drives fill too. Spin angles and `direction: 'random'` delays are
  **hash-derived from piece centroids** — NOT drawn from the shared RNG: the
  field seeds that stream proportionally to `count`, and an early revision that
  drew from it made `count: 111` change the fill animation under the same seed
  (external review, Critical). Consequently fill is deterministic by
  construction, independent of `seed`, `count`, and call order; same dt
  sequence ⇒ identical fill frames, always.

**Grain (`facets`).** The fork the user was offered had three looks; the two
survivors both ship, selected by `facets`:

- `'crystal'` (default) — six centre-fan facets per cell, pseudo-normal from
  the jittered triangle edges: the trigons crumpled-crystal read.
- `'cells'` — each hexagon stays **whole**: one flat-shaded polygon per cell.
  Its shade direction comes from the jittered centre's displacement against
  the ideal lattice point (normalised, dotted with the same `(0.6, 0.4)`
  light) — organic, alive, unmistakably a honeycomb. At `chaos: 0` the
  displacement vanishes and the shade term goes flat, so the same setting
  yields the third fork option for free: the strict comb, a quantised brand
  gradient of perfect hexagons.

The entrance animates per piece either way — whole cells popping in reads
calmer than facet confetti; same options, same determinism.

Not applicable to fill (ignored): `sweep`, `bond`, `inset`, `weight`, `glow`,
`count`, `nesting`, `parallax`.

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
| `brand` | spintax logo triad | Auto-palette seed (hex or array); `color` defaults to the derived middle gradient stop |
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
Hexagons.init('.bg', { brand: ['#00abf3', '#d6af3c', '#a91455'] });  // multi-colour brand
```

`brand` accepts **a hex or an array of hexes** — real brands are often not one
colour (spintax.net's own `theme.css` opens with "Palette derived from logo:
#00abf3 blue, #d6af3c gold, #a91455 magenta"). This mirrors the progenitor
exactly: the engine's input *is* a colour array (`FlagPalette.flagColors`), and
its rule is that the `H+40°` synthetic complement is built **only when a single
chromatic colour is supplied** (`buildCandidatePool`, `chromatic.length === 1`);
with more, the real colours take the roles. Here: `brand[0]` drives the hue of
`background`/`halo`/`colors` ramp, `brand[1]` (when present) replaces the
synthetic accent, `brand[2]` (when present) tints `hot`. Achromatic entries
(C < 12) are skipped for role assignment, same as the engine.

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
   | `background` | `L 6, C min(0.2·C, 10), H` | `L 97, C 3, H` *(C 0 for achromatic seeds — rule 3)* |
   | `halo` | `L 12, C min(0.3·C, 15), H` | `L 92, C min(0.2·C, 8), H` |
   | `colors[0..2]` | `L 32/58/82`, `C ×0.9/1.0/0.55`, `H` | `L 72/52/32` (ramp inverted), same chroma scaling |
   | `accent` | `L 70, C, H+40°` *(or `brand[1]`'s C/H)* | `L 45, C, H+40°` *(or `brand[1]`'s C/H)* |
   | `hot` | `L 92, C 12, H` *(H from `brand[2]` if present)* | `L 28, C 24, H` *(same)* |

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
spintax.net's logo triad `['#00abf3', '#d6af3c', '#a91455']` (blue / gold /
magenta, confirmed against both the logo SVG and the site's `theme.css`) — and
derives everything else from it. No hand-picked
colour table exists in the library at all; spintax.net is client zero of its own
mechanism. Size budget for the whole feature (LCH↔sRGB + guard): ~0.6–0.8 KB
gzipped, inside the raised 4 KB ceiling.

## Options (v0.1 contract)

Identical to octagons wherever the concept carries over — this is deliberate, so a
user of one library can drive the other without relearning:

| Option | Default | Applies to | What |
|---|---|---|---|
| `mode` | `'field'` | — | `'field'`, `'hive'`, or `'fill'` |
| `facets` | `'crystal'` | fill | `'crystal'` (6 facets per cell) or `'cells'` (whole hexagons) |
| `chaos` | `0.5` | fill | Vertex jitter, 0–1; `0` + `'cells'` = the strict comb |
| `depth` | `0.4` | fill | Pseudo-lighting strength, ± per-facet luminance |
| `animation` | `{effect:'scale', direction:'top', duration:1500, stagger:0.6, easing:'ease-out'}` | fill | Entrance animation; `null` = appear instantly |
| `brand` | spintax logo triad | both | Auto-palette seed — hex or array of hexes (see Auto-palette). Settable live; re-deriving rebuilds gradients only |
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
| `maxDpr` | `2` | both | Device-pixel-ratio ceiling. **Init-only**: baked into all geometry, not settable via `set()` and not reported by `get()` |
| `autoplay` | `true` | both | Start immediately. **Init-only**: a moment, not state — use `start()`/`stop()` afterwards |

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
hx.animateIn({ effect: 'fly' });       // fill mode: replay the entrance (no-op elsewhere)
hx.animateOut();                       // fill mode: mirror exit; canvas stays blank after

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
`hexagons.js`, repo `investblog/hexagons-lite` (house style: repo = package name,
like `trigons-lite`), demo on GitHub Pages. A dispute for the
squatted `hexagons` via npm support remains possible later but does not block v0.1.

## Layout & release engineering

| Path | Role |
|---|---|
| `hexagons.js` | The source — the only hand-edited **distributable** (demo, tests, workflows are edited too, but only this file ships). ES5-style browser script, zero runtime deps. |
| `hexagons.min.js` | **Generated** by `npm run build` (terser), **gitignored** — exists only locally and at publish time. |
| `index.html` | Demo playground: sections incl. the spintax hero; live controls; own fps meter. |
| `scripts/size.mjs` | Cross-platform `npm run size`: terser API + Node zlib, no shell pipes (native Windows was breaking the shell pipeline for external reviewers). |

Scripts: `build` (terser), `size` (Node-zlib gzip byte count), `lint` (eslint 9
flat config). License MIT © 301ST.

**Verification model (user decision 2026-08-09): no test-runner dependency.** An
earlier revision planned `playwright` as a devDependency; the user cut it. The
repo stays at `eslint` + `terser` only. Correctness is verified by
**`test/verify.html`** — a dependency-free, step()-driven harness (runs even in
a background tab): serve the repo root and open it; the page reports PASS/FAIL
per check and ALL GREEN in the title. It pins the palette floors, fill/field
determinism, the `count`-independence and alpha-leak regressions (both found by
external review — the earlier ad-hoc console checks missed them, which is
exactly why the harness now lives in the repo), resize stability, the mid-
entrance resize wave, the transparent-canvas vignette rule, pin lifecycle, and
the `get()` snapshot contract. The **reviewer agent**
(`.agents/agents/reviewer.md`) runs it as the proof-loop's independent pass.
New invariants belong in the harness, not in one-off console runs.

**Trusted Publisher (OIDC) from the first tag — with one platform-forced
exception.** npm cannot attach a trusted publisher to a package that does not
exist yet (verified 2026-08-09; the setting lives in the package's Settings
page), so v0.1.0 is published once, locally, by a human — never a CI token —
and the trusted publisher is configured immediately after. Every subsequent
release goes through `release.yml` via OIDC with provenance, and the workflow
is idempotent (an already-published version exits green, killing octagons'
red-run-per-tag noise). **No `NPM_TOKEN` secret ever enters the repository or
its CI.** Full procedure: `RELEASING.md`. (Octagons ADR 003, adopted with this
correction.)

## Acceptance criteria for v0.1.0

- ≤ 6.75 KB (6912 B) gzipped (`npm run size`). History of this number, all
  measured: octagons = 3764 B; line-art v0.1 measured 5273 B (5315 after review
  fixes) against a 5.0 KB estimate, ceiling moved to 5.5 KB; ADR 004's fill
  mode was estimated at +1.0–1.3 KB and measured at +1361 B — **6676 B** total,
  20 B over the estimated 6.5 KB ceiling, so the ceiling froze at 6.75 KB with
  the measurement recorded. Marketing copy says "~6.5 KB gzipped". Trim
  attempts are recorded in AGENTS.md: deduplication and loop-ification both
  *increased* the gzipped size — trim only by measurement.
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
- `set()` round-trips every option in the table above except the two marked
  init-only (`maxDpr`, `autoplay`), including `seed` — verified
  observably through `get()` plus a frame-hash change/no-change assertion (the
  external review is right that "round-trips" is untestable without a getter).
- `bond > 0` cleanly disables `inset` (v0.1 exclusion), and the demo reflects it.
- Fill mode: the entrance wave plays per `animation` and the rAF loop verifiably
  stops after completion (static canvas, no idle repaints); a seeded
  `step(1/60)` run of the entrance is reproducible; container resize does NOT
  re-randomise the mesh; the demo's theme flip in fill mode plays out→in.
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
