import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  ".open-next/worker.js",
  ".open-next/assets/BUILD_ID",
  ".openai/hosting.json",
  "dist/client/BUILD_ID",
  "dist/server/index.js",
  "dist/.openai/hosting.json",
];

for (const relativePath of requiredFiles) {
  const filePath = path.join(root, relativePath);
  await access(filePath);
  const details = await stat(filePath);
  if (!details.isFile() || details.size === 0) {
    throw new Error(`Invalid Sites build artifact: ${relativePath}`);
  }
}

const hosting = JSON.parse(
  await readFile(path.join(root, "dist", ".openai", "hosting.json"), "utf8"),
);
if (
  hosting.project_id !== "appgprj_6a636916756c819183908fc9aa0c262c"
) {
  throw new Error("Sites project ID does not match the configured project.");
}

const worker = await readFile(
  path.join(root, "dist", "server", "index.js"),
  "utf8",
);
if (
  worker.includes('from "./') ||
  worker.includes("import(\"./") ||
  worker.length < 1_000_000
) {
  throw new Error("Sites Worker must be a self-contained Wrangler bundle.");
}

console.log("Sites build verified: OpenNext worker, assets, and hosting metadata.");
