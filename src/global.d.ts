interface ErrorOptions {
    cause?: Error;
  }

  interface AggregateError extends Error {
    errors: Error[];
  }
