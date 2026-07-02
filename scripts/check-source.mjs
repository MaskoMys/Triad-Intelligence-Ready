import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const roots = ["src", "functions", "public", "scripts"];
const files = [
  "index.html",
  "metadata.json",
  "package.json",
  "package-lock.json",
  "wrangler.jsonc",
];
const allowedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".html",
  "",
]);

function collect(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) collect(full);
    else if (allowedExtensions.has(extname(full))) files.push(full);
  }
}

for (const root of roots) collect(root);

const forbiddenContent = [
  /google ai studio/i,
  /\baistudio\b/i,
  /MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API/i,
  /@google\/genai/i,
  /\bformsubmit\b/i,
  /\bnodemailer\b/i,
  /\bserver\.cjs\b/i,
  /high-fidelity psychometric/i,
  /scientifically proven/i,
  /onboarding@resend\.dev/i,
];
const invalidTailwindScale =
  /(?:text|bg|border|ring|from|to|via|outline|divide|placeholder|accent|caret|decoration)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:55|650|705|750|805|850|905)\b/g;
const failures = [];

for (const file of [...new Set(files)]) {
  if (file === "scripts/check-source.mjs") continue;
  const contents = readFileSync(file, "utf8");
  for (const pattern of forbiddenContent) {
    if (pattern.test(contents)) {
      failures.push(`${relative(process.cwd(), file)} matches ${pattern}`);
    }
  }
  for (const match of contents.matchAll(invalidTailwindScale)) {
    failures.push(
      `${relative(process.cwd(), file)} contains invalid Tailwind class ${match[0]}`,
    );
  }
}

const requiredFiles = [
  "package-lock.json",
  "public/_headers",
  "public/_redirects",
  "public/_routes.json",
  "public/robots.txt",
  "functions/api/health.ts",
  "functions/api/beta-feedback.ts",
  "functions/api/premium-order.ts",
  "docs/CLOUDFLARE_DEPLOYMENT.md",
  "docs/SECURITY.md",
  "docs/SCORING_ANALYSIS.md",
];
for (const required of requiredFiles) {
  if (!existsSync(required))
    failures.push(`Missing required file: ${required}`);
}

for (const forbiddenPath of [
  ".aistudio",
  "assets/.aistudio",
  "server.ts",
  "dist/server.cjs",
  "dist/server.cjs.map",
]) {
  if (existsSync(forbiddenPath))
    failures.push(`Forbidden path exists: ${forbiddenPath}`);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const allDependencies = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
};
for (const dependency of ["@google/genai", "express", "nodemailer"]) {
  if (dependency in allDependencies) {
    failures.push(`Forbidden dependency remains: ${dependency}`);
  }
}
if (packageJson.scripts?.build !== "vite build") {
  failures.push('package.json build script must be exactly "vite build".');
}
if (packageJson.version !== packageLock.version) {
  failures.push("package.json and package-lock.json versions differ.");
}

const redirects = readFileSync("public/_redirects", "utf8");
if (/\/\*\s+\/index\.html\s+200/.test(redirects)) {
  failures.push(
    "public/_redirects contains a Pages SPA rewrite that can cause an infinite loop.",
  );
}

const routes = JSON.parse(readFileSync("public/_routes.json", "utf8"));
if (!Array.isArray(routes.include) || !routes.include.includes("/api/*")) {
  failures.push(
    'public/_routes.json must include exactly the API namespace "/api/*".',
  );
}

if (failures.length > 0) {
  console.error(
    `Source policy checks failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
  );
  process.exit(1);
}

console.log(`Source policy checks passed across ${new Set(files).size} files.`);
