// This script is intentionally minimal for v0.1.0.
// It exists to keep a clean long-term story for refreshing `data/proj.db`.
//
// Once you decide which PROJ/proj-data release to pin, set PROJ_DB_URL to a trusted artifact URL.
// Example usage:
//   PROJ_DB_URL="https://example.com/proj.db" npm run download:projdb
//
import fs from "node:fs";
import path from "node:path";

const url = process.env.PROJ_DB_URL;
if (!url) {
  console.error(
    "Missing PROJ_DB_URL. Set it to a direct proj.db artifact URL (e.g. from a pinned PROJ release)."
  );
  process.exit(2);
}

const outPath = path.resolve("data", "proj.db");
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const res = await fetch(url);
if (!res.ok) {
  throw new Error(`Failed to download proj.db: ${res.status} ${res.statusText}`);
}

const buf = Buffer.from(await res.arrayBuffer());
fs.writeFileSync(outPath, buf);
console.log(`Wrote ${buf.byteLength} bytes to ${outPath}`);
