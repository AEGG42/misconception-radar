import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import path from "node:path";

const root = process.cwd();
const openNext = path.resolve(root, ".open-next");
const bundledWorker = path.resolve(
  root,
  ".sites",
  "wrangler-bundle",
  "worker.js",
);
const hosting = path.resolve(root, ".openai", "hosting.json");
const dist = path.resolve(root, "dist");

if (
  path.dirname(dist) !== root ||
  !existsSync(path.join(openNext, "worker.js")) ||
  !existsSync(path.join(openNext, "assets", "BUILD_ID")) ||
  !existsSync(bundledWorker) ||
  !existsSync(hosting)
) {
  throw new Error("Missing or unsafe Sites build inputs.");
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(path.join(dist, "client"), { recursive: true });
mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });

cpSync(path.join(openNext, "assets"), path.join(dist, "client"), {
  recursive: true,
});
copyFileSync(bundledWorker, path.join(dist, "server", "index.js"));
copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));

console.log(
  "Prepared Sites build: dist/client, dist/server/index.js, and hosting metadata.",
);
