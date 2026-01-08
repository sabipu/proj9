import { describe, expect, it } from "vitest";
import path from "node:path";
import { getResolvedDataPath, setProjDataDir } from "../src/resources/resourceManager";
import { clearEgm96GridCache, getEgm96Grid } from "../src/grids/egm96";
import { transform } from "../src/index";

describe("EGM96 grid (bundled)", () => {
  it("bundled egm96_15.gtx has expected header", () => {
    // Ensure we are using bundled data in repo (dev/tests)
    setProjDataDir(path.resolve(process.cwd(), "data"));
    clearEgm96GridCache();

    const grid = getEgm96Grid();
    expect(grid.header.lon0).toBe(-180);
    expect(grid.header.lat0).toBe(-90);
    expect(grid.header.dx).toBe(0.25);
    expect(grid.header.dy).toBe(0.25);
    expect(grid.header.nx).toBe(1440);
    expect(grid.header.ny).toBe(721);
  });

  it("sampling returns finite values in plausible range", () => {
    setProjDataDir(path.resolve(process.cwd(), "data"));
    clearEgm96GridCache();
    const grid = getEgm96Grid();

    const n0 = grid.sample(0, 0);
    const n1 = grid.sample(0, 60);
    const n2 = grid.sample(120, -30);
    for (const n of [n0, n1, n2]) {
      expect(Number.isFinite(n)).toBe(true);
      expect(n).toBeGreaterThan(-200);
      expect(n).toBeLessThan(200);
    }
    // sanity: geoid undulation isn't constant globally
    expect(n0).not.toBe(n1);
  });

  it("vertical transform changes z when EGM96 is requested", () => {
    setProjDataDir(path.resolve(process.cwd(), "data"));
    clearEgm96GridCache();

    const out = transform("EPSG:4979", "EGM96", [12.34, 56.78, 100]);
    expect(out).toHaveLength(3);
    expect(out[2]).not.toBe(100);
  });

  it("data path resolver finds egm96_15.gtx", () => {
    const p = getResolvedDataPath("egm96_15.gtx");
    expect(p.endsWith(path.join("data", "egm96_15.gtx"))).toBe(true);
  });
});
