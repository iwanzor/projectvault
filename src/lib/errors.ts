export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class AccountLockedError extends AppError {
  constructor(lockedUntil: Date) {
    const minutes = Math.ceil(
      (lockedUntil.getTime() - Date.now()) / 1000 / 60
    );
    super(
      `Account is locked. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      423,
      "ACCOUNT_LOCKED"
    );
    this.name = "AccountLockedError";
  }
}
