import fs from "node:fs";

export interface GtxHeader {
  lon0: number;
  lat0: number;
  dx: number;
  dy: number;
  nx: number;
  ny: number;
  littleEndian: boolean;
}

function readHeader(buf: Buffer, littleEndian: boolean): GtxHeader {
  const lon0 = littleEndian ? buf.readDoubleLE(0) : buf.readDoubleBE(0);
  const lat0 = littleEndian ? buf.readDoubleLE(8) : buf.readDoubleBE(8);
  const dx = littleEndian ? buf.readDoubleLE(16) : buf.readDoubleBE(16);
  const dy = littleEndian ? buf.readDoubleLE(24) : buf.readDoubleBE(24);
  const nx = littleEndian ? buf.readInt32LE(32) : buf.readInt32BE(32);
  const ny = littleEndian ? buf.readInt32LE(36) : buf.readInt32BE(36);
  return { lon0, lat0, dx, dy, nx, ny, littleEndian };
}

function isPlausibleHeader(h: GtxHeader): boolean {
  if (!Number.isFinite(h.lon0) || !Number.isFinite(h.lat0)) return false;
  if (!Number.isFinite(h.dx) || !Number.isFinite(h.dy)) return false;
  if (h.dx === 0 || h.dy === 0) return false;
  if (h.nx <= 1 || h.ny <= 1) return false;
  if (Math.abs(h.lon0) > 1000 || Math.abs(h.lat0) > 1000) return false;
  // steps should be within some sane range (degrees)
  if (Math.abs(h.dx) > 10 || Math.abs(h.dy) > 10) return false;
  return true;
}

export class GtxGrid {
  constructor(
    public readonly header: GtxHeader,
    private readonly buf: Buffer
  ) {}

  private dataOffsetBytes(): number {
    // 4 float64 + 2 int32 = 40 bytes
    return 40;
  }

  private readValue(ix: number, iy: number): number {
    const { nx, littleEndian } = this.header;
    const idx = iy * nx + ix;
    const off = this.dataOffsetBytes() + idx * 4;
    return littleEndian ? this.buf.readFloatLE(off) : this.buf.readFloatBE(off);
  }

  /**
   * Sample grid at lon/lat (degrees) using bilinear interpolation.
   * Returns the grid value in meters (for geoid undulation grids).
   */
  sample(lonDeg: number, latDeg: number): number {
    const { lon0, lat0, dx, dy, nx, ny } = this.header;

    // Handle grids that span 360 degrees in longitude by wrapping.
    const lonSpan = Math.abs(dx) * (nx - 1);
    let lon = lonDeg;
    if (lonSpan >= 359.0) {
      // normalize lon into [min, min+span)
      const minLon = lon0;
      const span = dx > 0 ? lonSpan : -lonSpan;
      const twoPi = span;
      // shift into range using modulo arithmetic
      const rel = lon - minLon;
      lon = minLon + ((((rel % twoPi) + twoPi) % twoPi) as number);
    }

    const fx = (lon - lon0) / dx;
    const fy = (latDeg - lat0) / dy;

    // Clamp to grid interior
    const x = Math.min(nx - 1 - 1e-12, Math.max(0, fx));
    const y = Math.min(ny - 1 - 1e-12, Math.max(0, fy));

    const ix0 = Math.floor(x);
    const iy0 = Math.floor(y);
    const ix1 = Math.min(ix0 + 1, nx - 1);
    const iy1 = Math.min(iy0 + 1, ny - 1);

    const tx = x - ix0;
    const ty = y - iy0;

    const v00 = this.readValue(ix0, iy0);
    const v10 = this.readValue(ix1, iy0);
    const v01 = this.readValue(ix0, iy1);
    const v11 = this.readValue(ix1, iy1);

    const v0 = v00 * (1 - tx) + v10 * tx;
    const v1 = v01 * (1 - tx) + v11 * tx;
    return v0 * (1 - ty) + v1 * ty;
  }
}

export function loadGtxGridSync(filePath: string): GtxGrid {
  const buf = fs.readFileSync(filePath);
  if (buf.byteLength < 40) throw new Error(`Invalid GTX grid (too small): ${filePath}`);

  const hLE = readHeader(buf, true);
  const hBE = readHeader(buf, false);
  const header = isPlausibleHeader(hLE) ? hLE : hBE;

  const expectedBytes = 40 + header.nx * header.ny * 4;
  if (buf.byteLength < expectedBytes) {
    throw new Error(
      `Invalid GTX grid (truncated): ${filePath} (expected >= ${expectedBytes}, got ${buf.byteLength})`
    );
  }

  return new GtxGrid(header, buf);
}
