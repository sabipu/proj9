import fs from "node:fs";
import path from "node:path";

let overrideProjDataDir: string | undefined;

export function setProjDataDir(p: string): void {
  overrideProjDataDir = p;
}

function resolveBundledProjDbPath(): string {
  // With `tsup` shims enabled, `__dirname` is available in both ESM and CJS outputs.
  // dist/* -> ../data/proj.db
  const candidate1 = path.resolve(__dirname, "..", "data", "proj.db");
  if (fs.existsSync(path.resolve(__dirname, "..", "data"))) return candidate1;
  return path.resolve(__dirname, "..", "..", "data", "proj.db");
}

function resolveProjDbPath(): string {
  if (overrideProjDataDir) return path.resolve(overrideProjDataDir, "proj.db");

  const envDir = process.env.PROJ_DATA ?? process.env.PROJ_LIB;
  if (envDir) return path.resolve(envDir, "proj.db");

  return resolveBundledProjDbPath();
}

function resolveDataPath(filename: string): string {
  if (overrideProjDataDir) return path.resolve(overrideProjDataDir, filename);

  const envDir = process.env.PROJ_DATA ?? process.env.PROJ_LIB;
  if (envDir) return path.resolve(envDir, filename);

  // Default to bundled folder.
  // In the published package, files live in `dist/` and data lives in `data/` (sibling):
  //   dist/index.js  -> __dirname=dist -> ../data/<file>
  // In dev/tests, we often run from `src/`, so `__dirname` may be `src/resources`:
  //   src/resources  -> ../../data/<file>
  const candidate1 = path.resolve(__dirname, "..", "data", filename);
  if (fs.existsSync(path.resolve(__dirname, "..", "data"))) return candidate1;

  const candidate2 = path.resolve(__dirname, "..", "..", "data", filename);
  return candidate2;
}

export function getBundledProjDbPath(): string {
  return resolveBundledProjDbPath();
}

export function getBundledProjDbBuffer(): Buffer {
  return fs.readFileSync(getBundledProjDbPath());
}

export function getResolvedProjDbPath(): string {
  return resolveProjDbPath();
}

export function getResolvedDataPath(filename: string): string {
  return resolveDataPath(filename);
}
