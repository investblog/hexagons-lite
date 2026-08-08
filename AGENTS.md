# hexagons — AGENTS.md

Zero-dependency browser library: animated honeycomb backgrounds built from **regular**
hexagons, drawn as line art (the colour gradient runs along the edges, nothing is
filled). Sibling of `octagons` (W:\Projects\octagons-lite) — same engine skeleton,
inverted geometry story. No build backend, no framework. `index.html` is the
verification surface. Promotes **spintax.net** (credits + demo copy).

Two modes: `field` (hexagons at varying depth, drifting toward the viewer) and
`hive` (the 6.6.6 honeycomb tiling, with optional bonding of neighbours).

The spec is `docs/README.md` — contract-first: change the doc **before** the code.

## Pointer (where to look, in priority order)
- Rules: first `./.agents/rules/`, then the library `~/.agents/rules/`.
- Skills/agents: first `./.agents/`, then the library.
- Links and MCP configs: first the local `./.agents/map.yaml` + `./.agents/mcp-configs.yaml`;
  `~/.agents/...` — only to deploy a new rule. Build snapshot — `./.agents/generated/.agents.lock.yaml`.
- Adaptation registry: `./.agents/REGISTRY.md` — WHY something was added/changed
  (the WHAT graph lives in `map.yaml`, do not duplicate).
- **[CRITICAL] Plans, docs, and work-artifacts live ONLY in this project** —
  `./.agents/plans/{active,done}`, `./docs/`, the project tree. **NEVER write them to
  `~/.claude/`, `~/.codex/`, `~/.config/opencode/`, or any home/global agent folder**
  (see `project-docs`). Scratch/temp → session scratchpad or a gitignored project dir.
- On conflict the project wins (more specific overrides more general).

## Behavioral rules (base seed — expand as you work)
- **Think before coding.** State assumptions; if uncertain, ask. Present competing
  interpretations — don't pick silently. Push back when a simpler path exists.
- **Simplicity first.** Minimum code that solves the problem — no speculative features
  or error handling for impossible cases.
- **Surgical changes.** Touch only what the request needs. Match existing style; don't
  refactor what isn't broken or delete pre-existing dead code (mention it).
- **Goal-driven + verify.** Turn the task into a verifiable goal; confirm by an
  independent check, not assertion (see `proof-loop`, `code-review`).
- **Chat answers: structured and plain.** Lead with the answer, then the why.
- **Workspace hygiene.** Don't start servers unless asked; kill what you started and
  remove temp files when done.
- **Don't block on a slow tool.** If a tool doesn't answer within a few seconds,
  proceed without it and say so.

### Project-specific — inherited from octagons (same engine, incidents already paid for)
These rules were earned by real incidents in the sibling project `octagons` and apply
verbatim here because the engine is a port. New lessons of hexagons' own — append below.
- **Verify visually, in a browser — a passing lint proves nothing here.** This is a
  *visual* library; every defect found in octagons was invisible to tooling and obvious
  on screen. Serve `index.html` and look at it.
- **A background library must sleep when it is off screen.** Three full-screen
  instances animating at once starved the main thread to 0 fps. `IntersectionObserver`
  gates the loop; do not remove it. Page-visibility gating too.
- **Never rebuild gradients per frame.** They depend only on size and colour. Cache
  them; drop the cache on resize and `set()`.
- **`shadowBlur` is banned for glow.** Measured 20 fps vs 60 at equal output. Use the
  wide-dim-stroke-under-thin-bright-stroke pass instead.
- **Line art has no hidden-surface removal.** Any 3D/extruded mode must cull edges
  facing away from the vanishing point, or struts show as scratches.
- **Measure fps in ONE clean tab, with every other instance closed.** Leftover tabs
  each running a full-screen canvas dragged a healthy build down to 0 fps and the
  collapse was misread as a library bug. Prefer the page's own meter.
- **A blank canvas usually means it is asleep, not broken.** `document.hidden` is true
  whenever the browser window is not focused, and the loop pauses by design. Check it
  before debugging anything else.
- **Measure the claim, do not reason about it.** One `getImageData` call settles what a
  paragraph of reasoning only suggests.
- **Do not justify an omission with an unverified mechanism.** A wrong reason is worse
  than no reason: it survives review by sounding deliberate.

### Project-specific — hexagons' own (earned here)
- **Gzip beats clever — trim only by measurement.** Deduplicating the vertex table
  into a shared function grew the gzipped output by 20 B, and replacing unrolled
  derivation triples with loops grew it by 17 B more: gzip compresses repetition
  better than abstraction. Aliasing `Math` saved 4 B; `passes=3,unsafe` saved 3 B.
  Every size trim must be measured with `npm run size` before it is kept, and
  "cleaner" refactors must not be assumed smaller.

### npm publishing — the three failures, in the order they appear
Each one reports something other than its cause (all three hit octagons):
- **`is not a legal HTTP header value`** → the token secret contains whitespace or a
  line break. npm sends the token as an HTTP header.
- **`EOTP` / one-time password required** → the token is not an **Automation** token,
  and the account has 2FA. Token *type*, not delivery mechanism.
- **`404 Not Found - PUT`** → not a missing package. npm masks 403 as 404: the
  credential has no publish rights. For the OIDC path this means no trusted publisher
  is configured — and the log prints "Signed provenance statement … published" right
  before failing, which reads as success.

**Consequence for this project: configure npm Trusted Publisher BEFORE the first
release.** Octagons shipped three releases through the token bootstrap and every one of
them lacks provenance. Do not repeat that here — see docs/TODO.md.

## Self-configuration (adapt and explain)
`~/.agents` provides a minimal shared baseline. Adapting to the project is standard work:
1. Local in `./.agents/` — already there? use it.
2. No → in the baseline `~/.agents/`? pull the chain (`cp` the rule + linked
   skills/agents/MCP), append to the local `./.agents/map.yaml` and to the pointer.
3. Not anywhere → escalation: the `research` domain (websearch → fetch → browser),
   install/attach into the project, append to the local map.

**Activate an agent by running it.** An agent entering this project with no native config
of its own renders its own part from the chain — its hooks/MCP into its own file — logged
in REGISTRY. No agent sets up another agent's environment.

Accounting: `./.agents/map.yaml` = WHAT is attached. `./.agents/REGISTRY.md` = WHY.

Autonomy boundaries: adapting the PROJECT — without asking; changing the BASELINE
`~/.agents` — only by agreement with the user.

[CRITICAL] Any attach/install/replace — with an explanation in REGISTRY.md.

## Attached at initialization
- Library version: `8967634` (`~/.agents`), attached 2026-08-08
- Domains: `coding` (always-on `base` included on top; mirrors octagons-lite)
- Rules: rule-format, env-setup, project-docs, proof-loop, secrets, git-discipline,
  quality-py, quality-js, quality-bash, quality-perl, quality-cpp, code-search,
  code-review, user-docs
- Agents: docs, searcher, reviewer
- Skills: — (none in this chain)
- Hooks: secrets-guard (PreToolUse), light-lint (PostToolUse), git-quality-gate
  (pre-commit / pre-push)
- MCP: — (no project-bound MCP; `playwright` is machine-level global infra)

Do not duplicate the contents of `map.yaml` — links are read from `./.agents/map.yaml`.
