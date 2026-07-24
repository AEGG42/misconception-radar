import { mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const outputDirectory = path.join(root, ".sites");
const archivePath = path.join(outputDirectory, "misconception-radar.tar.gz");

mkdirSync(outputDirectory, { recursive: true });
rmSync(archivePath, { force: true });

const result = spawnSync(
  "tar",
  [
    "-czf",
    archivePath,
    "-C",
    "dist",
    ".",
  ],
  {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  },
);

if (result.status !== 0) {
  throw new Error(`Could not create the Sites archive (${result.status}).`);
}

console.log(archivePath);
