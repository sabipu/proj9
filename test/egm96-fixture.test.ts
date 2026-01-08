import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setProjDataDir, transform } from "../src/index";
import { MissingGridError } from "../src/core/errors";
import { clearEgm96GridCache } from "../src/grids/egm96";

function writeTinyGtx(filePath: string) {
  // Header: lon0, lat0, dx, dy (float64) + nx, ny (int32) => 40 bytes
  // Data: nx*ny float32, row-major, iy*nx+ix.
  const lon0 = 0;
  const lat0 = 0;
  const dx = 1;
  const dy = 1;
  const nx = 2;
  const ny = 2;

  const buf = Buffer.alloc(40 + nx * ny * 4);
  buf.writeDoubleLE(lon0, 0);
  buf.writeDoubleLE(lat0, 8);
  buf.writeDoubleLE(dx, 16);
  buf.writeDoubleLE(dy, 24);
  buf.writeInt32LE(nx, 32);
  buf.writeInt32LE(ny, 36);

  // Values:
  // (0,0)=10, (1,0)=20
  // (0,1)=30, (1,1)=40
  const vals = [10, 20, 30, 40];
  for (let i = 0; i < vals.length; i++) {
    buf.writeFloatLE(vals[i], 40 + i * 4);
  }

  fs.writeFileSync(filePath, buf);
}

describe("EGM96 vertical conversion (fixture)", () => {
  it("converts h <-> H using undulation (H = h - N)", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "proj9-js-egm96-"));
    const gridPath = path.join(dir, "egm96_15.gtx");
    writeTinyGtx(gridPath);

    setProjDataDir(dir);
    clearEgm96GridCache();

    // At lon=0.5, lat=0.5 bilinear gives 25
    const out = transform("EPSG:4979", "EPSG:4326+EGM96", [0.5, 0.5, 100]);
    expect(out).toHaveLength(3);
    expect(out[2]).toBe(75);

    const back = transform("EPSG:4326+EGM96", "EPSG:4979", out as [number, number, number]);
    expect(back).toHaveLength(3);
    expect(back[2]).toBe(100);
  });

  it("throws MissingGridError when EGM96 grid is not available", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "proj9-js-egm96-missing-"));
    setProjDataDir(dir);
    clearEgm96GridCache();
    expect(() => transform("EPSG:4979", "EPSG:4326+EGM96", [0, 0, 1])).toThrow(MissingGridError);
  });
});
