import type { CRS } from "./crs";
import type { Coord2 } from "./types";
import { UnsupportedVerticalOperationError } from "./errors";
import { getEgm96Grid } from "../grids/egm96";

export interface VerticalOperation {
  id: string;
  forwardZ(lonLat: Coord2, z: number): number;
  inverseZ(lonLat: Coord2, z: number): number;
}

export function selectVerticalOperation(from: CRS, to: CRS): VerticalOperation | null {
  const fromV = from.vertical ?? "none";
  const toV = to.vertical ?? "none";

  // Only trigger a vertical transform when EGM96 is explicitly requested.
  if (fromV === toV) return null;
  if (fromV !== "egm96" && toV !== "egm96") return null;

  // Currently supported: EPSG:4979 <-> EPSG:4326+EGM96
  const ok =
    (from.id === "EPSG:4979" && to.id === "EPSG:4326+EGM96") ||
    (from.id === "EPSG:4326+EGM96" && to.id === "EPSG:4979");
  if (!ok) throw new UnsupportedVerticalOperationError(from.id, to.id);

  const grid = getEgm96Grid();

  if (from.id === "EPSG:4979" && to.id === "EPSG:4326+EGM96") {
    return {
      id: "EGM96",
      forwardZ: (lonLat, z) => z - grid.sample(lonLat[0], lonLat[1]),
      inverseZ: (lonLat, z) => z + grid.sample(lonLat[0], lonLat[1]),
    };
  }

  return {
    id: "EGM96",
    forwardZ: (lonLat, z) => z + grid.sample(lonLat[0], lonLat[1]),
    inverseZ: (lonLat, z) => z - grid.sample(lonLat[0], lonLat[1]),
  };
}
