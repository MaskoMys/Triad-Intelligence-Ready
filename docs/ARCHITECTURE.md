# Architecture

## Design goals

Tri-Ad is optimized for a small controlled beta, privacy-conscious operation, low hosting cost, simple maintenance, and a clean path to a larger product. It deliberately avoids accounts and a production database until the beta establishes that persistent identities are necessary.

## Runtime layers

### Browser application

The browser bundle is built by Vite and served as static assets from Cloudflare Pages.

- React renders the landing, assessment, results, history, feedback, and report-request experiences.
- `src/domain/assessment/` contains pure scoring and archetype logic with no React dependency.
- `src/lib/storage.ts` validates and limits local history before saving it.
- `src/lib/telemetry.ts` keeps only local aggregate event counters.
- `src/pdf/generateReportPdf.ts` dynamically imports jsPDF when the participant requests a PDF.

### Cloudflare Pages Functions

Only `/api/*` is routed through Functions, controlled by `public/_routes.json`.

| Route                | Method | Purpose                                                 |
| -------------------- | ------ | ------------------------------------------------------- |
| `/api/health`        | GET    | Non-sensitive deployment health check                   |
| `/api/beta-feedback` | POST   | Privacy-conscious beta feedback without identity fields |
| `/api/premium-order` | POST   | Explicit expanded-report request with name and email    |

Submission Functions share security logic in `src/server/submission.ts`. They validate content type and size, check origin, enforce configuration, apply optional KV rate limiting, validate schema, reject bots, verify the invite code and Turnstile, then verify that the submitted profile code matches the submitted normalized scores.

### Email delivery

Cloudflare calls Resend through its HTTP API. Resend credentials never appear in the browser bundle. There is no SMTP, FormSubmit, or browser email fallback.

## Data flow

```text
Question choices
  → local scoring
  → result object
  ├─ optional localStorage history
  ├─ local PDF / JSON export
  ├─ beta feedback POST (no name/email)
  └─ expanded report POST (explicit name/email)
```

The edge does not receive raw question responses. It receives normalized scores and recomputes the profile code for consistency. This prevents simple profile-code tampering, but it is not a cryptographic attestation of how the scores were created. For the private beta, submissions are research signals rather than trusted credentials.

## Scaling path

Keep the current architecture until beta evidence requires more:

1. **Current beta:** local history, email-based feedback, no accounts.
2. **Validated retention need:** add consented pseudonymous event storage using D1 or an analytics product.
3. **Paid reports:** add payment-provider webhooks and a durable order table; never trust client payment state.
4. **Accounts:** add only when cross-device history is a demonstrated user need.
5. **Assessment validation:** version question sets and scoring formulas before running larger cohorts.

Any future database should use data minimization, explicit consent, retention limits, and deletion workflows from the start.
