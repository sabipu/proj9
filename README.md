## proj9-js

Experimental JavaScript/TypeScript port inspired by PROJ 9 semantics.

### Status

- **v0.1.1**:
  - EPSG:4326 ↔ EPSG:3857 transforms using a pipeline/step architecture
  - `transformMany()` + EPSG aliases + 3D coord support
  - EGM96 vertical conversion (ellipsoidal ↔ orthometric) with **bundled** `data/egm96_15.gtx`
  - Bundles `data/proj.db` and exposes stable APIs to locate it (DB not used yet)

### Install

```bash
npm i proj9-js
```

### Usage

```ts
import { createTransformer, getBundledProjDbPath, transform, transformMany } from "proj9-js";
import { setProjDataDir } from "proj9-js";

const xy = transform("EPSG:4326", "EPSG:3857", [180, 0]);
const ll = transform("EPSG:3857", "EPSG:4326", xy);

const t = createTransformer("EPSG:4326", "EPSG:3857");
const xy2 = t.forward([12, 34]);

// Batch transform (build once, apply many)
const batch = transformMany("EPSG:4326", "EPSG:3857", [
  [0, 0],
  [1, 2],
  [180, 0],
]);

// EPSG aliases are accepted:
// - "4326" / "3857"
// - "epsg:4326"
// - "EPSG::4326"
// - "urn:ogc:def:crs:EPSG::4326"
// - "CRS:84"
// - "EPSG:4979"
const xyAlias = transform("4326", "3857", [180, 0]);

// 3D coords are accepted.
// For most ops today, z is passed through unchanged.
const xyz = transform("CRS:84", "EPSG:3857", [12.34, 56.78, 9]);
// => [x, y, 9]

console.log(getBundledProjDbPath());
```

### Vertical heights (EGM96)

This package can convert **ellipsoidal height** ↔ **EGM96 orthometric height** using a geoid grid:

- **Ellipsoidal height**: `EPSG:4979`
- **EGM96 height**: `EPSG:4326+EGM96` (shorthand: `"EGM96"`)

`proj9-js` ships with the EGM96 grid **bundled by default** (`data/egm96_15.gtx`).
You can override it via `setProjDataDir()` (or `PROJ_DATA` / `PROJ_LIB`) if you want to use a different PROJ data directory.

```ts
import { setProjDataDir, transform } from "proj9-js";

setProjDataDir("/path/to/proj-data"); // optional override; otherwise bundled data is used

// h -> H (H = h - N)
const H = transform("EPSG:4979", "EPSG:4326+EGM96", [12.34, 56.78, 100]);

// H -> h (h = H + N)
const h = transform("EGM96", "EPSG:4979", H);
```

### Data attribution

- EGM96 grid is derived from the official PROJ-data dataset (cdn.proj.org): `us_nga_egm96_15.tif`.

### Notes on `proj.db`

This package ships a `data/proj.db` asset and provides:

- `getBundledProjDbPath(): string`
- `getBundledProjDbBuffer(): Buffer`
- `setProjDataDir(path: string): void`

The DB is not read yet (planned for v0.2.0). You can refresh `data/proj.db` later via `npm run download:projdb` once you pick a specific PROJ release source.

### Releases / versioning

This repo is intended to follow standard npm package release automation:

- Releases are created from `main` via GitHub Actions + `semantic-release`.
- Version bumps and `CHANGELOG.md` entries are generated from Conventional Commits.
