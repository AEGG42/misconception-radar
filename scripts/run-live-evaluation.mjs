import { spawnSync } from "node:child_process";
import path from "node:path";
import nextEnv from "@next/env";

const root = process.cwd();
const { loadEnvConfig } = nextEnv;

loadEnvConfig(root);

function stop(message) {
  console.error(`Live evaluation blocked: ${message}`);
  process.exit(1);
}

const requestedProvider =
  process.env.LIVE_EVAL_PROVIDER || process.env.AI_PROVIDER;
const provider =
  !requestedProvider || requestedProvider === "deterministic"
    ? "deepseek"
    : requestedProvider;
if (!["deepseek", "openai"].includes(provider)) {
  stop(
    "use LIVE_EVAL_PROVIDER=deepseek or LIVE_EVAL_PROVIDER=openai.",
  );
}

const keyName =
  provider === "deepseek" ? "DEEPSEEK_API_KEY" : "OPENAI_API_KEY";
if (!process.env[keyName] || process.env[keyName].length < 20) {
  stop(
    `no usable ${keyName} was found in the environment or .env.local.`,
  );
}

const vitestCli = path.join(
  root,
  "node_modules",
  "vitest",
  "vitest.mjs",
);
const result = spawnSync(
  process.execPath,
  [vitestCli, "run", "--config", "vitest.live.config.ts"],
  {
    cwd: root,
    env: {
      ...process.env,
      AI_PROVIDER: provider,
      ENABLE_LIVE_AI: "true",
    },
    stdio: "inherit",
    windowsHide: true,
  },
);

process.exit(result.status ?? 1);
