# Cloudflare Pages deployment for beginners

This guide takes the repository from GitHub to a private Cloudflare Pages beta. The recommended method is **GitHub integration**, because Cloudflare then deploys the static app and the root `functions/` directory together on every push.

> Do not share the beta URL until the final smoke test passes. Do not paste secrets into source files, GitHub commits, screenshots, or chat messages.

## What you need before starting

Create or have access to:

1. a GitHub account and repository;
2. a Cloudflare account;
3. a Resend account;
4. a domain or verified sender that Resend permits;
5. about 15–30 minutes for initial setup.

The application itself can use Cloudflare Pages' free tier for a 20-person beta. Provider limits can change, so review the current Cloudflare and Resend dashboards before a larger launch.

## Values you will configure

| Name                          |          Secret? | Required in production? | Purpose                                                              |
| ----------------------------- | ---------------: | ----------------------: | -------------------------------------------------------------------- |
| `RESEND_API_KEY`              |              Yes |                     Yes | Sends operator emails from Pages Functions                           |
| `RECEIVER_EMAIL`              | Treat as private |                     Yes | Operator inbox that receives requests and feedback                   |
| `FROM_EMAIL`                  | Treat as private |                     Yes | Verified Resend sender, for example `Tri-Ad Beta <beta@example.com>` |
| `BETA_INVITE_CODE`            |              Yes |                     Yes | Shared private-beta submission code                                  |
| `TURNSTILE_SECRET_KEY`        |              Yes |                     Yes | Server-side bot verification                                         |
| `VITE_TURNSTILE_SITE_KEY`     |               No |   Yes for submission UI | Public Turnstile widget key embedded at build time                   |
| `TURNSTILE_EXPECTED_HOSTNAME` |               No |             Recommended | Rejects tokens issued for another hostname                           |
| `RATE_LIMIT_MAX`              |               No |                Optional | Requests per IP and route per hour; defaults to 5                    |
| `RATE_LIMIT_KV`               |          Binding |                Optional | KV namespace for best-effort application rate limiting               |

`VITE_` values are public by design. Never put a secret in a variable beginning with `VITE_`.

## Step 1 — verify the repository locally

Install Node.js 22, open a terminal in the project folder, and run:

```bash
npm ci
npm run check
npm run smoke:pages
```

All three commands must finish successfully. If `npm ci` fails, do not deploy with `npm install --force`; fix the lockfile or Node version instead.

## Step 2 — create a strong beta invite code

Generate a random code locally:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Copy the result into a password manager. This becomes `BETA_INVITE_CODE`. Send it to invited testers separately from the beta URL when practical.

The invite code is an anti-abuse gate, not individual authentication. For stricter cohort access, also enable Cloudflare Access later in this guide.

## Step 3 — configure Resend

1. Sign in to Resend.
2. Add and verify a sending domain, or use a sender Resend allows for your account.
3. Create an API key dedicated to this project.
4. Decide which operator inbox should receive beta submissions.
5. Prepare these values:

```text
RESEND_API_KEY=re_...
RECEIVER_EMAIL=operator@example.com
FROM_EMAIL=Tri-Ad Beta <beta@your-verified-domain.example>
```

The domain in `FROM_EMAIL` must be accepted by Resend. Do not use a production fallback sender in source code; the Function fails closed when this value is missing.

## Step 4 — push the project to GitHub

From the project folder:

