# Contributing

## Local setup

```bash
npm ci
npm run check
```

Use Node 22 as specified by `.nvmrc`. Do not use `npm install --force` or `--legacy-peer-deps` to hide dependency problems.

## Before opening a pull request

```bash
npm run format
npm run check
npm run smoke:pages
```

A change to questions or weights must also regenerate `docs/SCORING_ANALYSIS.md` and explain the impact in the pull request.

## Engineering rules

- Keep domain scoring logic independent of React.
- Validate untrusted input at the Function boundary.
- Never expose server secrets through a `VITE_` variable.
- Never add an email, analytics, payment, or AI provider fallback without a security and privacy review.
- Keep client errors generic and server logs free of unnecessary personal data.
- Preserve keyboard navigation and reduced-motion behavior.
- Add tests for bug fixes and security controls.
- Do not claim clinical, intelligence, educational, or employment validity.

## Dependency changes

Use exact versions, commit `package-lock.json`, run the production audit, and review the resulting browser and edge bundle implications.
