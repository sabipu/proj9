export type Coord2 = [number, number];
export type Coord3 = [number, number, number];
export type Coord = Coord2 | Coord3;

export type Unit = "degree" | "radian" | "metre";

export type AxisName = "lon" | "lat" | "x" | "y";

export type CrsKind = "geographic" | "projected";
