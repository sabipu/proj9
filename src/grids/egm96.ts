import fs from "node:fs";
import { MissingGridError } from "../core/errors";
import { getResolvedDataPath } from "../resources/resourceManager";
import { loadGtxGridSync, type GtxGrid } from "./gtx";

const EGM96_GRID_FILENAME = "egm96_15.gtx";

let cached: GtxGrid | undefined;

export function getEgm96Grid(): GtxGrid {
  if (cached) return cached;

  const p = getResolvedDataPath(EGM96_GRID_FILENAME);
  if (!fs.existsSync(p)) {
    throw new MissingGridError(EGM96_GRID_FILENAME, p);
  }

  cached = loadGtxGridSync(p);
  return cached;
}

export function clearEgm96GridCache(): void {
  cached = undefined;
}
