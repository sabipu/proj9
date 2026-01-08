export function normalizeCrsId(input: string): string {
  const raw = input.trim();
  if (raw.length === 0) return raw;

  // Handle simple compound form like "EPSG:4326+EGM96"
  if (raw.includes("+")) {
    const parts = raw
      .split("+")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 2) {
      return `${normalizeCrsId(parts[0])}+${normalizeCrsId(parts[1])}`;
    }
  }

  // Common aliases:
  // - "4326" -> "EPSG:4326"
  // - "epsg:4326" -> "EPSG:4326"
  // - "EPSG::4326" -> "EPSG:4326"
  // - "urn:ogc:def:crs:EPSG::4326" -> "EPSG:4326"
  // - "CRS:84" -> "CRS:84"
  const m1 = raw.match(/^(\d+)$/);
  if (m1) return `EPSG:${m1[1]}`;

  const m2 = raw.match(/^epsg:(\d+)$/i);
  if (m2) return `EPSG:${m2[1]}`;

  const m3 = raw.match(/^epsg::(\d+)$/i);
  if (m3) return `EPSG:${m3[1]}`;

  const m4 = raw.match(/^urn:ogc:def:crs:epsg::(\d+)$/i);
  if (m4) return `EPSG:${m4[1]}`;

  const m5 = raw.match(/^crs:84$/i);
  if (m5) return "CRS:84";

  // Vertical model shorthand
  const m6 = raw.match(/^egm96$/i);
  if (m6) return "EGM96";

  return raw;
}
