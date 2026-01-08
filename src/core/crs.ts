import type { AxisName, CrsKind, Unit } from "./types";

export type VerticalKind = "none" | "ellipsoidal" | "egm96";

export interface CRS {
  id: string; // e.g. "EPSG:4326"
  kind: CrsKind;
  unit: Unit;
  axis: readonly [AxisName, AxisName];
  vertical?: VerticalKind;
}
