# Deployment Progress Report

Generated: 2026-07-02

## Executive summary

Tri-Ad has been deployed to Cloudflare Pages and now has an automated GitHub Actions deployment path from `main`.

Live production URL:

```text
https://intmapper.com
```

Current operational status:

```text
Static app: deployed and reachable
Pages Functions: deployed and reachable
GitHub Actions deploy: passing
Custom domain: intmapper.com active on Cloudflare Pages
Turnstile widget: created and configured for production hostnames
Resend receiver inbox: configured as benna.anis2@gmail.com
Resend sender domain: intmapper.com verified
Submission emails: enabled with FROM_EMAIL=Tri-Ad Beta <beta@intmapper.com>
```

The application is safe to inspect and smoke-test on the production URL. Before inviting beta testers, complete one real browser submission with Turnstile and confirm exactly one operator email arrives.

## Work completed

### Repository readiness

- Added missing ignore rules for local secrets and generated artifacts:
  - `credentials*`
  - `.dev.vars`
  - `.env`
  - `dist`
  - `coverage`
  - `.wrangler`
- Added `.nvmrc` with Node `22`.
- Added `.dev.vars.example` for local Pages Function setup.
- Fixed stale footer version text from `1.0.0-beta.1` to `1.0.0-beta.2`.
- Removed the invalid `secrets.required` block from `wrangler.jsonc`; Wrangler Pages config does not support that key.
- Upgraded `wrangler` from `4.101.0` to `4.106.0`, clearing the dev-tool audit issue.
- Ran Prettier across the repository so the documented quality gate can pass.
- Updated `scripts/analyze-scoring.ts` so generated `docs/SCORING_ANALYSIS.md` is Prettier-formatted and `npm run check` remains idempotent.

### GitHub automation

- Added `.github/workflows/deploy.yml`.
- Added `.github/dependabot.yml`.
- Added GitHub repository secrets:
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_API_TOKEN`
  - `VITE_TURNSTILE_SITE_KEY`
- Pushed deployment commits to `main`:
  - `df3fe19` - `Prepare Cloudflare Pages deployment`
  - `24ae9dd` - `Update workflow action versions`
- Verified the `CI and Deploy` workflow passes and deploys Cloudflare Pages from `main`.
- Updated the workflow to `actions/checkout@v6`, `actions/setup-node@v5`, and `cloudflare/wrangler-action@v4`.

### Cloudflare resources

- Created Cloudflare Pages project:

```text
triad-cognitive-archetype-mapper
```

- Created production Pages hostname:

```text
triad-cognitive-archetype-mapper.pages.dev
```

- Added custom Pages domains:

```text
intmapper.com
www.intmapper.com
```

- Added Cloudflare DNS records:
  - proxied CNAME `intmapper.com` to `triad-cognitive-archetype-mapper.pages.dev`
  - proxied CNAME `www.intmapper.com` to `triad-cognitive-archetype-mapper.pages.dev`
  - Resend DKIM TXT `resend._domainkey.intmapper.com`
  - Resend SPF MX/TXT records on `send.intmapper.com`
  - recommended DMARC TXT `_dmarc.intmapper.com`

- Created Turnstile widget:

```text
Tri-Ad private beta
```

- Configured Turnstile domains:

```text
intmapper.com
www.intmapper.com
triad-cognitive-archetype-mapper.pages.dev
```

- Added Cloudflare Pages runtime secrets:
  - `RESEND_API_KEY`
  - `RECEIVER_EMAIL`
  - `BETA_INVITE_CODE`
  - `TURNSTILE_SECRET_KEY`
  - `TURNSTILE_EXPECTED_HOSTNAME`
  - `RATE_LIMIT_MAX`
  - `FROM_EMAIL`

- Verified Resend sending domain:

```text
intmapper.com
```

- Sent one direct Resend verification email from:

```text
Tri-Ad Beta <beta@intmapper.com>
```

## Verification performed

Local verification:

```bash
npm run check
npm run smoke:pages
```

Both passed after the deployment-readiness changes.

Production verification:

```text
GET https://intmapper.com/                      200
GET https://intmapper.com/api/health            200
GET /api/premium-order                          405
GET /api/beta-feedback                          405
Direct Resend send from beta@intmapper.com      accepted
```

## Remaining final checks

### Browser submission smoke test

The remaining production check requires a real browser Turnstile token.

Run this before inviting beta testers:

```text
1. Open https://intmapper.com in a normal browser.
2. Complete a real assessment.
3. Submit beta feedback with the correct invite code.
4. Confirm exactly one email arrives at benna.anis2@gmail.com.
5. Submit one expanded-report request.
6. Confirm exactly one email arrives and the reply-to address is the participant address.
7. Submit once with a wrong invite code and confirm rejection.
8. Submit without completing Turnstile and confirm rejection.
```

### Hostname behavior

The server accepts Turnstile tokens from `intmapper.com`, `www.intmapper.com`, and `triad-cognitive-archetype-mapper.pages.dev`. The custom domain should be treated as the primary public URL.

## Useful operational files

Committed files:

```text
.github/workflows/deploy.yml
.github/dependabot.yml
.nvmrc
.dev.vars.example
wrangler.jsonc
docs/CLOUDFLARE_DEPLOYMENT.md
docs/SECURITY.md
docs/BETA_READINESS.md
```

Ignored local files created during deployment:

```text
credentials-rotate-later.txt
credentials-generated.env
```

These ignored files contain operational secrets and must not be committed or pasted into issue trackers.

## DevOps handoff checklist

Before inviting beta testers:

```text
[x] Cloudflare Pages project exists
[x] Production URL serves the app
[x] Pages Functions are deployed
[x] GitHub Actions deploy from main passes
[x] Turnstile widget exists for production hostname
[x] Receiver inbox configured
[x] Resend sending domain verified
[x] FROM_EMAIL set in Cloudflare Pages
[ ] Successful real feedback submission sends exactly one email
[ ] Successful expanded-report request sends exactly one email
[ ] Wrong invite code is rejected in production
[ ] Missing Turnstile is rejected in production
[ ] Operator has rollback and secret-rotation procedure ready
```

## Notes for future engineers

- The app is intentionally local-first and has no production database.
- Assessment history remains in the participant browser.
- Cloudflare Pages Functions are only used for `/api/*`.
- Submission endpoints intentionally fail closed when required secrets are missing.
- Do not add analytics, payment, account storage, or alternate email delivery without updating the security and privacy docs.
- Dependabot opened several dependency PRs after `.github/dependabot.yml` was added; treat them as normal maintenance and merge only after checks pass.
