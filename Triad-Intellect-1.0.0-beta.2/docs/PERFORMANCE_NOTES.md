# Performance notes

## Current production build

The June 18, 2026 verified Vite build produced approximately:

| Asset group                 | Uncompressed |   Gzip |
| --------------------------- | -----------: | -----: |
| Application CSS             |        34 kB |   7 kB |
| Main application JavaScript |       162 kB |  46 kB |
| React vendor chunk          |       182 kB |  57 kB |
| Icon vendor chunk           |        12 kB |   5 kB |
| jsPDF lazy chunk            |       399 kB | 130 kB |
| html2canvas lazy chunk      |       200 kB |  47 kB |

Exact hashed filenames change on each build.

## Implemented controls

- PDF dependencies are dynamically imported and are not required for the initial assessment route.
- Production source maps are disabled.
- Vite emits hashed assets; `public/_headers` gives `/assets/*` a one-year immutable cache policy.
- `index.html` is not cached so releases become visible promptly.
- System fonts avoid a blocking external font request.
- Reduced-motion preferences disable nonessential transition duration.
- Cloudflare Functions are limited to `/api/*`; static requests do not invoke edge code.

## Next measurement step

Run Lighthouse and real-user performance monitoring on the deployed preview URL rather than inferring runtime speed from bundle size alone. Test at minimum:

- mid-range Android over a throttled mobile connection;
- recent iPhone Safari;
- Chromium and Firefox desktop;
- PDF generation on a lower-memory phone.

Track Largest Contentful Paint, Interaction to Next Paint, Cumulative Layout Shift, JavaScript errors, assessment completion time, and PDF failure rate. Do not add a performance-monitoring SDK without updating privacy disclosures.
