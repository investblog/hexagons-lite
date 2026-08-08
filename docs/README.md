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
~3 KB gzipped. Two modes: hexagons drifting toward the viewer in depth, or the living
honeycomb lattice. One `seed` integer makes the whole field reproducible — one seed,
one hive; change the seed, a new variant. That is the spintax idea applied to
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
default) is the pure shared-edge lattice; `inset` and `bond` compose (a fused pair
shrinks as one outline).

## Static pattern — no canvas at all

The tiling is periodic with a `√3·s × 3s` rectangular repeat, so `pattern()` returns
a seamless SVG tile as a ready-to-use `background-image`, same contract as octagons:

```js
document.querySelector('pre').style.backgroundImage =
  Hexagons.pattern({ size: 18, opacity: 0.09 });
```

| Option | Default | What |
|---|---|---|
| `size` | `18` | Cell pitch (width across flats) in px |
| `color` | `'#8fa2ff'` | Stroke colour *(placeholder — restate in spintax.net palette before release)* |
| `opacity` | `0.12` | Stroke opacity — the contrast knob |
| `weight` | `1` | Stroke width |
| `orientation` | `'pointy'` | `'pointy'` or `'flat'` |
| `inset` | `0` | Cell shrink in px |
| `background` | `null` | Optional solid fill behind the lines |
| `raw` | `false` | Return bare `<svg>` markup instead of `url(...)` |

Legibility floor: six corners at 120° survive smaller pitches than eight at 135° —
expect hexagons to stay legible down to roughly **14 px** where octagons needed 24.
Verify on 1x and retina before the README states the number.

## Options (v0.1 contract)

Identical to octagons wherever the concept carries over — this is deliberate, so a
user of one library can drive the other without relearning:

| Option | Default | Applies to | What |
|---|---|---|---|
| `mode` | `'field'` | — | `'field'` or `'hive'` |
| `colors` | 3-stop gradient | both | Gradient stops along the edges *(final values from spintax.net palette)* |
| `accent` | tbd | field | Colour of the occasional highlighted cell |
| `hot` | tbd | hive | Colour of the sweeping light band |
| `background` | dark tbd | both | Base fill; `null` = transparent canvas |
| `halo` | tbd | both | Soft central glow; `null` disables |
| `size` | `90` | both | Lattice pitch in px; scale factor for the field |
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
| `vignette` | `0.45` | both | Edge darkening; `0` disables (MUST be 0 on transparent canvas) |
| `maxDpr` | `2` | both | Device-pixel-ratio ceiling |
| `autoplay` | `true` | both | Start immediately |

Dropped from octagons: `nodes`, `nodeSize` (no gaps to decorate — see Inset).

## API (unchanged contract)

`Hexagons.init(selector, opts)` returns `null` if the selector matches nothing,
otherwise the same handle as octagons:

```js
var hx = Hexagons.init('.bg');
hx.set({ mode: 'hive', bond: 0.15 });  // change options live — set({seed}) MUST work (octagons shipped that bug)
hx.stop(); hx.start();
hx.step(1 / 60);                       // one frame off the rAF clock
hx.resize(); hx.destroy();
hx.canvas;
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

Offline rendering contract is octagons' verbatim: `background: null` **pairs with**
`vignette: 0` (the vignette bakes into the alpha channel otherwise), Playwright
screenshots need `omitBackground: true`, ProRes 4444 keeps alpha, and `step()` is
not gated by the visibility/intersection sleeping (only the rAF loop is).

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
| Default palette | Derive `colors`/`accent`/`background` from spintax.net's own palette, so every embed is on-brand by default. Sample the live site before coding; do not invent values here. |

## Naming (open decision — see TODO)

npm `hexagons` is squatted (a 0.0.0 stub), `honeycombs` and `hexes` are taken.
Free as of 2026-08-08: **`hexlines`** (recommended: it names the aesthetic),
`hexagon-bg`, `hexagons.js`. Global stays `Hexagons`, repo `investblog/hexagons`,
demo on GitHub Pages, regardless of the package name. A dispute for the squatted
`hexagons` via npm support is possible but must not block v0.1.

## Layout & release engineering

| Path | Role |
|---|---|
| `hexagons.js` | The source. The only file you edit. ES5-style browser script, zero deps. |
| `hexagons.min.js` | **Generated** by `npm run build` (terser), **gitignored** — exists only locally and at publish time. |
| `index.html` | Demo playground: sections incl. the spintax hero; live controls; own fps meter. |

Scripts: `build` (terser), `size` (gzip byte count), `lint` (eslint 9 flat config).
devDependencies: `eslint`, `terser` only. License MIT © 301ST.

**Trusted Publisher (OIDC) is configured BEFORE the first release** — octagons
shipped 0.1.0–0.1.2 without provenance and the cleanup is still on its TODO three
releases later. Here the order is: repo → trusted publisher → `release.yml` → tag.
No `NPM_TOKEN` secret ever enters the repository. (Octagons ADR 003, adopted.)

## Acceptance criteria for v0.1.0

- ≤ 3.5 KB gzipped (`npm run size`).
- Steady ~60 fps, one full-screen instance, one clean tab (page's own meter).
- Two runs with the same seed: byte-identical canvases after 300 frames.
- Loop verifiably pauses when scrolled out of view and on a hidden tab.
- `set()` round-trips every option in the table above, including `seed`.
- `pattern()` tile is seamless (visually check the `√3·s × 3s` repeat at 3 sizes).
- Demo renders in both themes; spintax.net link present on every promo surface.
- Published to npm **with provenance** on the first release.

## See also
- [TODO.md](TODO.md) — backlog and open decisions
- [decisions/](decisions/) — ADRs (001 adopts three octagons ADRs)
- `../.agents/REGISTRY.md` — why the environment is set up as it is
- `W:\Projects\octagons-lite` — the sibling; its `docs/` and `AGENTS.md` are the
  reference implementation of this spec's engine
