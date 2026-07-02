# Deployment Progress Report

Generated: 2026-07-02

## Executive summary

Tri-Ad has been deployed to Cloudflare Pages and now has an automated GitHub Actions deployment path from `main`.

Live production URL:

```text
https://triad-cognitive-archetype-mapper.pages.dev
```

Current operational status:

```text
Static app: deployed and reachable
Pages Functions: deployed and reachable
GitHub Actions deploy: passing
Turnstile widget: created and configured for the Pages hostname
Resend receiver inbox: configured as benna.anis2@gmail.com
Submission emails: blocked until FROM_EMAIL uses a verified Resend sender domain
```

The application is safe to inspect and smoke-test on the production URL. Do not invite beta testers to submit feedback or expanded-report requests until the `FROM_EMAIL` item below is completed.

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

### Cloudflare resources

- Created Cloudflare Pages project:

```text
triad-cognitive-archetype-mapper
```

- Created production Pages hostname:

```text
triad-cognitive-archetype-mapper.pages.dev
```

- Created Turnstile widget:

```text
Tri-Ad private beta
```

- Configured Turnstile domain:

```text
triad-cognitive-archetype-mapper.pages.dev
```

- Added Cloudflare Pages runtime secrets:
  - `RESEND_API_KEY`
  - `RECEIVER_EMAIL`
  - `BETA_INVITE_CODE`
  - `TURNSTILE_SECRET_KEY`
  - `TURNSTILE_EXPECTED_HOSTNAME`
  - `RATE_LIMIT_MAX`

Pending runtime secret:

```text
FROM_EMAIL
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
GET /                      200
GET /api/health            200
GET /api/premium-order     405
GET /api/beta-feedback     405
POST /api/beta-feedback    503 until FROM_EMAIL is configured
```

The `503` on submission POSTs is currently expected because the app fails closed when required production email configuration is incomplete.

## Remaining blocker

### Configure verified Resend sender

`benna.anis2@gmail.com` is valid as the operator inbox and has been configured as `RECEIVER_EMAIL`.

It cannot be used as `FROM_EMAIL` unless Resend supports sending from that domain for the account, which is not expected for `gmail.com`. Resend production sending should use a domain owned and verified by the operator.

Required next step:

```text
1. Buy or choose a domain.
2. Verify that domain in Resend.
3. Create a sender such as Tri-Ad Beta <beta@your-domain.example>.
4. Set Cloudflare Pages secret FROM_EMAIL to that sender value.
5. Redeploy or retry submissions.
6. Run the production submission smoke test with correct invite code and Turnstile.
```

Wrangler command once the sender is available:

```bash
printf '%s' 'Tri-Ad Beta <beta@your-domain.example>' \
  | npx wrangler pages secret put FROM_EMAIL \
      --project-name triad-cognitive-archetype-mapper
```

Use the same Cloudflare token environment that was used for deployment.

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
[ ] Resend sending domain verified
[ ] FROM_EMAIL set in Cloudflare Pages
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
