export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input") {
    super(message, 400);
  }
}
