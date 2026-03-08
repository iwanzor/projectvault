import { vi } from "vitest";
import type { Session } from "next-auth";
import type { Permission } from "@/types/next-auth";

export function createMockSession(overrides?: Partial<Session["user"]>): Session {
  return {
    user: {
      id: "1",
      userCode: "USR001",
      username: "testuser",
      branchCode: "BR001",
      isAdmin: false,
      permissions: [],
      ...overrides,
    },
    expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
}

export function mockAdminSession(): Session {
  return createMockSession({
    id: "1",
    userCode: "ADMIN01",
    username: "admin",
    isAdmin: true,
    permissions: [
      { module: "SETUP", viewAll: true, viewDetails: true, canAdd: true, canEdit: true, canDelete: true },
      { module: "SALES", viewAll: true, viewDetails: true, canAdd: true, canEdit: true, canDelete: true },
      { module: "ACCOUNT", viewAll: true, viewDetails: true, canAdd: true, canEdit: true, canDelete: true },
      { module: "PROJECT", viewAll: true, viewDetails: true, canAdd: true, canEdit: true, canDelete: true },
      { module: "WAREHOUSE", viewAll: true, viewDetails: true, canAdd: true, canEdit: true, canDelete: true },
      { module: "REPORTS", viewAll: true, viewDetails: true, canAdd: true, canEdit: true, canDelete: true },
    ],
  });
}

export function mockUserSession(permissions: Permission[] = []): Session {
  return createMockSession({ permissions });
}

export function mockUnauthenticated(): null {
  return null;
}

// Helper to set the useSession mock return value
export function setSessionMock(session: Session | null) {
  const { useSession } = require("next-auth/react");
  if (session) {
    (useSession as ReturnType<typeof vi.fn>).mockReturnValue({
      data: session,
      status: "authenticated",
    });
  } else {
    (useSession as ReturnType<typeof vi.fn>).mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
  }
}

// Helper to mock the server-side auth() function
export function mockAuth(session: Session | null) {
  vi.mock("@/lib/auth", () => ({
    auth: vi.fn(() => Promise.resolve(session)),
    handlers: { GET: vi.fn(), POST: vi.fn() },
    signIn: vi.fn(),
    signOut: vi.fn(),
  }));
}
