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

export class MissingGridError extends ProjError {
  override name = "MissingGridError";
  constructor(
    public readonly gridName: string,
    public readonly searchedPath?: string
  ) {
    super(
      searchedPath
        ? `Missing required grid '${gridName}' (looked for: ${searchedPath})`
        : `Missing required grid '${gridName}'`
    );
  }
}

export class UnsupportedVerticalOperationError extends ProjError {
  override name = "UnsupportedVerticalOperationError";
  constructor(
    public readonly from: string,
    public readonly to: string
  ) {
    super(`Unsupported vertical operation: ${from} -> ${to}`);
  }
}
