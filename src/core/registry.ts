import type { CRS } from "./crs";
import { UnknownCrsError } from "./errors";

const builtins = new Map<string, CRS>([
  [
    "EPSG:4326",
    {
      id: "EPSG:4326",
      kind: "geographic",
      unit: "degree",
      axis: ["lon", "lat"],
      vertical: "none",
    },
  ],
  [
    // WGS 84 (3D geographic). For now treated as compatible with EPSG:4326 for op selection.
    "EPSG:4979",
    {
      id: "EPSG:4979",
      kind: "geographic",
      unit: "degree",
      axis: ["lon", "lat"],
      vertical: "ellipsoidal",
    },
  ],
  [
    // OGC CRS:84 (WGS84 lon/lat). We keep it explicit so users can pass "CRS:84".
    "CRS:84",
    {
      id: "CRS:84",
      kind: "geographic",
      unit: "degree",
      axis: ["lon", "lat"],
      vertical: "none",
    },
  ],
  [
    // WGS84 lon/lat with EGM96 orthometric heights (requires EGM96 geoid grid).
    "EPSG:4326+EGM96",
    {
      id: "EPSG:4326+EGM96",
      kind: "geographic",
      unit: "degree",
      axis: ["lon", "lat"],
      vertical: "egm96",
    },
  ],
  [
    "EPSG:3857",
    {
      id: "EPSG:3857",
      kind: "projected",
      unit: "metre",
      axis: ["x", "y"],
      vertical: "none",
    },
  ],
]);

export class Registry {
  private readonly byId = new Map<string, CRS>(builtins);

  get(id: string): CRS {
    const crs = this.byId.get(id);
    if (!crs) throw new UnknownCrsError(id);
    return crs;
  }

  set(crs: CRS): void {
    this.byId.set(crs.id, crs);
  }
}

export const defaultRegistry = new Registry();
