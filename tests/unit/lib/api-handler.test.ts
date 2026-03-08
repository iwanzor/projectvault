import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { AppError, ValidationError } from "@/lib/errors";

// Mock next/server
vi.mock("next/server", () => {
  const mockJson = vi.fn((body: unknown, init?: { status?: number }) => ({
    body,
    status: init?.status ?? 200,
    json: async () => body,
  }));

  return {
    NextRequest: vi.fn(),
    NextResponse: {
      json: mockJson,
      next: vi.fn(),
      redirect: vi.fn(),
    },
  };
});

// Mock auth
const mockAuthFn = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: (...args: unknown[]) => mockAuthFn(...args),
}));

function createMockRequest(): NextRequest {
  return {} as NextRequest;
}

describe("apiHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("returns 401 when requireAuth is true and no session", async () => {
      mockAuthFn.mockResolvedValue(null);

      const handler = vi.fn();
      const wrapped = apiHandler(handler, { requireAuth: true });

      await wrapped(createMockRequest());

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Authentication required" },
        { status: 401 }
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it("returns 401 by default when no session (requireAuth defaults to true)", async () => {
      mockAuthFn.mockResolvedValue(null);

      const handler = vi.fn();
      const wrapped = apiHandler(handler);

      await wrapped(createMockRequest());

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Authentication required" },
        { status: 401 }
      );
    });

    it("allows unauthenticated access when requireAuth is false", async () => {
      mockAuthFn.mockResolvedValue(null);

      const mockResponse = { body: "ok" } as unknown as NextResponse;
      const handler = vi.fn().mockResolvedValue(mockResponse);
      const wrapped = apiHandler(handler, { requireAuth: false });

      const result = await wrapped(createMockRequest());

      expect(handler).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });
  });

  describe("admin check", () => {
    it("returns 403 when requireAdmin is true and user is not admin", async () => {
      mockAuthFn.mockResolvedValue({
        user: { id: "1", username: "user", isAdmin: false },
      });

      const handler = vi.fn();
      const wrapped = apiHandler(handler, { requireAdmin: true });

      await wrapped(createMockRequest());

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Admin access required" },
        { status: 403 }
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it("allows admin users when requireAdmin is true", async () => {
      mockAuthFn.mockResolvedValue({
        user: { id: "1", username: "admin", isAdmin: true },
      });

      const mockResponse = { body: "ok" } as unknown as NextResponse;
      const handler = vi.fn().mockResolvedValue(mockResponse);
      const wrapped = apiHandler(handler, { requireAdmin: true });

      const result = await wrapped(createMockRequest());

      expect(handler).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });
  });

  describe("error handling", () => {
    it("returns proper error response for AppError", async () => {
      mockAuthFn.mockResolvedValue({
        user: { id: "1", username: "user", isAdmin: false },
      });

      const handler = vi.fn().mockRejectedValue(
        new AppError("Not found", 404, "NOT_FOUND")
      );
      const wrapped = apiHandler(handler);

      await wrapped(createMockRequest());

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    });

    it("returns proper error response for ValidationError with field errors", async () => {
      mockAuthFn.mockResolvedValue({
        user: { id: "1", username: "user", isAdmin: false },
      });

      const fieldErrors = { name: ["Name is required"] };
      const handler = vi.fn().mockRejectedValue(
        new ValidationError("Validation failed", fieldErrors)
      );
      const wrapped = apiHandler(handler);

      await wrapped(createMockRequest());

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          errors: fieldErrors,
        },
        { status: 400 }
      );
    });

    it("returns 500 for unknown errors", async () => {
      mockAuthFn.mockResolvedValue({
        user: { id: "1", username: "user", isAdmin: false },
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const handler = vi.fn().mockRejectedValue(new Error("Unexpected"));
      const wrapped = apiHandler(handler);

      await wrapped(createMockRequest());

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Internal server error" },
        { status: 500 }
      );
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("params handling", () => {
    it("resolves params from segmentData and passes to handler", async () => {
      mockAuthFn.mockResolvedValue({
        user: { id: "1", username: "user", isAdmin: false },
      });

      const mockResponse = { body: "ok" } as unknown as NextResponse;
      const handler = vi.fn().mockResolvedValue(mockResponse);
      const wrapped = apiHandler(handler);

      const segmentData = {
        params: Promise.resolve({ id: "123" }),
      };

      await wrapped(createMockRequest(), segmentData);

      expect(handler).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          params: { id: "123" },
        })
      );
    });

    it("passes undefined params when no segmentData", async () => {
      mockAuthFn.mockResolvedValue({
        user: { id: "1", username: "user", isAdmin: false },
      });

      const mockResponse = { body: "ok" } as unknown as NextResponse;
      const handler = vi.fn().mockResolvedValue(mockResponse);
      const wrapped = apiHandler(handler);

      await wrapped(createMockRequest());

      expect(handler).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          params: undefined,
        })
      );
    });
  });
});
