# Security policy

## Supported version

Security fixes are applied to the latest beta version on the `main` branch.

## Reporting a vulnerability

Do not open a public GitHub issue for a suspected vulnerability, leaked secret, or participant-data exposure. Send a private report to the repository owner or use GitHub's private vulnerability reporting feature if it is enabled.

Include:

- affected URL, file, or commit;
- reproduction steps;
- expected and observed behavior;
- likely impact;
- screenshots or proof-of-concept data with all personal information removed.

Do not test against real beta participants, send unsolicited email through the production endpoint, bypass access controls on other accounts, or retain personal information. Use a local environment or an authorized preview deployment.

## Secret exposure

If a secret is committed or shown publicly, treat it as compromised even if it is deleted later. Rotate the affected Cloudflare, Turnstile, Resend, and invite-code values immediately, then review deployment and provider logs.
