import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { questions, scoreAssessment } from "../src/domain/assessment/index.js";

const HOST = "127.0.0.1";
const PORT = 8799;
const BASE_URL = `http://${HOST}:${PORT}`;
const INVITE_CODE = "local-beta-smoke-code";
const STARTUP_TIMEOUT_MS = 30_000;

function wranglerProcess(): ChildProcessWithoutNullStreams {
  const wranglerCli = path.resolve(
    "node_modules/wrangler/wrangler-dist/cli.js",
  );
  const child = spawn(
    process.execPath,
    [
      "--no-warnings",
      "--experimental-vm-modules",
      wranglerCli,
      "pages",
      "dev",
      "dist",
      "--ip",
      HOST,
      "--port",
      String(PORT),
      "--binding",
      `BETA_INVITE_CODE=${INVITE_CODE}`,
      "--binding",
      "EMAIL_DELIVERY_MODE=console",
      "--log-level",
      "error",
      "--show-interactive-dev-session=false",
    ],
    {
      cwd: process.cwd(),
      detached: process.platform !== "win32",
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  child.stdin.end();
  return child;
}

async function waitForServer(
  processHandle: ChildProcessWithoutNullStreams,
): Promise<void> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  let stderr = "";
  processHandle.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      throw new Error(`Wrangler exited before startup.\n${stderr}`);
    }

    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(
    `Wrangler did not start within ${STARTUP_TIMEOUT_MS / 1000}s.\n${stderr}`,
  );
}

async function expectStatus(
  label: string,
  input: string,
  expectedStatus: number,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status !== expectedStatus) {
    const body = await response.text();
    throw new Error(
      `${label}: expected HTTP ${expectedStatus}, received ${response.status}. Body: ${body}`,
    );
  }
  console.log(`✓ ${label} (${expectedStatus})`);
  return response;
}

function basePayload() {
  const responses = Object.fromEntries(
    questions.map((question) => [question.id, 0]),
  );
  const result = scoreAssessment(responses);
  return {
    profileCode: result.profileCode,
    normalizedScores: result.normalizedScores,
    inviteCode: INVITE_CODE,
    formStartedAt: Date.now() - 5_000,
    website: "",
  };
}

async function runSmokeChecks(): Promise<void> {
  const root = await expectStatus("static app", BASE_URL, 200);
  const html = await root.text();
  if (!html.includes("Tri-Ad Cognitive Archetype Mapper")) {
    throw new Error("Static app response did not contain the expected title.");
  }

  await expectStatus("health function", `${BASE_URL}/api/health`, 200);
  await expectStatus(
    "premium GET is blocked",
    `${BASE_URL}/api/premium-order`,
    405,
  );
  await expectStatus(
    "feedback GET is blocked",
    `${BASE_URL}/api/beta-feedback`,
    405,
  );

  await expectStatus(
    "incorrect invite code is rejected",
    `${BASE_URL}/api/premium-order`,
    403,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({
        ...basePayload(),
        inviteCode: "wrong-code",
        name: "Smoke Tester",
        email: "smoke@example.com",
      }),
    },
  );

  await expectStatus(
    "premium submission function",
    `${BASE_URL}/api/premium-order`,
    200,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({
        ...basePayload(),
        name: "Smoke Tester",
        email: "smoke@example.com",
      }),
    },
  );

  await expectStatus(
    "beta feedback function",
    `${BASE_URL}/api/beta-feedback`,
    200,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({
        ...basePayload(),
        feedback: {
          accuracyRating: 4,
          pmfResponse: "very-disappointed",
          wouldShare: true,
        },
      }),
    },
  );
}

async function stopProcess(
  processHandle: ChildProcessWithoutNullStreams,
): Promise<void> {
  if (processHandle.exitCode !== null) return;
  const pid = processHandle.pid;
  if (!pid) return;

  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/pid", String(pid), "/T", "/F"]);
    await new Promise<void>((resolve) => killer.once("exit", () => resolve()));
    return;
  }

  const signalGroup = (signal: NodeJS.Signals) => {
    try {
      process.kill(-pid, signal);
    } catch {
      // The process group has already exited.
    }
  };

  signalGroup("SIGTERM");
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      signalGroup("SIGKILL");
      resolve();
    }, 3_000);
    processHandle.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

const processHandle = wranglerProcess();
try {
  await waitForServer(processHandle);
  await runSmokeChecks();
  console.log("Cloudflare Pages smoke test passed.");
} finally {
  await stopProcess(processHandle);
}
