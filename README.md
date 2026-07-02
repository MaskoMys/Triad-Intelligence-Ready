# Tri-Ad Cognitive Archetype Mapper

Tri-Ad is a local-first, experimental self-reflection application for a controlled private beta. A participant answers 30 scenario questions and receives an archetypal profile across eight cognitive-style traits and three broader dimensions.

> **Important:** Tri-Ad is an experimental self-reflection tool. It is not a clinical, educational, employment, financial, medical, or psychological diagnostic instrument. Its scoring model has not been externally validated as an intelligence or psychometric test.

## Current status

**Version:** `1.0.0-beta.2`  
**Intended audience:** a private cohort of approximately 20 invited beta testers  
**Recommended host:** Cloudflare Pages with Pages Functions  
**Production database:** none; assessment history remains in the participant's browser

## What is included

- 30-question responsive assessment with keyboard-friendly controls.
- Eight normalized trait scores and three macro scores.
- Eighteen reachable base profile codes with fluid/anchored extensions.
- Local-only assessment history, JSON export, and complete local deletion.
- Client-side PDF generation, lazy-loaded only when requested.
- Optional, privacy-conscious beta feedback submission without name or email.
- Optional expanded-report request that explicitly collects name and email.
- Cloudflare Turnstile, private invite-code validation, honeypot and timing checks.
- Strict server-side schemas, same-origin enforcement, request-size limits, and generic public errors.
- Resend-only email delivery from Cloudflare Pages Functions.
- Optional Cloudflare KV rate limiting plus a recommendation to use Cloudflare WAF rate limiting.
- TypeScript strict mode, ESLint, Prettier, source-policy checks, scoring diagnostics, CI, and automated tests.

## Architecture

```text
Browser
├─ React 19 + Vite + Tailwind CSS
├─ assessment scoring runs locally
├─ history and event counts stay in localStorage
├─ PDF is generated locally
└─ optional POST requests
   ├─ /api/beta-feedback
   └─ /api/premium-order
        ↓
Cloudflare Pages Functions
├─ schema validation
├─ same-origin and size checks
├─ invite code + Turnstile verification
├─ profile consistency check
├─ optional KV rate limit
└─ Resend HTTP API
```

The browser never receives `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, or the server-side beta invite code. Static files are built into `dist/`; Functions remain in `functions/` and are deployed by Cloudflare.

## Prerequisites

Install:

- [Node.js 22 LTS](https://nodejs.org/)
- npm 10 or newer
- Git

Confirm:

```bash
node --version
npm --version
git --version
```

## Fast local setup

```bash
# 1. Install the exact locked dependencies
npm ci

# 2. Run the frontend
npm run dev
```

Open `http://127.0.0.1:3000`.

`npm run dev` runs only Vite. Static assessment, scoring, history, export, and PDF features work. API submissions require the full Pages development server below.

## Full local Cloudflare setup

```bash
# 1. Create local Function variables
cp .dev.vars.example .dev.vars

# 2. Keep EMAIL_DELIVERY_MODE=console for safe local testing
# 3. Build and run the full Pages application
npm run dev:pages
```

Open the URL printed by Wrangler, normally `http://localhost:8788`.

Never commit `.dev.vars`; it is ignored by Git.

## One-command verification

```bash
npm run check
```

This runs formatting validation, strict TypeScript, ESLint, test coverage thresholds, scoring diagnostics, repository policy checks, the production build, and a production-dependency security audit.

To test the actual Cloudflare Pages router and Functions locally:

```bash
npm run smoke:pages
```

The smoke test starts Wrangler temporarily and verifies the static app, health endpoint, method restrictions, invite-code rejection, premium request Function, and feedback Function.

## Common commands

