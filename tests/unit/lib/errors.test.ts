import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  AccountLockedError,
} from "@/lib/errors";

describe("AppError", () => {
  it("has correct default properties", () => {
    const error = new AppError("something went wrong");
    expect(error.message).toBe("something went wrong");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBeUndefined();
    expect(error.name).toBe("AppError");
    expect(error).toBeInstanceOf(Error);
  });

  it("accepts custom statusCode and code", () => {
    const error = new AppError("bad request", 400, "BAD_REQUEST");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("BAD_REQUEST");
  });
});

describe("ValidationError", () => {
  it("has 400 status and VALIDATION_ERROR code", () => {
    const error = new ValidationError("invalid input");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.name).toBe("ValidationError");
    expect(error).toBeInstanceOf(AppError);
  });

  it("stores field-level errors", () => {
    const fieldErrors = {
      email: ["Email is required"],
      name: ["Name must be at least 2 characters"],
    };
    const error = new ValidationError("Validation failed", fieldErrors);
    expect(error.errors).toEqual(fieldErrors);
  });

  it("works without field errors", () => {
    const error = new ValidationError("Validation failed");
    expect(error.errors).toBeUndefined();
  });
});

describe("NotFoundError", () => {
  it("has 404 status and default message", () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("Resource not found");
    expect(error.name).toBe("NotFoundError");
    expect(error).toBeInstanceOf(AppError);
  });

  it("accepts a custom message", () => {
    const error = new NotFoundError("User not found");
    expect(error.message).toBe("User not found");
  });
});

describe("ForbiddenError", () => {
  it("has 403 status and default message", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
    expect(error.message).toBe("Access denied");
    expect(error.name).toBe("ForbiddenError");
    expect(error).toBeInstanceOf(AppError);
  });

  it("accepts a custom message", () => {
    const error = new ForbiddenError("Cannot edit this resource");
    expect(error.message).toBe("Cannot edit this resource");
  });
});

describe("UnauthorizedError", () => {
  it("has 401 status and default message", () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.message).toBe("Authentication required");
    expect(error.name).toBe("UnauthorizedError");
    expect(error).toBeInstanceOf(AppError);
  });

  it("accepts a custom message", () => {
    const error = new UnauthorizedError("Token expired");
    expect(error.message).toBe("Token expired");
  });
});

describe("AccountLockedError", () => {
  it("has 423 status and ACCOUNT_LOCKED code", () => {
    const lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    const error = new AccountLockedError(lockedUntil);
    expect(error.statusCode).toBe(423);
    expect(error.code).toBe("ACCOUNT_LOCKED");
    expect(error.name).toBe("AccountLockedError");
    expect(error).toBeInstanceOf(AppError);
  });

  it("formats singular minute correctly", () => {
    const lockedUntil = new Date(Date.now() + 30 * 1000); // 30 seconds = 1 minute
    const error = new AccountLockedError(lockedUntil);
    expect(error.message).toContain("1 minute");
    expect(error.message).not.toContain("minutes");
  });

  it("formats plural minutes correctly", () => {
    const lockedUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const error = new AccountLockedError(lockedUntil);
    expect(error.message).toContain("minutes");
  });
});
