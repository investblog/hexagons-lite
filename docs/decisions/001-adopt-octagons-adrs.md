---
type: decision
status: accepted
date: 2026-08-08
project: hexagons
---

# 001 — Adopt three octagons ADRs wholesale

## Context

hexagons is a deliberate sibling of `octagons` (W:\Projects\octagons-lite): the same
engine skeleton, the same API contract, the same release machinery, an inverted
geometry story. Octagons recorded three architecture decisions whose reasoning is
engine-level, not shape-level.

## Decision

Adopt, without re-litigating:

1. **Line art over fills** (octagons ADR 001). Nothing is filled; the gradient runs
   along edges. For hexagons this additionally aligns with the honeycomb conjecture —
   the library draws only perimeters and the hexagon is the minimal-perimeter tiler.
2. **`step(dt)`, not `render(absoluteTime)`** (octagons ADR 002). Field motion is
   integrated with randomized respawn; there is no closed form to seek to. Frames are
   produced in order; parallel/out-of-order rendering is explicitly out of scope
   until a real need appears.
3. **Trusted Publisher (OIDC) over token publishing** (octagons ADR 003) — with the
   order inverted from octagons' experience: configure the trusted publisher
   **before** the first release, so no release ever ships without provenance and no
   `NPM_TOKEN` secret ever enters the repository.

## Consequences

- The engine port must not "improve" any of the three in passing; superseding one
  requires a new ADR here.
- The first release is blocked on trusted-publisher configuration (TODO), by design.

## Addendum (2026-08-09) — decision 3, platform constraint

npm turned out to forbid configuring a trusted publisher for a not-yet-published
package (the setting lives in the package's Settings page; npm/cli#8544). By the
user's explicit decision the bootstrap follows the house pattern (octagons,
trigons-lite): a one-time `NPM_TOKEN` repo secret drives
`bootstrap-publish.yml`, and both the secret and the workflow are deleted right
after the trusted publisher is configured — the token's lifetime is one
workflow run, not three releases (octagons' open TODO is the counter-example).
Improvement over the neighbours: the bootstrap publishes with `--provenance`
(attestation via the GHA OIDC token, auth via NPM_TOKEN), so no version ever
ships without provenance. See RELEASING.md.
