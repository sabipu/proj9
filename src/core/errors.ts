export class ProjError extends Error {
  override name = "ProjError";
}

export class UnknownCrsError extends ProjError {
  override name = "UnknownCrsError";
  constructor(public readonly crsId: string) {
    super(`Unknown CRS: ${crsId}`);
  }
}

export class UnsupportedOperationError extends ProjError {
  override name = "UnsupportedOperationError";
  constructor(
    public readonly from: string,
    public readonly to: string
  ) {
    super(`Unsupported operation: ${from} -> ${to}`);
  }
}
