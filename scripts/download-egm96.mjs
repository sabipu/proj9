/**
 * Download the official PROJ-data EGM96 15' geoid grid (GeoTIFF) and convert it to PROJ GTX format.
 *
 * Why:
 * - cdn.proj.org hosts GeoTIFF grids, but our runtime grid reader is a tiny synchronous GTX reader.
 * - We convert at dev-time and bundle `data/egm96_15.gtx` in the npm package for a batteries-included UX.
 *
 * Source:
 * - https://cdn.proj.org/us_nga_egm96_15.tif  (managed by OSGeo/PROJ-data)
 */
import fs from "node:fs";
import path from "node:path";

import { fromArrayBuffer } from "geotiff";

const SRC_URL = "https://cdn.proj.org/us_nga_egm96_15.tif";
const OUT_PATH = path.resolve("data", "egm96_15.gtx");

function bufToArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function writeGtx({ lon0, lat0, dx, dy, nx, ny, values }) {
  const headerBytes = 40;
  const out = Buffer.alloc(headerBytes + nx * ny * 4);
  out.writeDoubleLE(lon0, 0);
  out.writeDoubleLE(lat0, 8);
  out.writeDoubleLE(dx, 16);
  out.writeDoubleLE(dy, 24);
  out.writeInt32LE(nx, 32);
  out.writeInt32LE(ny, 36);

  for (let i = 0; i < values.length; i++) {
    out.writeFloatLE(values[i], headerBytes + i * 4);
  }
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, out);
}

console.log(`Downloading ${SRC_URL} ...`);
const res = await fetch(SRC_URL);
if (!res.ok) throw new Error(`Failed to download: ${res.status} ${res.statusText}`);
const tifBuf = Buffer.from(await res.arrayBuffer());
console.log(`Downloaded ${(tifBuf.byteLength / (1024 * 1024)).toFixed(2)} MiB`);

const tiff = await fromArrayBuffer(bufToArrayBuffer(tifBuf));
const image = await tiff.getImage();
const width = image.getWidth();
const height = image.getHeight();

// Read raster as a single interleaved band
const raster = await image.readRasters({ interleave: true });
if (!(raster instanceof Float32Array || raster instanceof Float64Array)) {
  // allow Int16/Int32, but we’ll coerce to float
  console.warn(`Raster type is ${raster.constructor?.name}; coercing to float32`);
}

const fileDir = image.getFileDirectory();
const tiePoints = image.getTiePoints();
const scale = fileDir.ModelPixelScale;
if (!tiePoints?.length || !scale?.length) {
  throw new Error("GeoTIFF missing tiepoints or ModelPixelScale (cannot georeference).");
}

// Standard GeoTIFF: tiepoint at pixel (0,0) with world coords (x0,y0)
const tp = tiePoints[0];
const x0 = tp.x;
const y0 = tp.y;
const sx = scale[0];
const sy = scale[1];

// PROJ/GTX expects a regular lon/lat grid. For typical north-up GeoTIFFs, the tiepoint is
// at the upper-left corner (lon0=x0, latNorth=y0) and latitude decreases as row increases.
// We write GTX with:
// - lon0 at the west edge
// - lat0 at the south edge
// - dx,dy positive
const lon0 = x0;
const dx = sx;
const latNorth = y0;
const lat0 = latNorth - sy * (height - 1);
const outDy = sy;

// GeoTIFF rows go north->south; GTX rows should go south->north, so flip vertically.
const values = new Float32Array(width * height);
for (let iy = 0; iy < height; iy++) {
  const srcY = height - 1 - iy;
  for (let ix = 0; ix < width; ix++) {
    const srcIdx = srcY * width + ix;
    const dstIdx = iy * width + ix;
    values[dstIdx] = Number(raster[srcIdx]);
  }
}

writeGtx({
  lon0,
  lat0,
  dx,
  dy: outDy,
  nx: width,
  ny: height,
  values,
});

console.log(`Wrote ${OUT_PATH}`);
console.log(
  `GTX header: lon0=${lon0}, lat0=${lat0}, dx=${dx}, dy=${outDy}, nx=${width}, ny=${height}`
);
