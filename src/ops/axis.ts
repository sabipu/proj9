import type { AxisName, Coord2 } from "../core/types";

// For v0.1.0 our built-ins are already in the expected order:
// - EPSG:4326: [lon, lat]
// - EPSG:3857: [x, y]
// This step exists to keep the pipeline architecture PROJ-ish and make future axis enforcement easy.
export function axisNormalizeStep(_axis: readonly [AxisName, AxisName]): (c: Coord2) => Coord2 {
  return (c) => c;
}
