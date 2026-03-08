import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getToken from next-auth/jwt
const mockGetToken = vi.fn();
vi.mock("next-auth/jwt", () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
}));

// Mock next/server
const mockRedirect = vi.fn((url: URL) => ({
  type: "redirect",
  url: url.toString(),
}));

const mockNext = vi.fn(() => ({
  type: "next",
}));

vi.mock("next/server", () => ({
  NextResponse: {
    redirect: (...args: unknown[]) => mockRedirect(...args),
    next: (...args: unknown[]) => mockNext(...args),
  },
}));

import { middleware } from "@/middleware";

function createMockRequest(pathname: string, origin = "http://localhost:3000") {
  return {
    nextUrl: {
      pathname,
    },
    url: `${origin}${pathname}`,
  } as any;
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("public assets passthrough", () => {
    it("passes through _next requests", async () => {
      const req = createMockRequest("/_next/static/chunk.js");
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("passes through /api/auth requests", async () => {
      const req = createMockRequest("/api/auth/signin");
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });

    it("passes through favicon requests", async () => {
      const req = createMockRequest("/favicon.ico");
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("unauthenticated users", () => {
    beforeEach(() => {
      mockGetToken.mockResolvedValue(null);
    });

    it("redirects unauthenticated users to /login", async () => {
      const req = createMockRequest("/dashboard");
      await middleware(req);

      expect(mockRedirect).toHaveBeenCalled();
      const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/login");
      expect(redirectUrl.searchParams.get("callbackUrl")).toBe("/dashboard");
    });

    it("allows unauthenticated users on /login", async () => {
      const req = createMockRequest("/login");
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("authenticated users", () => {
    beforeEach(() => {
      mockGetToken.mockResolvedValue({
        id: "1",
        username: "testuser",
        isAdmin: false,
      });
    });

    it("allows authenticated users to access protected routes", async () => {
      const req = createMockRequest("/dashboard");
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });

    it("redirects authenticated users away from /login to /", async () => {
      const req = createMockRequest("/login");
      await middleware(req);

      expect(mockRedirect).toHaveBeenCalled();
      const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/");
    });
  });

  describe("admin routes", () => {
    it("blocks non-admin users from /admin routes", async () => {
      mockGetToken.mockResolvedValue({
        id: "1",
        username: "user",
        isAdmin: false,
      });

      const req = createMockRequest("/admin/settings");
      await middleware(req);

      expect(mockRedirect).toHaveBeenCalled();
      const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/");
    });

    it("allows admin users to access /admin routes", async () => {
      mockGetToken.mockResolvedValue({
        id: "1",
        username: "admin",
        isAdmin: true,
      });

      const req = createMockRequest("/admin/settings");
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
