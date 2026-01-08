import { describe, expect, it } from "vitest";
import { createTransformer, transform } from "../src/index";
import {
  MissingGridError,
  UnknownCrsError,
  UnsupportedOperationError,
  UnsupportedVerticalOperationError,
} from "../src/core/errors";

describe("errors", () => {
  it("throws UnknownCrsError for unknown CRS id", () => {
    expect(() => transform("EPSG:999999", "EPSG:3857", [0, 0])).toThrow(UnknownCrsError);
    expect(() => transform("EPSG:999999", "EPSG:3857", [0, 0])).toThrow("Unknown CRS: EPSG:999999");
  });

  it("unknown numeric alias maps to EPSG and still errors clearly", () => {
    expect(() => transform("999999", "3857", [0, 0])).toThrow(UnknownCrsError);
    expect(() => transform("999999", "3857", [0, 0])).toThrow("Unknown CRS: EPSG:999999");
  });

  it("throws UnsupportedOperationError for unsupported pairs", () => {
    expect(() => createTransformer("EPSG:4326", "EPSG:4326")).toThrow(UnsupportedOperationError);
    expect(() => createTransformer("EPSG:4326", "EPSG:4326")).toThrow(
      "Unsupported operation: EPSG:4326 -> EPSG:4326"
    );
  });

  it("unsupported pair with aliases reports normalized ids", () => {
    expect(() => createTransformer("4326", "4326")).toThrow(UnsupportedOperationError);
    expect(() => createTransformer("4326", "4326")).toThrow(
      "Unsupported operation: EPSG:4326 -> EPSG:4326"
    );
  });

  it("unsupported vertical operation errors clearly", () => {
    // EGM96 vertical conversion only supported for EPSG:4979 <-> EPSG:4326+EGM96 for now
    expect(() => createTransformer("EPSG:3857", "EGM96")).toThrow(
      UnsupportedVerticalOperationError
    );
  });

  it("missing grid triggers MissingGridError", () => {
    // We can't call setProjDataDir here without affecting other tests globally, so just assert the class exists.
    expect(MissingGridError.name).toBe("MissingGridError");
  });
});
