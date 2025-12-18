import type { Coord2 } from "../core/types";
import { UnsupportedOperationError } from "../core/errors";
import { defaultRegistry } from "../core/registry";
import { OperationPipeline } from "../core/pipeline";
import { axisNormalizeStep } from "../ops/axis";
import { degreesToRadiansStep, radiansToDegreesStep } from "../ops/units";
import { webMercatorForwardRadStep, webMercatorInverseRadStep } from "../ops/mercator";

export interface Transformer {
  forward(c: Coord2): Coord2;
  inverse(c: Coord2): Coord2;
}

export function createTransformer(from: string, to: string): Transformer {
  const fromCrs = defaultRegistry.get(from);
  const toCrs = defaultRegistry.get(to);

  // Only EPSG:4326 <-> EPSG:3857 for v0.1.0
  const is4326to3857 = fromCrs.id === "EPSG:4326" && toCrs.id === "EPSG:3857";
  const is3857to4326 = fromCrs.id === "EPSG:3857" && toCrs.id === "EPSG:4326";

  if (!is4326to3857 && !is3857to4326) {
    throw new UnsupportedOperationError(from, to);
  }

  const forwardPipeline = is4326to3857
    ? new OperationPipeline([
        axisNormalizeStep(fromCrs.axis),
        degreesToRadiansStep(),
        webMercatorForwardRadStep(),
        axisNormalizeStep(toCrs.axis),
      ])
    : new OperationPipeline([
        axisNormalizeStep(fromCrs.axis),
        webMercatorInverseRadStep(),
        radiansToDegreesStep(),
        axisNormalizeStep(toCrs.axis),
      ]);

  const inversePipeline = is4326to3857
    ? new OperationPipeline([
        axisNormalizeStep(toCrs.axis),
        webMercatorInverseRadStep(),
        radiansToDegreesStep(),
        axisNormalizeStep(fromCrs.axis),
      ])
    : new OperationPipeline([
        axisNormalizeStep(toCrs.axis),
        degreesToRadiansStep(),
        webMercatorForwardRadStep(),
        axisNormalizeStep(fromCrs.axis),
      ]);

  return {
    forward: (c) => forwardPipeline.run(c),
    inverse: (c) => inversePipeline.run(c),
  };
}

export function transform(from: string, to: string, coord: Coord2): Coord2 {
  return createTransformer(from, to).forward(coord);
}
