# Changelog

## Unreleased (targets 0.1.0)

First implementation of the v0.1 spec (`docs/README.md`):

- `field` mode — regular hexagons drifting toward the viewer (engine ported from
  octagons); `seed` + `step(dt)` determinism verified: two 300-frame runs are
  pixel-identical in the test environment.
- `hive` mode — the 6.6.6 honeycomb: light sweep, deterministic `bond`,
  `orientation: pointy|flat`, `inset` double walls (`bond` wins over `inset`,
  per spec).
- Auto-palette — `brand` (hex or array; default: the spintax.net logo triad)
  derives all colours in CIE LCh(ab)/D65 with chroma-only gamut mapping,
  edge-visibility contrast floors, and a neutral path for achromatic seeds.
  Pin lifecycle: explicit options survive re-derivation; `'auto'` unpins.
  Public `Hexagons.palette()`.
- `pattern()` — seamless static SVG honeycomb (`size × √3·size` tile) with
  `brand`/`theme` support.
- `get()` — effective options snapshot with resolved derived colours and pins.
- Effective `vignette: 0` on a transparent canvas (removes the octagons footgun);
  verified: corner alpha stays 0 with `background: null`.
- `fill` mode (ADR 004) — the crumpled crystal: filled faceted honeycomb (6
  centre-fan facets per cell, diagonal brand ramp × pseudo-normal lighting,
  trigons' pattern language) with staggered entrance/exit animation
  (`fade|scale|spin|fly` × `top|bottom|left|right|center|random`), `chaos`,
  `depth`, `animateIn()`/`animateOut()`. Static after the reveal — the rAF loop
  verifiably parks. Hash-stable mesh (resize recentres, never re-randomises);
  seeded entrances reproduce through `step(dt)`.
- Fill grain `facets: 'crystal' | 'cells'` (ADR 004 addendum): `'cells'` keeps
  each hexagon whole — one flat-shaded polygon, shade direction from the
  jittered centre's displacement — giving the organic comb, and the strict
  quantised-gradient comb at `chaos: 0`. All three looks from the original
  design fork are reachable.
- Size: 6825 B min+gzip via the canonical Node-zlib `npm run size`
  (ceiling 6.75 KB = 6912 B, measured — see docs/README.md acceptance).
