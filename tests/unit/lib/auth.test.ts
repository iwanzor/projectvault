import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

// Use vi.hoisted to ensure the variable is available in the hoisted mock scope
const { capturedAuth } = vi.hoisted(() => {
  return {
    capturedAuth: {
      authorize: null as ((credentials: Record<string, unknown>) => Promise<unknown>) | null,
    },
  };
});

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockCompare = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: (...args: unknown[]) => mockCompare(...args),
  },
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: (options: { authorize: (credentials: Record<string, unknown>) => Promise<unknown> }) => {
    capturedAuth.authorize = options.authorize;
    return {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      options,
    };
  },
}));

vi.mock("next-auth", () => ({
  default: () => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn(),
  }),
}));

function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    userCode: "USR001",
    username: "testuser",
    passwordHash: "$2a$10$hashedpassword",
    branchCode: "BR001",
    isAdmin: false,
    isActive: true,
    failedAttempts: 0,
    lockedUntil: null,
    privileges: [
      {
        module: "SALES",
        viewAll: true,
        viewDetails: true,
        canAdd: false,
        canEdit: false,
        canDelete: false,
      },
    ],
    ...overrides,
  };
}

describe("auth - authorize function", () => {
  beforeAll(async () => {
    // Import the module to trigger NextAuth() call, which captures authorize
    await import("@/lib/auth");
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function authorize(credentials: Record<string, unknown>) {
    if (!capturedAuth.authorize) {
      throw new Error("authorize function was not captured from auth.ts");
    }
    return capturedAuth.authorize(credentials);
  }

  it("throws when username is missing", async () => {
    await expect(authorize({ password: "pass" })).rejects.toThrow(
      "Username and password are required."
    );
  });

  it("throws when password is missing", async () => {
    await expect(authorize({ username: "user" })).rejects.toThrow(
      "Username and password are required."
    );
  });

  it("throws when both credentials are empty strings", async () => {
    await expect(authorize({ username: "", password: "" })).rejects.toThrow(
      "Username and password are required."
    );
  });

  it("throws when user is not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(
      authorize({ username: "unknown", password: "pass" })
    ).rejects.toThrow("Invalid username or password.");
  });

  it("throws when account is inactive", async () => {
    mockFindUnique.mockResolvedValue(createMockUser({ isActive: false }));

    await expect(
      authorize({ username: "testuser", password: "pass" })
    ).rejects.toThrow("This account has been deactivated.");
  });

  it("throws when account is locked and lock has not expired", async () => {
    const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
    mockFindUnique.mockResolvedValue(createMockUser({ lockedUntil }));

    await expect(
      authorize({ username: "testuser", password: "pass" })
    ).rejects.toThrow(/Account is locked/);
  });

  it("resets lock when lock has expired", async () => {
    const expiredLock = new Date(Date.now() - 1000);
    const user = createMockUser({ lockedUntil: expiredLock });
    mockFindUnique.mockResolvedValue(user);
    mockUpdate.mockResolvedValue(user);
    mockCompare.mockResolvedValue(true);

    const result = await authorize({
      username: "testuser",
      password: "correct",
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null },
    });
    expect(result).toBeTruthy();
  });

  it("increments failedAttempts on wrong password", async () => {
    const user = createMockUser({ failedAttempts: 1 });
    mockFindUnique.mockResolvedValue(user);
    mockCompare.mockResolvedValue(false);
    mockUpdate.mockResolvedValue(user);

    await expect(
      authorize({ username: "testuser", password: "wrong" })
    ).rejects.toThrow("Invalid username or password.");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { failedAttempts: 2 },
    });
  });

  it("locks account after reaching threshold (5 failed attempts)", async () => {
    const user = createMockUser({ failedAttempts: 4 });
    mockFindUnique.mockResolvedValue(user);
    mockCompare.mockResolvedValue(false);
    mockUpdate.mockResolvedValue(user);

    await expect(
      authorize({ username: "testuser", password: "wrong" })
    ).rejects.toThrow(
      "Too many failed attempts. Account locked for 15 minutes."
    );

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: user.id },
      data: expect.objectContaining({
        failedAttempts: 5,
        lockedUntil: expect.any(Date),
      }),
    });
  });

  it("returns user with permissions on successful login", async () => {
    const user = createMockUser();
    mockFindUnique.mockResolvedValue(user);
    mockCompare.mockResolvedValue(true);

    const result = await authorize({
      username: "testuser",
      password: "correct",
    });

    expect(result).toEqual({
      id: "1",
      userCode: "USR001",
      username: "testuser",
      branchCode: "BR001",
      isAdmin: false,
      permissions: [
        {
          module: "SALES",
          viewAll: true,
          viewDetails: true,
          canAdd: false,
          canEdit: false,
          canDelete: false,
        },
      ],
    });
  });

  it("resets failedAttempts on successful login when count > 0", async () => {
    const user = createMockUser({ failedAttempts: 3 });
    mockFindUnique.mockResolvedValue(user);
    mockCompare.mockResolvedValue(true);
    mockUpdate.mockResolvedValue(user);

    await authorize({ username: "testuser", password: "correct" });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  });

  it("does not update failedAttempts on successful login when count is 0", async () => {
    const user = createMockUser({ failedAttempts: 0 });
    mockFindUnique.mockResolvedValue(user);
    mockCompare.mockResolvedValue(true);

    await authorize({ username: "testuser", password: "correct" });

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