```bash
git init
git add .
git commit -m "Prepare Tri-Ad private beta"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Before pushing, confirm that `.dev.vars`, `.env`, `node_modules/`, `dist/`, and `coverage/` are not staged:

```bash
git status
```

They are already covered by `.gitignore`, but always check.

## Step 5 — create the Cloudflare Pages project

Cloudflare menu wording can change slightly, but the flow is:

1. Open the Cloudflare dashboard.
2. Go to **Workers & Pages**.
3. Choose **Create application** or **Create project**.
4. Choose **Pages** and connect to Git.
5. Authorize GitHub and select this repository.
6. Use these build settings:

```text
Production branch: main
Framework preset: Vite (or None if Vite is unavailable)
Build command: npm run build
Build output directory: dist
Root directory: leave blank
```

7. Set the Node build version to 22. The repository includes `.nvmrc`; adding `NODE_VERSION=22` as a build variable is also acceptable.
8. Start the first deployment.

The first deployment may render the app before Turnstile is configured. Keep the URL private; production submissions intentionally fail until all required Function secrets exist.

## Step 6 — create the Turnstile widget

Once Cloudflare shows the Pages hostname, for example `your-project.pages.dev`:

1. Open **Turnstile** in Cloudflare.
2. Create a widget for Tri-Ad.
3. Choose the managed widget mode unless you have a specific reason otherwise.
4. Add the exact production Pages hostname and any custom domain you will use.
5. Copy the site key and secret key.

You now have:

```text
VITE_TURNSTILE_SITE_KEY=public site key
TURNSTILE_SECRET_KEY=private secret key
TURNSTILE_EXPECTED_HOSTNAME=your-project.pages.dev
```

Use separate expected hostnames for Preview and Production environments when their hostnames differ.

## Step 7 — add Cloudflare variables and secrets

In the Pages project, open **Settings → Variables and Secrets** or the equivalent environment configuration page.

Add these to the **Production** environment:

```text
RESEND_API_KEY                secret
RECEIVER_EMAIL                secret or encrypted value
FROM_EMAIL                    secret or encrypted value
BETA_INVITE_CODE              secret
TURNSTILE_SECRET_KEY          secret
VITE_TURNSTILE_SITE_KEY       plain variable
TURNSTILE_EXPECTED_HOSTNAME   plain variable
RATE_LIMIT_MAX                plain variable, optional; example: 5
NODE_VERSION                  plain build variable; value: 22
```

Add equivalent values to the **Preview** environment. Use a different invite code and, ideally, a separate Resend API key for previews.

Important distinctions:

- `VITE_TURNSTILE_SITE_KEY` is read during the frontend build. Changing it requires a new deployment.
- Server secrets are read by Pages Functions at request time.
- Do not set `EMAIL_DELIVERY_MODE=console` in Cloudflare production. That mode is accepted only on local hostnames, but it should still remain a local-only setting.

Trigger a new deployment after adding the values.

## Step 8 — optional KV rate-limit binding

Turnstile, invite code, form timing, and Cloudflare platform protections are the primary beta controls. The repository also supports a best-effort KV counter.

To enable it:

1. Create a Cloudflare KV namespace such as `triad-beta-rate-limit`.
2. In the Pages project, add a KV binding named exactly:

```text
RATE_LIMIT_KV
```

3. Optionally set `RATE_LIMIT_MAX=5`.
4. Bind a separate namespace for Preview to avoid mixing test and production counters.
5. Redeploy.

KV counters are not a perfectly atomic global rate limiter. For stronger public-launch protection, configure a Cloudflare WAF rate-limiting rule for `/api/beta-feedback` and `/api/premium-order`.

## Step 9 — optional Cloudflare Access for the private cohort

For only 20 testers, Cloudflare Access provides a stronger outer gate than a shared URL.

1. Open Cloudflare Zero Trust / Access.
2. Add a self-hosted application for the beta hostname or custom domain.
3. Create an Allow policy containing only tester email addresses or an approved email domain.
4. Test with an internal account before sharing it.

Keep the in-app invite code and Turnstile even when Access is enabled; they protect submission endpoints if a URL is shared from an authorized session.

## Step 10 — run the production smoke test

Use the deployed production URL.

### A. Static app

- Open the landing page in a private/incognito window.
- Refresh the page.
- Open the demo result.
- Complete a real test assessment.
- Export JSON and generate the PDF.
- Confirm no browser-console errors appear.

### B. Function health

Open:

```text
https://YOUR_HOSTNAME/api/health
```

Expected response resembles:

```json
{
  "ok": true,
  "service": "triad-pages-functions",
  "timestamp": "..."
}
```

### C. Method restrictions

Open these in a normal browser tab:

```text
https://YOUR_HOSTNAME/api/premium-order
https://YOUR_HOSTNAME/api/beta-feedback
```

Both should return HTTP `405` JSON rather than an HTML app page.

### D. Anti-abuse checks

- Submit the expanded-report form with a wrong invite code: expect a generic rejection.
- Submit without completing Turnstile: expect rejection.
- Submit with the correct code and Turnstile: expect success.
- Submit feedback through the beta feedback modal: expect success.

### E. Email delivery

- Confirm exactly one operator email arrives for each successful submission.
- Confirm the report request can reply to the participant email.
- Confirm the feedback email contains no participant name or email field.
- Confirm HTML-like text in feedback displays as text rather than markup.

### F. Headers

From a terminal:

```bash
curl -I https://YOUR_HOSTNAME/
curl -i https://YOUR_HOSTNAME/api/health
```

Confirm the static response includes the CSP and anti-indexing headers, and the Function response includes `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`.

## Step 11 — connect a custom domain

In the Pages project:

1. Open **Custom domains**.
2. Add the beta domain.
3. Follow Cloudflare's DNS instructions.
4. Add the new hostname to the Turnstile widget.
5. Change `TURNSTILE_EXPECTED_HOSTNAME` to the custom hostname.
6. Update the Cloudflare Access application, if used.
7. Redeploy and repeat the smoke test on the custom domain.

Do not share both the `pages.dev` hostname and custom hostname unless both are intentionally supported by Turnstile and Access policies.

## Updating the beta

For the recommended Git workflow:

```bash
npm ci
npm run check
git add .
git commit -m "Describe the change"
git push
```

Cloudflare creates a deployment from the push. Pull requests receive preview deployments when Git integration is enabled.

## Rollback

If a release introduces a serious bug:

1. stop sharing the affected URL;
2. open the Pages project's **Deployments** tab;
3. roll back or promote the last known-good deployment;
4. rotate secrets if exposure is possible;
5. document the incident and add a regression test before redeploying.

## Wrangler deployment alternative

Git integration is simpler for most teams. For an authorized manual deployment:

```bash
npx wrangler login
npm run check
npm run deploy:preview
# or, after verification
npm run deploy:production
```

Configure project secrets and bindings in Cloudflare before using these commands. Run from the repository root so Wrangler can find `functions/` and `wrangler.jsonc`.

## Common problems

### `/api/...` returns the React page or 404

The deployment did not include the root `functions/` directory, or `_routes.json` is missing. Use Git integration or Wrangler from the repository root. Do not upload only `dist/` through a basic static drag-and-drop flow.

### Submission returns 503

One or more production secrets are missing. Check `RESEND_API_KEY`, `RECEIVER_EMAIL`, `FROM_EMAIL`, `BETA_INVITE_CODE`, and `TURNSTILE_SECRET_KEY` in the correct Preview/Production environment.

### Submission returns 403

Common causes are a wrong invite code, missing/expired Turnstile token, unexpected hostname, or cross-origin request. Verify the Turnstile widget hostnames and `TURNSTILE_EXPECTED_HOSTNAME`.

### Turnstile does not appear

`VITE_TURNSTILE_SITE_KEY` was not available during the build. Add it as a build variable and redeploy. Merely adding it after a completed build does not change the existing JavaScript bundle.

### Submission returns 502

The Function reached the email stage but Resend rejected the request or was unavailable. Check Resend logs, API-key permissions, verified sending domain, and `FROM_EMAIL`.

### `npm ci` fails in Cloudflare

Confirm Cloudflare uses Node 22 and that `package-lock.json` is committed. Never replace `npm ci` with a permissive install to hide an inconsistent lockfile.
