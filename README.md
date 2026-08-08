# hexagons

Animated honeycomb backgrounds built from **regular** hexagons. Line art on canvas —
the colour gradient runs along the edges — plus a filled low-poly mode when you
want the opposite. Zero dependencies, ~6.5 KB gzipped.

Three modes: hexagons drifting toward the viewer in depth, the living honeycomb
lattice, or a faceted crystal fill that assembles itself and freezes. And two
knobs that span the whole variant space: **`seed`** spins the geometry,
**`brand`** spins the colours.

[![npm](https://img.shields.io/npm/v/hexagons-lite.svg)](https://www.npmjs.com/package/hexagons-lite)
[![license](https://img.shields.io/npm/l/hexagons-lite.svg)](LICENSE)

## Install

```sh
npm install hexagons-lite
```

Or straight from a CDN, no build step:

```html
<script src="https://cdn.jsdelivr.net/npm/hexagons-lite@0.1/hexagons.min.js"></script>
```

Then:

```html
<div class="bg"></div>

<script>
  Hexagons.init('.bg', { mode: 'hive' });
</script>
```

The script defines a single global, `Hexagons`. There is no module build — it is a
browser script, and `main` points at the unminified source for bundlers that inline it.

The container needs a size of its own — the canvas fills it. A typical hero:

```css
.hero { position: relative; min-height: 100vh; }
.bg   { position: absolute; inset: 0; z-index: 0; }
.hero > .content { position: relative; z-index: 1; }
```

The live demo is `index.html` in this repo — a playground with every option wired to
a control, in both themes.

## Auto-palette: one colour in, the whole scene out

You do not pick five colours. You pass your brand's one:

```js
Hexagons.init('.bg', { brand: '#7c5cff' });
```

The library derives the background, halo, gradient stops, accent, and sweep colour
from that single hex — in CIE LCh, so hue stays *your* hue; contrast floors keep the
lines visible; out-of-gamut colours lose chroma, never shift hue. Multi-colour
brands pass an array — the first entry drives the field, the second becomes the
accent, the third tints the light sweep:

```js
Hexagons.init('.bg', { brand: ['#00abf3', '#d6af3c', '#a91455'] });  // the default
```

Two themes from the same brand: `theme: 'dark'` (default) or `'light'`. Explicit
colour options always win over derivation, and stay pinned across `set({ brand })`;
pass `'auto'` to hand one back. The derivation itself is public and pure:

```js
Hexagons.palette('#7c5cff')                    // → {colors, accent, hot, background, halo}
Hexagons.palette('#7c5cff', { theme: 'light' })
```

Grey-on-purpose brands stay grey: an achromatic seed derives a graphite palette —
no hue is ever invented.

## Modes

### `field` — depth

Regular hexagons scattered through depth, drifting toward the camera, overlapping at
different scales. Each one faces the viewer, so it stays exactly regular at any
distance. Some carry a concentric inner ring, a few use the accent colour, and the
field drifts with the pointer.

```js
Hexagons.init('.bg', {
  mode: 'field',
  count: 110,
  speed: 1,
  size: 90
});
```

### `hive` — the honeycomb

The 6.6.6 tiling — the real thing, not an approximation. A soft band of light sweeps
across the walls.

```js
Hexagons.init('.bg', {
  mode: 'hive',
  bond: 0.15,          // randomly fuse neighbouring cells
  orientation: 'flat'  // or 'pointy' (default)
});
```

`bond` is the probability of dropping a shared wall, which merges two cells into one
outline. Useful range is roughly **0.10–0.20**; past ~0.4 the comb falls apart. The
selection is deterministic, so bonds never flicker.

`inset` shrinks every cell by a few pixels, so neighbouring outlines become parallel
double walls — the read of a real comb. In v0.1 `bond` and `inset` are mutually
exclusive (`bond > 0` wins): fused cells form arbitrary polyhex shapes, and
offsetting their union outline costs more bytes than it is worth. Yet.

### `fill` — the crumpled crystal

Not line art: a **filled** faceted honeycomb. Every cell fans into six flat-shaded
facets over a diagonal brand gradient, assembles itself once with a staggered
entrance, then stays a completely static painting — zero CPU after the reveal.

```js
Hexagons.init('.bg', {
  mode: 'fill',
  chaos: 0.5,          // vertex jitter — 0 gives a strict comb of facets
  depth: 0.4,          // pseudo-lighting strength
  animation: {         // or null to appear instantly
    effect: 'scale',   // fade | scale | spin | fly
    direction: 'top',  // top | bottom | left | right | center | random
    duration: 1500,
    stagger: 0.6
  }
});
```

`animateIn()` / `animateOut()` replay the entrance or dissolve the surface — flip
themes the classy way: `animateOut()`, `set({ theme: 'light' })`, `animateIn()`.
The mesh is deterministic (no flicker, resize only recentres it), and a `seed`
makes the entrance reproducible frame-by-frame through `step(dt)`.

## Static pattern — no canvas at all

The honeycomb is periodic on a `size × √3·size` rectangle, so `pattern()` returns a
seamless SVG tile as a ready-to-use `background-image`:

```js
document.querySelector('pre').style.backgroundImage =
  Hexagons.pattern({ size: 18, opacity: 0.09 });
```

Nothing animates and nothing runs afterwards — it is one tile handed to CSS.

| Option | Default | What |
|---|---|---|
| `size` | `18` | Width across flats in px; the repeat tile is `size × √3·size` |
| `brand` | spintax triad | Auto-palette seed; `color` defaults to the derived middle stop |
| `theme` | `'light'` | Derivation profile (patterns usually sit on light surfaces) |
| `color` | *derived* | Stroke colour; explicit value overrides derivation |
| `opacity` | `0.12` | Stroke opacity — the contrast knob |
| `weight` | `1` | Stroke width |
| `orientation` | `'pointy'` | `'pointy'` or `'flat'` |
| `inset` | `0` | Cell shrink in px (double-wall look) |
| `background` | `null` | Optional solid fill behind the lines |
| `raw` | `false` | Return bare `<svg>` markup instead of `url(...)` |

Six corners at 120° survive small pitches well — hexagons stay legible down to
roughly 14 px, where an octagon needs 24.

## Offline rendering

The animation can be driven on your own clock, reproducibly:

```js
var hx = Hexagons.init('.bg', {
  seed: 42,             // same seed + same dt sequence => identical frames
  background: null,     // transparent canvas, so the PNGs carry alpha
  parallax: false,
  autoplay: false
});

hx.stop();
for (var i = 0; i < 600; i++) {   // 10 s at 60 fps
  hx.step(1 / 60);
  // screenshot hx.canvas here
}
```

With `background: null` the vignette switches itself off (it would bake into the
alpha channel otherwise) — pin `vignette` explicitly if you really want it. Frame
identity is per environment: a fixed browser build, viewport, and DPR.

`step(dt)`, not `render(absoluteTime)` — field motion is integrated and respawns
re-randomise, so frames must be produced in order from the start.

## Options

| Option | Default | Applies to | What |
|---|---|---|---|
| `mode` | `'field'` | — | `'field'`, `'hive'`, or `'fill'` |
| `chaos` | `0.5` | fill | Vertex jitter, 0–1 |
| `depth` | `0.4` | fill | Facet lighting strength |
| `animation` | scale/top | fill | Entrance animation object; `null` = instant |
| `brand` | spintax triad | both | Auto-palette seed — hex or array of hexes |
| `theme` | `'dark'` | both | `'dark'` or `'light'` derivation profile |
| `colors` | *derived* | both | Gradient stops along the edges |
| `accent` | *derived* | field | Colour of the occasional highlighted cell |
| `hot` | *derived* | hive | Colour of the sweeping light band |
| `background` | *derived* | both | Base fill. `null` = transparent canvas |
| `halo` | *derived* | both | Soft central glow. `null` disables |
| `size` | `90` | both | Width across flats in px; scale factor for the field |
| `count` | `110` | field | Number of hexagons |
| `seed` | *none* | field | Integer; reproducible scatter. Settable live |
| `speed` | `1` | both | Animation rate; `0` freezes |
| `weight` | `1` | both | Line thickness multiplier |
| `glow` | `true` | both | Soft halo around bright edges |
| `sweep` | `1` | hive | Light-band speed; `0` disables |
| `bond` | `0` | hive | Probability of fusing neighbours |
| `orientation` | `'pointy'` | hive | `'pointy'` or `'flat'` |
| `inset` | `0` | hive | Double-wall gap in px |
| `nesting` | `true` | field | Concentric inner rings on some cells |
| `parallax` | `true` | field | Pointer-driven drift |
| `vignette` | `0.45` | both | Edge darkening; auto-`0` on a transparent canvas |
| `maxDpr` | `2` | both | Device-pixel-ratio ceiling (init-only) |
| `autoplay` | `true` | both | Start immediately (init-only) |

## API

`init()` returns `null` if the selector matches nothing, otherwise:

```js
var hx = Hexagons.init('.bg');

hx.set({ mode: 'hive', bond: 0.2 });   // change options live
hx.set({ brand: '#e0356b' });          // re-derive palette; pinned options survive
hx.set({ accent: 'auto' });            // hand a pinned option back to the palette
hx.get();                              // effective options: derived colours resolved, pins listed
hx.stop();                             // pause
hx.start();                            // resume
hx.step(1 / 60);                       // draw one frame, off the rAF clock
hx.resize();                           // force a re-measure
hx.destroy();                          // remove canvas, detach listeners
hx.canvas;                             // the <canvas> element
```

## Performance

The things that actually cost frames in a full-screen canvas background:

- **It sleeps when off screen.** An `IntersectionObserver` pauses the loop when the
  container scrolls out of view, and page-visibility pauses it on a hidden tab.
- **Gradients are built once**, not per frame.
- **Glow avoids `shadowBlur`** — a wide dim stroke under a thin bright one gives the
  same look for roughly a third of the cost.
- **Device pixel ratio is capped at 2.**

## About the geometry

The regular hexagon is one of exactly three regular tilings of the plane — and the
best one. The honeycomb conjecture (proved by Thomas Hales, 1999) says the
hexagonal grid is the least-perimeter way to divide the plane into equal areas:
~7% less edge than squares, ~18% less than triangles, less than any exotic
curved-wall partition.

This library draws **only** perimeters — nothing is filled, every photon comes from
an edge. So the hexagon is literally the cheapest tiling in ink: the mathematically
optimal shape for line art. Its sibling library, [octagons](https://github.com/investblog/octagons),
was built around the opposite fact — a regular octagon cannot tile at all.

There is a reason nature keeps arriving here: planar cells average exactly six
sides (a consequence of Euler's formula), which is why bee combs, basalt columns,
and dragonfly wings all relax into hexagons.

## Browser support

Any browser with `<canvas>`. `ResizeObserver` and `IntersectionObserver` are used
when available and degrade gracefully without them.

## Credits

Built by [301ST](https://301.st) for [spintax.net](https://spintax.net) — a free,
open-source template engine that expands one template into thousands of unique,
deterministic text variants. This library applies the same idea to geometry: one
`seed` is a whole hive, one `brand` is a whole palette.

## License

MIT © [301ST](https://301.st)
