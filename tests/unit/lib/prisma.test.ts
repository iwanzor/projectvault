import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the PrismaMariaDb adapter as a class constructor
vi.mock("@prisma/adapter-mariadb", () => ({
  PrismaMariaDb: class MockPrismaMariaDb {
    constructor() {
      // no-op mock adapter
    }
  },
}));

// Mock the PrismaClient as a class constructor
const mockPrismaInstance = { _isMockClient: true };
vi.mock("@/generated/prisma/client", () => ({
  PrismaClient: class MockPrismaClient {
    constructor() {
      return mockPrismaInstance;
    }
  },
}));

describe("prisma singleton", () => {
  beforeEach(() => {
    // Clean up global state
    const g = globalThis as unknown as { prisma: unknown };
    delete g.prisma;
    // Reset module registry so each test gets a fresh import
    vi.resetModules();
  });

  it("creates a PrismaClient instance", async () => {
    const { prisma } = await import("@/lib/prisma");
    expect(prisma).toBeDefined();
    expect(prisma).toBe(mockPrismaInstance);
  });

  it("stores instance on globalThis in development", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const { prisma } = await import("@/lib/prisma");
    const g = globalThis as unknown as { prisma: unknown };
    expect(g.prisma).toBe(prisma);

    process.env.NODE_ENV = originalEnv;
  });

  it("does not store instance on globalThis in production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    await import("@/lib/prisma");
    const g = globalThis as unknown as { prisma: unknown };
    expect(g.prisma).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });

  it("reuses existing global instance in development", async () => {
    const existingClient = { _isExisting: true };
    const g = globalThis as unknown as { prisma: unknown };
    g.prisma = existingClient;

    const { prisma } = await import("@/lib/prisma");
    expect(prisma).toBe(existingClient);
  });
});
