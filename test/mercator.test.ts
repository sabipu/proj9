import { describe, it } from "vitest";
import { createTransformer, transform } from "../src/index";
import { expectClose } from "./_helpers";

describe("EPSG:4326 <-> EPSG:3857 (Web Mercator)", () => {
  it("[0,0] <-> [0,0]", () => {
    const [x, y] = transform("EPSG:4326", "EPSG:3857", [0, 0]);
    expectClose(x, 0, 1e-9);
    expectClose(y, 0, 1e-9);

    const [lon, lat] = transform("EPSG:3857", "EPSG:4326", [0, 0]);
    expectClose(lon, 0, 1e-12);
    expectClose(lat, 0, 1e-12);
  });

  it("[180,0] -> approx [20037508.342789244, 0]", () => {
    const [x, y] = transform("EPSG:4326", "EPSG:3857", [180, 0]);
    expectClose(x, 20037508.342789244, 1e-9);
    expectClose(y, 0, 1e-9);
  });

  it("[-180,0] -> approx [-20037508.342789244, 0]", () => {
    const [x, y] = transform("EPSG:4326", "EPSG:3857", [-180, 0]);
    expectClose(x, -20037508.342789244, 1e-9);
    expectClose(y, 0, 1e-9);
  });

  it("max latitude and clamp behavior", () => {
    const [, y1] = transform("EPSG:4326", "EPSG:3857", [0, 85.0511287798066]);
    expectClose(y1, 20037508.342789244, 1e-6);

    const [, y2] = transform("EPSG:4326", "EPSG:3857", [0, 90]);
    expectClose(y2, 20037508.342789244, 1e-6);
  });

  it("roundtrip tolerance (degrees)", () => {
    const t = createTransformer("EPSG:4326", "EPSG:3857");
    const p: [number, number] = [12.3456789, -45.6789123];
    const q = t.inverse(t.forward(p));
    expectClose(q[0], p[0], 1e-9);
    expectClose(q[1], p[1], 1e-9);
  });
});
