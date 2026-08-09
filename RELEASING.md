# Releasing hexagons-lite

No npm token ever enters this repository, its CI secrets, or any agent's hands.
Releases publish via **OIDC Trusted Publishing** with provenance
(`.github/workflows/release.yml`).

## One-time bootstrap (v0.1.0) — token workflow, then delete the token

npm cannot attach a trusted publisher to a package that does not exist yet
(verified 2026-08-09: the setting lives in the *package's* Settings page; see
npm docs "Trusted publishing" and npm/cli#8544). The bootstrap follows the
house pattern (octagons, trigons-lite), by the user's explicit call:

1. npmjs.com → Access Tokens → Generate New Token → **Automation** (skips the
   OTP that 2FA forces on publish — the `EOTP` failure mode).
2. GitHub repo → Settings → Secrets and variables → Actions → New repository
   secret: name `NPM_TOKEN`, paste the token. Encrypted, write-only; the
   maintainer pastes it directly — it passes through no chat, file, or agent.
3. Actions → **Bootstrap publish (one-time)** → Run workflow
   (`bootstrap-publish.yml` sanity-checks the token shape, re-runs the gates,
   verifies the tarball, publishes; it requests `id-token` and publishes with
   `--provenance`, so even the bootstrap version carries an attestation).
4. **Immediately after success:** configure the Trusted Publisher (below),
   then DELETE the `NPM_TOKEN` secret and revoke the token on npmjs.com, and
   delete `bootstrap-publish.yml`. Octagons' open TODO — token still sitting
   in the repo three releases later — is the incident this step pins.

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
