import type { Coord2 } from "../core/types";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export function degreesToRadiansStep(): (c: Coord2) => Coord2 {
  return ([a, b]) => [a * DEG2RAD, b * DEG2RAD];
}

export function radiansToDegreesStep(): (c: Coord2) => Coord2 {
  return ([a, b]) => [a * RAD2DEG, b * RAD2DEG];
}
