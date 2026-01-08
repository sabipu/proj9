/**
 * Generates a small reference table from the official PROJ-data EGM96 GeoTIFF:
 *   https://cdn.proj.org/us_nga_egm96_15.tif
 *
 * Output:
 *   test/fixtures/egm96-reference.json
 *
 * This is used by unit tests to verify that our bundled GTX grid + sampler matches the
 * upstream dataset values at selected points (within tolerance).
 */
import fs from "node:fs";
import path from "node:path";

import { fromArrayBuffer } from "geotiff";

const SRC_URL = "https://cdn.proj.org/us_nga_egm96_15.tif";
const OUT_PATH = path.resolve("test", "fixtures", "egm96-reference.json");

function bufToArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function bilinear(v00, v10, v01, v11, tx, ty) {
  const v0 = v00 * (1 - tx) + v10 * tx;
  const v1 = v01 * (1 - tx) + v11 * tx;
  return v0 * (1 - ty) + v1 * ty;
}

async function main() {
  const res = await fetch(SRC_URL);
  if (!res.ok) throw new Error(`Failed to download: ${res.status} ${res.statusText}`);
  const tifBuf = Buffer.from(await res.arrayBuffer());

  const tiff = await fromArrayBuffer(bufToArrayBuffer(tifBuf));
  const image = await tiff.getImage();
  const width = image.getWidth();
  const height = image.getHeight();

  const fileDir = image.getFileDirectory();
  const tiePoints = image.getTiePoints();
  const scale = fileDir.ModelPixelScale;
  if (!tiePoints?.length || !scale?.length) {
    throw new Error("GeoTIFF missing tiepoints or ModelPixelScale (cannot georeference).");
  }

  // upper-left corner world coords
  const tp = tiePoints[0];
  const x0 = tp.x;
  const y0 = tp.y;
  const sx = scale[0];
  const sy = scale[1];

  // read whole raster (single band)
  const raster = await image.readRasters({ interleave: true });

  function at(ix, iy) {
    const idx = iy * width + ix;
    return Number(raster[idx]);
  }

  // Sample lon/lat by mapping to pixel-space (x right, y down).
  // For north-up GeoTIFF, y decreases with increasing latitude:
  //   py = (y0 - lat) / sy
  //   px = (lon - x0) / sx
  function sample(lon, lat) {
    const px = (lon - x0) / sx;
    const py = (y0 - lat) / sy;

    const x = Math.min(width - 1 - 1e-12, Math.max(0, px));
    const y = Math.min(height - 1 - 1e-12, Math.max(0, py));

    const ix0 = Math.floor(x);
    const iy0 = Math.floor(y);
    const ix1 = Math.min(ix0 + 1, width - 1);
    const iy1 = Math.min(iy0 + 1, height - 1);

    const tx = x - ix0;
    const ty = y - iy0;

    const v00 = at(ix0, iy0);
    const v10 = at(ix1, iy0);
    const v01 = at(ix0, iy1);
    const v11 = at(ix1, iy1);
    return bilinear(v00, v10, v01, v11, tx, ty);
  }

  const points = [
    { lon: 0, lat: 0 },
    { lon: 12.34, lat: 56.78 },
    { lon: -79.41629234, lat: 43.70012234 },
    { lon: 86.925278, lat: 27.988056 },
    { lon: 120.0, lat: -30.0 },
    { lon: -179.75, lat: 10.5 },
  ];

  const out = {
    source: SRC_URL,
    width,
    height,
    tiepoint: { x0, y0 },
    scale: { sx, sy },
    points: points.map((p) => ({
      ...p,
      N: sample(p.lon, p.lat),
    })),
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${OUT_PATH}`);
}

await main();
