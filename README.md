## proj9-js

Experimental JavaScript/TypeScript port inspired by PROJ 9 semantics.

### Status

- **v0.1.0**: supports only EPSG:4326 ↔ EPSG:3857 transforms using a pipeline/step architecture.
- Bundles `data/proj.db` and exposes stable APIs to locate it (DB not used yet).

### Install

```bash
npm i proj9
```

### Usage

```ts
import { transform, createTransformer, getBundledProjDbPath } from "proj9";

const xy = transform("EPSG:4326", "EPSG:3857", [180, 0]);
const ll = transform("EPSG:3857", "EPSG:4326", xy);

const t = createTransformer("EPSG:4326", "EPSG:3857");
const xy2 = t.forward([12, 34]);

console.log(getBundledProjDbPath());
```

### Notes on `proj.db`

This package ships a `data/proj.db` asset and provides:

- `getBundledProjDbPath(): string`
- `getBundledProjDbBuffer(): Buffer`
- `setProjDataDir(path: string): void`

The DB is not read yet (planned for v0.2.0). You can refresh `data/proj.db` later via `npm run download:projdb` once you pick a specific PROJ release source.
