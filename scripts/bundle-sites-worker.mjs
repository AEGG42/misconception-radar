import { mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const stateDirectory = path.join(root, ".sites", "xdg");
const outputDirectory = path.join(root, ".sites", "wrangler-bundle");
const wranglerCli = path.join(
  root,
  "node_modules",
  "wrangler",
  "bin",
  "wrangler.js",
);

mkdirSync(stateDirectory, { recursive: true });
rmSync(outputDirectory, { recursive: true, force: true });

const result = spawnSync(
  process.execPath,
  [
    wranglerCli,
    "deploy",
    "--dry-run",
    "--outdir",
    outputDirectory,
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      XDG_CONFIG_HOME: stateDirectory,
      WRANGLER_SEND_METRICS: "false",
    },
    stdio: "inherit",
    windowsHide: true,
  },
);

if (result.status !== 0) {
  throw new Error(`Wrangler could not bundle the Sites Worker (${result.status}).`);
}
