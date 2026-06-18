# Security design

## Scope

This document describes the controls in `1.0.0-beta.2`. They are designed for a controlled private beta, not for high-value identity, clinical, employment, or financial decisions.

## Security boundaries

### Trusted

- source code reviewed and deployed from the repository;
- Cloudflare project configuration and encrypted secrets;
- operator-controlled Resend account;
- server-side archetype table and validation code.

### Untrusted

- every browser request and submitted field;
- localStorage content;
- client-computed scores;
- request headers other than values validated against server context;
- public beta URLs and shared invite codes.

## Submission pipeline

Both `/api/beta-feedback` and `/api/premium-order` use the same fail-closed pipeline:

1. require same-origin requests when an `Origin` header is present;
2. require `application/json`;
3. reject declared or actual bodies above 16,384 bytes;
4. verify required production configuration before processing;
5. apply optional per-IP, per-route KV limits;
6. parse JSON and validate a strict Zod schema;
7. reject a hidden honeypot value;
8. reject forms submitted in under 1.5 seconds or after two hours;
9. compare the invite code with a timing-resistant digest comparison;
10. verify Turnstile server-side, including action and optional hostname;
11. recompute the profile code from normalized scores;
12. escape HTML and sanitize email subject fields;
13. send through the Resend HTTP API only;
14. return generic public errors with a request ID.

Unknown schema fields are rejected. The API does not accept a client-supplied archetype description or timestamp.

## Production configuration

The Function fails closed when these are absent:

```text
RESEND_API_KEY
RECEIVER_EMAIL
FROM_EMAIL
BETA_INVITE_CODE
TURNSTILE_SECRET_KEY
```

Local console delivery is allowed only when `EMAIL_DELIVERY_MODE=console` and the request hostname is local. It cannot silently disable delivery on a production hostname.

## Personal data

### Local browser data

Optional assessment history contains display name, timestamp, scores, profile, and optional feedback. It is stored in browser localStorage, is not encrypted, and is limited to 20 validated entries. Users can export or delete it.

Local aggregate beta event counts contain no page contents, click coordinates, external browsing behavior, or stable cross-site identifier.

### Feedback endpoint

The feedback endpoint accepts:

- profile code and normalized scores;
- selected feedback answers;
- local aggregate event counts;
- anti-abuse proof fields.

It does not request name or email.

### Expanded-report endpoint

The report endpoint explicitly accepts name and email in addition to the same profile data. This data is transmitted to Cloudflare and Resend and delivered to the operator inbox. Retention and deletion in the operator inbox are operational responsibilities outside this repository.

## Browser controls

`public/_headers` configures:

- a restrictive Content Security Policy;
- `frame-ancestors 'none'` and `X-Frame-Options: DENY`;
- MIME sniffing protection;
- a restrictive Permissions Policy;
- HSTS for HTTPS deployments;
- no-index headers for the private beta;
- immutable caching only for hashed assets.

Turnstile is the only permitted third-party browser script/frame/connect origin. Resend is called server-side and is intentionally absent from the browser CSP.

The CSP still permits inline styles because the email-independent React UI and third-party widget behavior use style attributes. Inline scripts are not allowed.

## Function-response controls

Every JSON helper response sets:

```text
Content-Type: application/json; charset=utf-8
Cache-Control: no-store, max-age=0
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
```

Static `_headers` rules do not automatically secure Function responses, so the API applies these independently.

## Anti-abuse layers

- Cloudflare Turnstile server verification is mandatory off localhost.
- A private invite code is mandatory in every environment.
- Honeypot and minimum/maximum form time reject common automation.
- Optional KV counters isolate routes and IP-derived keys.
- Cloudflare WAF rate limiting is recommended before a public launch.
- Cloudflare Access is recommended to restrict the entire 20-person beta by tester email.

The shared invite code is not identity authentication. KV rate limiting is best-effort and not an atomic global quota.

## Score integrity limitation

The edge verifies that the profile code is consistent with the submitted normalized scores. It does not receive raw responses and cannot prove that a modified browser did not fabricate those scores. Beta submissions must therefore be treated as participant-reported research data, not as trusted credentials.

If trusted score provenance becomes necessary, submit raw responses over an authenticated session and recompute all scores server-side with a versioned assessment definition.

## Logging

Function logs use request IDs, status codes, route names, and profile codes where useful. They avoid logging full payloads, participant feedback, invite codes, Turnstile tokens, name, or email.

Cloudflare and Resend may retain platform logs under their own policies. Configure provider retention and access controls appropriately.

## Dependency and supply-chain controls

- exact package versions and `package-lock.json`;
- `npm ci` in CI;
- production audit in the full quality gate;
- weekly Dependabot updates;
- no production Express server;
- no SMTP or keyless form fallback;
- no remote font or analytics script;
- no production source maps.

## Operational checklist

Before sharing a deployment:

```text
[ ] npm run check passes
[ ] npm run smoke:pages passes
[ ] Preview deployment passes the manual smoke test
[ ] Production and Preview use separate secrets where practical
[ ] Resend sender domain is verified
[ ] Turnstile action and hostname checks work
[ ] BETA_INVITE_CODE is random and not committed
[ ] Cloudflare Access or an equivalent cohort gate is considered
[ ] Operator mailbox has MFA and a defined retention rule
[ ] Rollback owner is identified
```

## Incident response

For suspected abuse or exposure:

1. disable or roll back the affected deployment;
2. rotate invite code, Resend key, and Turnstile secret as relevant;
3. review Cloudflare and Resend logs without copying unnecessary personal data;
4. notify affected participants when appropriate;
5. correct the root cause and add a regression test;
6. document the event and retention/deletion actions.

See the repository-root `SECURITY.md` for private vulnerability reporting guidance.
