import type { Coord2 } from "../core/types";

// EPSG:3857 (Web Mercator / Pseudo-Mercator), spherical with WGS84 semi-major radius.
const R = 6378137;

// PROJ uses ~85.0511287798066 deg clamp; in radians:
const MAX_LAT_RAD = 1.4844222297453322;

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function webMercatorForwardRadStep(): (c: Coord2) => Coord2 {
  // input: [lon(rad), lat(rad)] -> output: [x(m), y(m)]
  return ([lon, lat]) => {
    const clampedLat = clamp(lat, -MAX_LAT_RAD, MAX_LAT_RAD);
    const x = R * lon;
    const y = R * Math.log(Math.tan(Math.PI / 4 + clampedLat / 2));
    return [x, y];
  };
}

export function webMercatorInverseRadStep(): (c: Coord2) => Coord2 {
  // input: [x(m), y(m)] -> output: [lon(rad), lat(rad)]
  return ([x, y]) => {
    const lon = x / R;
    const lat = 2 * Math.atan(Math.exp(y / R)) - Math.PI / 2;
    return [lon, lat];
  };
}
