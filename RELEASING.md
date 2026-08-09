# Releasing hexagons-lite

No npm token ever enters this repository, its CI secrets, or any agent's hands.
Releases publish via **OIDC Trusted Publishing** with provenance
(`.github/workflows/release.yml`).

## One-time bootstrap (v0.1.0) — done by a human, locally

npm cannot attach a trusted publisher to a package that does not exist yet
(verified 2026-08-09: the setting lives in the *package's* Settings page; see
npm docs "Trusted publishing" and npm/cli#8544). So the very first version is
published from a maintainer's machine — the only publish that ever bypasses
CI, and the only one without provenance:

```sh
npm login              # browser auth; credentials stay in YOUR ~/.npmrc
npm publish --access public   # prepack builds hexagons.min.js automatically
```

## One-time setup on npmjs.com (right after the first publish)

npmjs.com → package **hexagons-lite** → **Settings** → **Trusted Publisher** →
GitHub Actions:

| Field | Value |
|---|---|
| Organization or user | `investblog` |
| Repository | `hexagons-lite` |
| Workflow filename | `release.yml` |
| Environment | *(leave empty)* |

While in Settings, also set **Publishing access → Require two-factor
authentication or an automation or granular access token** (or the
trusted-publisher-only option if offered) so tokens can't publish at all.

## Every release after that

```sh
# 1. bump the version
npm version patch          # or minor / major — updates package.json + git tag
# 2. update CHANGELOG.md, amend or commit
# 3. push with the tag
git push && git push --tags
```

The `release.yml` run on the tag re-runs lint/build, verifies the tag matches
`package.json`, verifies the tarball carries `hexagons.js` + `hexagons.min.js`,
and publishes with provenance. If the version is already on the registry the
run exits green (idempotent) — re-tagging never leaves a red run behind.

## The three npm failure modes, in the order they appear

Inherited from octagons (AGENTS.md has the full text): `is not a legal HTTP
header value` → whitespace in a token secret; `EOTP` → wrong token *type* with
2FA; `404 Not Found - PUT` → masked 403, the credential has no publish rights /
no trusted publisher configured — and the log prints a provenance success line
right before failing. None of these can occur on the OIDC path above.
