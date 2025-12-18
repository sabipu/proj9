import fs from "node:fs";
import path from "node:path";

let overrideProjDataDir: string | undefined;

export function setProjDataDir(p: string): void {
  overrideProjDataDir = p;
}

function resolveBundledProjDbPath(): string {
  // With `tsup` shims enabled, `__dirname` is available in both ESM and CJS outputs.
  // dist/* -> ../data/proj.db
  return path.resolve(__dirname, "..", "data", "proj.db");
}

function resolveProjDbPath(): string {
  if (overrideProjDataDir) return path.resolve(overrideProjDataDir, "proj.db");

  const envDir = process.env.PROJ_DATA ?? process.env.PROJ_LIB;
  if (envDir) return path.resolve(envDir, "proj.db");

  return resolveBundledProjDbPath();
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
