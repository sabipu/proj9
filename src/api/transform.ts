import type { Coord, Coord2, Coord3 } from "../core/types";
import { UnsupportedOperationError } from "../core/errors";
import { defaultRegistry } from "../core/registry";
import { OperationPipeline } from "../core/pipeline";
import { normalizeCrsId } from "../core/normalize";
import { selectVerticalOperation } from "../core/verticalOps";
import { axisNormalizeStep } from "../ops/axis";
import { degreesToRadiansStep, radiansToDegreesStep } from "../ops/units";
import { webMercatorForwardRadStep, webMercatorInverseRadStep } from "../ops/mercator";

export interface Transformer {
  forward(c: Coord): Coord;
  inverse(c: Coord): Coord;
}

function splitCoord(c: Coord): { xy: Coord2; z?: number } {
  if (c.length === 3) return { xy: [c[0], c[1]], z: c[2] };
  return { xy: c, z: undefined };
}

function withZ(xy: Coord2, z: number | undefined): Coord {
  if (z === undefined) return xy;
  return [xy[0], xy[1], z];
}

function canonicalOpCrsId(id: string): string {
  // For now, treat common WGS84 geographic variants as equivalent to EPSG:4326
  // for the purpose of selecting the 4326 <-> 3857 operation.
  if (id === "EPSG:4979") return "EPSG:4326";
  if (id === "CRS:84") return "EPSG:4326";
  if (id === "EPSG:4326+EGM96") return "EPSG:4326";
  return id;
}

export function createTransformer(from: string, to: string): Transformer {
  let fromNorm = normalizeCrsId(from);
  let toNorm = normalizeCrsId(to);

  // Shorthand: "EGM96" means WGS84 lon/lat with EGM96 orthometric heights.
  if (fromNorm === "EGM96") fromNorm = "EPSG:4326+EGM96";
  if (toNorm === "EGM96") toNorm = "EPSG:4326+EGM96";

  const fromCrs = defaultRegistry.get(fromNorm);
  const toCrs = defaultRegistry.get(toNorm);

  const verticalOp = selectVerticalOperation(fromCrs, toCrs);
  const verticalNeeded = verticalOp !== null;

  // Only EPSG:4326 <-> EPSG:3857 for v0.1.0
  const fromOp = canonicalOpCrsId(fromCrs.id);
  const toOp = canonicalOpCrsId(toCrs.id);
  const is4326to3857 = fromOp === "EPSG:4326" && toOp === "EPSG:3857";
  const is3857to4326 = fromOp === "EPSG:3857" && toOp === "EPSG:4326";
  const is4326to4326 = fromOp === "EPSG:4326" && toOp === "EPSG:4326";

  if (!is4326to3857 && !is3857to4326 && !(verticalNeeded && is4326to4326)) {
    // Keep same-CRS ops unsupported unless it is needed to do a vertical transform.
    throw new UnsupportedOperationError(fromNorm, toNorm);
  }

  const forwardPipeline = is4326to3857
    ? new OperationPipeline([
        axisNormalizeStep(fromCrs.axis),
        degreesToRadiansStep(),
        webMercatorForwardRadStep(),
        axisNormalizeStep(toCrs.axis),
      ])
    : is3857to4326
      ? new OperationPipeline([
          axisNormalizeStep(fromCrs.axis),
          webMercatorInverseRadStep(),
          radiansToDegreesStep(),
          axisNormalizeStep(toCrs.axis),
        ])
      : new OperationPipeline([
          // Identity horizontal path (used for vertical-only transforms)
          axisNormalizeStep(fromCrs.axis),
          axisNormalizeStep(toCrs.axis),
        ]);

  const inversePipeline = is4326to3857
    ? new OperationPipeline([
        axisNormalizeStep(toCrs.axis),
        webMercatorInverseRadStep(),
        radiansToDegreesStep(),
        axisNormalizeStep(fromCrs.axis),
      ])
    : is3857to4326
      ? new OperationPipeline([
          axisNormalizeStep(toCrs.axis),
          degreesToRadiansStep(),
          webMercatorForwardRadStep(),
          axisNormalizeStep(fromCrs.axis),
        ])
      : new OperationPipeline([axisNormalizeStep(toCrs.axis), axisNormalizeStep(fromCrs.axis)]);

  let verticalForward = (_lonLat: Coord2, z: number): number => z;
  let verticalInverse = (_lonLat: Coord2, z: number): number => z;

  if (verticalNeeded) {
    if (!is4326to4326) {
      // We only support vertical conversion when horizontal is geographic identity for now.
      // selectVerticalOperation already validated supported pairs; this is a horizontal constraint.
      throw new UnsupportedOperationError(fromNorm, toNorm);
    }
    verticalForward = verticalOp.forwardZ;
    verticalInverse = verticalOp.inverseZ;
  }

  return {
    forward: (c) => {
      const { xy, z } = splitCoord(c);
      const xyOut = forwardPipeline.run(xy);
      if (!verticalNeeded) return withZ(xyOut, z);
      if (z === undefined) return xyOut;
      const zOut = verticalForward(xy, z);
      return withZ(xyOut, zOut) as Coord3;
    },
    inverse: (c) => {
      const { xy, z } = splitCoord(c);
      const xyOut = inversePipeline.run(xy);
      if (!verticalNeeded) return withZ(xyOut, z);
      if (z === undefined) return xyOut;
      const zOut = verticalInverse(xyOut, z);
      return withZ(xyOut, zOut) as Coord3;
    },
  };
}

export function transform(from: string, to: string, coord: Coord2): Coord2;
export function transform(from: string, to: string, coord: Coord): Coord;
export function transform(from: string, to: string, coord: Coord): Coord {
  return createTransformer(from, to).forward(coord);
}

export function transformMany(from: string, to: string, coords: readonly Coord2[]): Coord2[];
export function transformMany(from: string, to: string, coords: readonly Coord[]): Coord[];
export function transformMany(from: string, to: string, coords: readonly Coord[]): Coord[] {
  const t = createTransformer(from, to);
  return coords.map((c) => t.forward(c));
}
