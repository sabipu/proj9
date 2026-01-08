import { describe, expect, it } from "vitest";
import path from "node:path";
import { readFileSync } from "node:fs";
import { setProjDataDir, transform } from "../src/index";
import { clearEgm96GridCache, getEgm96Grid } from "../src/grids/egm96";
import { expectClose } from "./_helpers";

type RefFile = {
  source: string;
  points: Array<{ lon: number; lat: number; N: number }>;
};

describe("EGM96 reference points (PROJ-data GeoTIFF derived)", () => {
  it("GTX sampling matches reference values (within tolerance)", () => {
    // Ensure we use bundled grid from repo for this test
    setProjDataDir(path.resolve(process.cwd(), "data"));
    clearEgm96GridCache();

    const ref: RefFile = JSON.parse(
      readFileSync(path.resolve("test/fixtures/egm96-reference.json"), "utf-8")
    );

    const grid = getEgm96Grid();
    for (const p of ref.points) {
      const n = grid.sample(p.lon, p.lat);
      // We store float32-ish values; allow small drift.
      expectClose(n, p.N, 1e-3);
    }
  });

  it("vertical transform uses the same N (H = h - N)", () => {
    setProjDataDir(path.resolve(process.cwd(), "data"));
    clearEgm96GridCache();

    const ref: RefFile = JSON.parse(
      readFileSync(path.resolve("test/fixtures/egm96-reference.json"), "utf-8")
    );

    const p = ref.points[0];
    const h = 100;
    const out = transform("EPSG:4979", "EGM96", [p.lon, p.lat, h]);
    expect(out).toHaveLength(3);
    const H = out[2];
    expectClose(h - H, p.N, 1e-3);
  });
});
