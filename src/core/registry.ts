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
    },
  ],
  [
    "EPSG:3857",
    {
      id: "EPSG:3857",
      kind: "projected",
      unit: "metre",
      axis: ["x", "y"],
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
