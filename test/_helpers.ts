import { expect } from "vitest";

export function expectClose(actual: number, expected: number, tol: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);
}