| Command                   | Purpose                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`             | Start the Vite frontend on port 3000                                    |
| `npm run dev:pages`       | Build and run static assets plus Pages Functions                        |
| `npm run build`           | Create the production frontend in `dist/`                               |
| `npm run typecheck`       | Run strict TypeScript checks                                            |
| `npm run lint`            | Run ESLint with zero warnings allowed                                   |
| `npm run format`          | Format supported files with Prettier                                    |
| `npm run test`            | Run all automated tests                                                 |
| `npm run test:coverage`   | Run tests and enforce coverage thresholds                               |
| `npm run analyze:scoring` | Regenerate `docs/SCORING_ANALYSIS.md`                                   |
| `npm run check:source`    | Scan for banned artifacts, risky fallbacks, and invalid Tailwind scales |
| `npm run audit:prod`      | Audit production dependencies                                           |
| `npm run check`           | Run the complete quality gate                                           |
| `npm run smoke:pages`     | Exercise a local Cloudflare Pages deployment                            |

## Scoring model

Each answer contributes positive, negative, or neutral weights to eight traits:

- Imagination: creativity (`C`) or innovation (`I`)
- Intuition: discernment (`D`), physical awareness (`P`), or symbolic/metaphysical sensitivity (`M`)
- Judgment: logical structure (`L`), predictive thinking (`R`), or emotional context (`E`)

For each trait, the engine calculates the theoretical minimum, random-choice expectation, and theoretical maximum. The expectation maps to 50. Values below and above that expectation are scaled separately toward 0 and 100. This avoids treating a structurally positive raw score as automatically above average.

A base profile code selects the stronger imagination trait, the strongest intuition trait, and the strongest judgment trait. The real profile set is:

```text
CDL CDR CDE  CPL CPR CPE  CML CMR CME
IDL IDR IDE  IPL IPR IPE  IML IMR IME
```

Implementation-balance simulation currently reaches all 18 profiles. That does **not** establish psychological validity, reliability, or predictive usefulness. See [Scoring model](docs/SCORING_MODEL.md) and [generated diagnostics](docs/SCORING_ANALYSIS.md).

## Privacy model

- Assessment responses are scored in the browser.
- Saved history is optional and stored only in that browser's `localStorage`.
- Local history is capped and can be exported or deleted by the participant.
- Name and email are not stored in local assessment history.
- The anonymous beta-feedback endpoint sends profile scores, selected feedback, and local aggregate event counts; it does not request name or email.
- The expanded-report endpoint sends name, email, profile scores, optional feedback, and local aggregate event counts only after explicit submission.
- No account system, behavioral advertising SDK, or third-party browser analytics package is included.

Browser storage is not encrypted and should not contain secrets. Clearing browser data also removes saved Tri-Ad history.

## Project structure

```text
functions/api/                  Cloudflare Pages Functions
scripts/                        scoring, source, and deployment smoke checks
src/components/                 React UI
src/domain/assessment/         questions, types, archetypes, scoring
src/lib/                        local storage, download, telemetry helpers
src/pdf/                        lazy client-side PDF generator
src/server/                     schemas, security, email, rate limiting
public/                         Pages headers, routes, icons, manifest
.github/                        CI and Dependabot configuration
docs/                           architecture, security, scoring, deployment
```

## Deploying

Follow the beginner-friendly, click-by-click guide in:

**[docs/CLOUDFLARE_DEPLOYMENT.md](docs/CLOUDFLARE_DEPLOYMENT.md)**

The recommended flow is GitHub → Cloudflare Pages. Use:

```text
Build command: npm run build
Build output directory: dist
Node version: 22
```

Do not upload only the `dist/` folder through an ordinary static drag-and-drop workflow; the API Functions live outside `dist/`. Git integration or Wrangler deployment must include the repository's `functions/` directory.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Cloudflare deployment](docs/CLOUDFLARE_DEPLOYMENT.md)
- [Deployment progress report](docs/DEPLOYMENT_PROGRESS.md)
- [Security design](docs/SECURITY.md)
- [Scoring model](docs/SCORING_MODEL.md)
- [Scoring diagnostics](docs/SCORING_ANALYSIS.md)
- [Beta readiness and PMF loop](docs/BETA_READINESS.md)
- [Performance notes](docs/PERFORMANCE_NOTES.md)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
- [Security reporting](SECURITY.md)
