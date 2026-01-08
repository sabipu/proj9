import { describe, expect, it } from "vitest";
import { transform, transformMany } from "../src/index";
import { expectClose } from "./_helpers";

describe("CRS id aliases", () => {
  it("accepts common EPSG aliases", () => {
    const p: [number, number] = [180, 0];
    const [x1, y1] = transform("4326", "3857", p);
    const [x2, y2] = transform("epsg:4326", "EPSG:3857", p);
    const [x3, y3] = transform("urn:ogc:def:crs:EPSG::4326", "EPSG::3857", p);

    expectClose(x1, 20037508.342789244, 1e-9);
    expectClose(y1, 0, 1e-9);
    expectClose(x2, x1, 1e-12);
    expectClose(y2, y1, 1e-12);
    expectClose(x3, x1, 1e-12);
    expectClose(y3, y1, 1e-12);
  });

  it("accepts CRS:84", () => {
    const p: [number, number] = [12.34, 56.78];
    const a = transform("CRS:84", "EPSG:3857", p);
    const b = transform("EPSG:4326", "EPSG:3857", p);
    expectClose(a[0], b[0], 1e-9);
    expectClose(a[1], b[1], 1e-9);
  });
});

describe("3D coords", () => {
  it("z passthrough for horizontal-only ops", () => {
    const p: [number, number, number] = [180, 0, 123.456];
    const out = transform("EPSG:4326", "EPSG:3857", p);
    expect(out).toHaveLength(3);
    expectClose(out[2], 123.456, 0);
  });

  it("transformMany supports 3D and preserves z", () => {
    const pts: Array<[number, number, number]> = [
      [0, 0, 0],
      [1, 2, 3],
      [180, 0, 4],
    ];
    const out = transformMany("4326", "3857", pts);
    expect(out).toHaveLength(pts.length);
    for (let i = 0; i < pts.length; i++) {
      expect(out[i]).toHaveLength(3);
      expectClose(out[i][2], pts[i][2], 0);
    }
  });
});
