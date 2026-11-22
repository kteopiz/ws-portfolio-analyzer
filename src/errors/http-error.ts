export class HttpError extends Error {
  constructor(
    _logMessage: string,
    public clientMessage: string,
    public statusCode: number,
  ) {
    super(clientMessage);
  }
}
