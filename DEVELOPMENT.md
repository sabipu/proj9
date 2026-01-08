## Development roadmap

This file tracks what’s implemented and what’s planned, **by version**, so we can tick items off as we grow toward “PROJ 9 semantics” in JS.

### Current status (main branch)

- **Project**: `proj9-js` (TypeScript), builds ESM+CJS with types, uses a pipeline/step architecture.
- **Release protocol**: GitHub Actions + `semantic-release` (Conventional Commits). Releases cut from `main`.
- **Data packaging**:
  - Bundles `data/proj.db` (currently placeholder; DB access not implemented yet).
  - Bundles `data/egm96_15.gtx` (generated from PROJ-data GeoTIFF via script).

---

### v0.1.0 — core transforms + pipeline foundation

- [x] **Pipeline architecture** (not one-off math)
  - `OperationPipeline` and step functions
  - Axis step stub (for future axis enforcement)
  - Unit conversion steps (deg↔rad)
- [x] **Hardcoded CRS registry**
  - `EPSG:4326`, `EPSG:3857`
  - Additional IDs supported as built-ins: `CRS:84`, `EPSG:4979`, and `EPSG:4326+EGM96`
- [x] **Basic ops**
  - Web Mercator forward/inverse (EPSG:3857)
- [x] **Public API**
  - `transform(from, to, coord)` (2D + 3D; z passthrough unless EGM96 explicitly requested)
  - `createTransformer(from, to)` returns `{ forward, inverse }`
  - `transformMany(from, to, coords)`
- [x] **CRS id normalization / aliases**
  - `"4326"`, `"epsg:4326"`, `"EPSG::4326"`, `"urn:ogc:def:crs:EPSG::4326"`, `"CRS:84"`, `"EGM96"`
- [x] **Useful errors**
  - `UnknownCrsError`, `UnsupportedOperationError`
  - `MissingGridError`, `UnsupportedVerticalOperationError`
- [x] **EGM96 vertical transformation (grid-based)**
  - `EPSG:4979` (ellipsoidal height) ⇄ `EPSG:4326+EGM96` (orthometric) using `egm96_15.gtx`
  - Bilinear sampling from GTX grid
- [x] **Resource resolution**
  - `setProjDataDir()` override
  - `PROJ_DATA` / `PROJ_LIB` support
  - `getBundledProjDbPath()`, `getBundledProjDbBuffer()`
- [x] **Tooling**
  - `tsup` build (ESM+CJS+dts), `vitest` tests
  - ESLint + Prettier
- [x] **CI release**
  - GitHub Actions workflow for release on push to `main`
  - npm Trusted Publisher / OIDC publish flow (no `NPM_TOKEN`)

---

### v0.1.1 — packaging hardening + correctness checks (next)

- [x] **Verify bundled EGM96 grid correctness (sanity + header + integration)**
  - GTX header checks (lon/lat extents, resolution, dimensions)
  - Sampling sanity checks (finite, plausible range, non-constant)
  - Integration test: `EPSG:4979 -> EGM96` changes z
- [x] **Verify bundled EGM96 grid correctness vs PROJ-data reference points**
  - Generate a small reference table from the official PROJ-data GeoTIFF (`us_nga_egm96_15.tif`) and assert GTX sampling matches.
- [ ] **Make grid selection more PROJ-like**
  - Explicit vertical “operation selection” layer (even if it only returns EGM96 for now).
- [x] **Make grid selection more PROJ-like**
  - Vertical operation selection function (currently selects EGM96 only).
- [x] **Publish-size strategy**
  - Decision: **keep data bundled in the package** for now (EGM96 GTX + proj.db).

---

### v0.2.0 — DB access layer (start of PROJ registry semantics)

- [ ] **Read `proj.db`**
  - Minimal SQLite access layer (Node)
  - `crsFromEpsg("EPSG:xxxx")` returns a CRS record (start small)
- [ ] **Registry upgrades**
  - Registry can resolve CRS by ID via DB (fallback to built-ins)
- [ ] **Compatibility tests**
  - Basic CRS lookup tests + smoke transforms for known CRS ids

---

### v0.3.0 — operation selection skeleton (PROJ-ish)

- [ ] `OperationFactory` / `createTransformer(from,to)` builds operation once
- [ ] Framework for multiple candidate operations (even if only one is returned initially)
- [ ] Keep pipeline steps as the internal “operation representation”

---

### v0.4.0+ — gradual expansion toward PROJ 9 semantics

- [ ] **More projections**
  - tmerc / UTM (forward+inverse), etc.
- [ ] **Axis order enforcement**
  - PROJ-like `always_xy` vs strict axis ordering behavior
- [ ] **Datum transformations**
  - Helmert steps (3/7 param)
  - Grid shift steps (NTv2 / GeoTIFF) as optional data packs
- [ ] **Real operation selection**
  - area-of-use and accuracy ranking from DB
  - grid availability checks + helpful diagnostics

---

### Notes / principles (non-negotiables)

- **Pipeline first**: all transforms must be built from steps.
- **Data is part of PROJ**: where transformations require grids/registry metadata, we treat that as first-class package/runtime data.
- **No silent wrong answers**: if a requested vertical/horizontal datum transformation cannot be supported, throw a clear error.
