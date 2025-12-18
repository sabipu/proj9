import type { Coord2 } from "./types";

export type Step = (c: Coord2) => Coord2;

export class OperationPipeline {
  constructor(private readonly steps: readonly Step[]) {}

  run(coord: Coord2): Coord2 {
    let c = coord;
    for (const step of this.steps) c = step(c);
    return c;
  }
}
