export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function raiseHttpError(
  status: number,
  code: string,
  message: string,
): never {
  throw new HttpError(status, code, message);
}
