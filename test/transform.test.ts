import { describe, expect, it } from "vitest";
import { createTransformer, transform } from "../src/index.js";
import { UnknownCrsError, UnsupportedOperationError } from "../src/core/errors.js";

function expectClose(actual: number, expected: number, tol: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);
}

describe("transform EPSG:4326 <-> EPSG:3857", () => {
  it("[0,0] -> [0,0]", () => {
    const [x1, y1] = transform("EPSG:4326", "EPSG:3857", [0, 0]);
    expectClose(x1, 0, 1e-9);
    expectClose(y1, 0, 1e-9);

    const [lon, lat] = transform("EPSG:3857", "EPSG:4326", [0, 0]);
    expectClose(lon, 0, 1e-12);
    expectClose(lat, 0, 1e-12);
  });

  it("[180,0] -> approx [20037508.342789244, 0]", () => {
    const [x, y] = transform("EPSG:4326", "EPSG:3857", [180, 0]);
    expectClose(x, 20037508.342789244, 1e-9);
    expectClose(y, 0, 1e-9);
  });

  it("[20037508.342789244,0] -> approx [180,0]", () => {
    const [lon, lat] = transform("EPSG:3857", "EPSG:4326", [20037508.342789244, 0]);
    expectClose(lon, 180, 1e-9);
    expectClose(lat, 0, 1e-12);
  });

  it("max latitude: lat=85.0511287798066 gives y≈20037508.342789244", () => {
    const [x, y] = transform("EPSG:4326", "EPSG:3857", [0, 85.0511287798066]);
    expectClose(x, 0, 1e-9);
    expectClose(y, 20037508.342789244, 1e-6);
  });

  it("latitude clamp: lat=90 clamps to max-y", () => {
    const [, y] = transform("EPSG:4326", "EPSG:3857", [0, 90]);
    expectClose(y, 20037508.342789244, 1e-6);
  });

  it("roundtrip tolerance (degrees)", () => {
    const t = createTransformer("EPSG:4326", "EPSG:3857");
    const p: [number, number] = [12.3456789, -45.6789123];
    const q = t.inverse(t.forward(p));
    expectClose(q[0], p[0], 1e-9);
    expectClose(q[1], p[1], 1e-9);
  });

  it("roundtrip tolerance (several points)", () => {
    const t = createTransformer("EPSG:4326", "EPSG:3857");
    const points: Array<[number, number]> = [
      [0, 0],
      [1, 1],
      [-73.9857, 40.7484],
      [139.6917, 35.6895],
      [12.4924, 41.8902],
      [-0.1276, 51.5072],
      [179.999, 0.001],
      [-179.999, -0.001],
    ];
    for (const p of points) {
      const q = t.inverse(t.forward(p));
      expectClose(q[0], p[0], 1e-9);
      expectClose(q[1], p[1], 1e-9);
    }
  });
});

describe("errors", () => {
  it("throws UnknownCrsError for unknown CRS id", () => {
    expect(() => transform("EPSG:999999", "EPSG:3857", [0, 0])).toThrow(UnknownCrsError);
    expect(() => transform("EPSG:999999", "EPSG:3857", [0, 0])).toThrow("Unknown CRS: EPSG:999999");
  });

  it("throws UnsupportedOperationError for unsupported pairs", () => {
    expect(() => createTransformer("EPSG:4326", "EPSG:4326")).toThrow(UnsupportedOperationError);
    expect(() => createTransformer("EPSG:4326", "EPSG:4326")).toThrow(
      "Unsupported operation: EPSG:4326 -> EPSG:4326"
    );
  });
});
