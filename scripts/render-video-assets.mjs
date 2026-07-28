import path from "node:path";
import process from "node:process";
import { mkdir } from "node:fs/promises";

import sharp from "sharp";

const projectRoot = path.resolve(import.meta.dirname, "..");
const outputDir = path.resolve(
  process.argv[2] || path.join(projectRoot, "artifacts", "video"),
);

await mkdir(outputDir, { recursive: true });

const assets = [
  {
    source: path.join(
      projectRoot,
      "public",
      "video-architecture-overlay.svg",
    ),
    output: path.join(outputDir, "architecture.png"),
  },
  {
    source: path.join(
      projectRoot,
      "public",
      "video-end-card-template.svg",
    ),
    output: path.join(outputDir, "end-card.png"),
  },
];

await Promise.all(
  assets.map(({ source, output }) =>
    sharp(source, { density: 144 })
      .resize(1920, 1080, {
        fit: "fill",
      })
      .png()
      .toFile(output),
  ),
);

console.info(`Rendered ${assets.length} video overlays to ${outputDir}.`);
