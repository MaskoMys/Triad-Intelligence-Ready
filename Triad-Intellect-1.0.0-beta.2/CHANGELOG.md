# Changelog

## 1.0.0-beta.2 — 2026-06-18

### Added

- Privacy-conscious `/api/beta-feedback` Cloudflare Pages Function.
- Shared fail-closed submission pipeline with Turnstile, invite code, origin, size, bot-timing, and optional KV rate-limit controls.
- Resend idempotency, safe email templates, and request-reference IDs.
- Cloudflare router smoke test and expanded CI quality gate.
- Error boundary, reusable accessible modal, reusable Turnstile component, and explicit local telemetry consent flow.
- Detailed architecture, scoring, security, beta, and beginner deployment documentation.
- GitHub issue and pull-request templates.

### Changed

- Reorganized scoring into an isolated domain module.
- Rebalanced all 18 archetypes for implementation reachability.
- Replaced dynamic min-max claims with expectation-centered normalization and accurate limitations.
- Split the former monolithic result flow into maintainable components.
- Recomputed derived local-history fields instead of trusting browser storage.
- Lazy-loaded PDF dependencies and reduced the initial production bundle.
- Replaced the explicit SPA rewrite with Cloudflare Pages' native fallback behavior.

### Removed

- Legacy platform metadata and unused model dependencies.
- Express, SMTP, and keyless email fallbacks.
- Backend bundles from the static `dist/` directory.
- Unsupported psychometric, intelligence, verification, and diagnostic claims.
