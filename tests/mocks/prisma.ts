import { vi, beforeEach } from "vitest";

// Create a proxy-based mock that auto-creates nested model mocks
function createPrismaMock() {
  const modelCache = new Map<string, Record<string, ReturnType<typeof vi.fn>>>();

  return new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === "$connect" || prop === "$disconnect" || prop === "$transaction") {
          return vi.fn();
        }

        if (!modelCache.has(prop)) {
          modelCache.set(prop, {
            findUnique: vi.fn(),
            findUniqueOrThrow: vi.fn(),
            findFirst: vi.fn(),
            findFirstOrThrow: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            createMany: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
            upsert: vi.fn(),
            delete: vi.fn(),
            deleteMany: vi.fn(),
            count: vi.fn(),
            aggregate: vi.fn(),
            groupBy: vi.fn(),
          });
        }

        return modelCache.get(prop);
      },
    }
  );
}

export const prismaMock = createPrismaMock() as any;

// Mock the prisma module
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
