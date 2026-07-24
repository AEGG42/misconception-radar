import { spawn, spawnSync } from "node:child_process";

const baseUrl = "http://127.0.0.1:3000";
const nextCli = "node_modules/next/dist/bin/next";
const playwrightCli = "node_modules/@playwright/test/cli.js";

async function isReady() {
  try {
    const response = await fetch(baseUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(server) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (await isReady()) {
      return;
    }
    if (server.exitCode !== null) {
      throw new Error(`Next.js exited before becoming ready (${server.exitCode}).`);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for the Next.js test server.");
}

function runPlaywright() {
  return new Promise((resolve, reject) => {
    const runner = spawn(process.execPath, [playwrightCli, "test"], {
      cwd: process.cwd(),
      env: { ...process.env, E2E_SERVER_READY: "1" },
      stdio: "inherit",
      windowsHide: true,
    });
    runner.once("error", reject);
    runner.once("exit", (code) => resolve(code ?? 1));
  });
}

function stopProcessTree(server) {
  if (!server) {
    return;
  }

  if (process.platform !== "win32") {
    server.kill("SIGTERM");
    return;
  }

  spawnSync("taskkill.exe", ["/PID", String(server.pid), "/T", "/F"], {
    stdio: "ignore",
    windowsHide: true,
  });
}

let server;
let testExitCode = 1;

try {
  if (!(await isReady())) {
    server = spawn(process.execPath, [nextCli, "dev"], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
      windowsHide: true,
    });
    await waitForServer(server);
  }

  testExitCode = await runPlaywright();
} finally {
  stopProcessTree(server);
}

process.exit(testExitCode);
