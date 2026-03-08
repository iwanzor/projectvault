import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "../../../utils/render";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { useSession } from "next-auth/react";

const mockUseSession = vi.mocked(useSession);

describe("PermissionGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows children when user has the required permission", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          role: "USER",
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
        },
        expires: "",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(
      <PermissionGate module="SALES" action="viewAll">
        <div>Sales Content</div>
      </PermissionGate>
    );

    expect(screen.getByText("Sales Content")).toBeInTheDocument();
  });

  it("hides children when user lacks the required permission", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          role: "USER",
          privileges: [
            {
              module: "SALES",
              viewAll: false,
              viewDetails: false,
              canAdd: false,
              canEdit: false,
              canDelete: false,
            },
          ],
        },
        expires: "",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(
      <PermissionGate module="SALES" action="viewAll">
        <div>Sales Content</div>
      </PermissionGate>
    );

    expect(screen.queryByText("Sales Content")).not.toBeInTheDocument();
  });

  it("admin always sees children", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          role: "ADMIN",
          privileges: [],
        },
        expires: "",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(
      <PermissionGate module="WAREHOUSE" action="delete">
        <div>Admin Content</div>
      </PermissionGate>
    );

    expect(screen.getByText("Admin Content")).toBeInTheDocument();
  });

  it("renders fallback when user lacks permission", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          role: "USER",
          privileges: [],
        },
        expires: "",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(
      <PermissionGate
        module="SETUP"
        action="add"
        fallback={<div>No access</div>}
      >
        <div>Protected</div>
      </PermissionGate>
    );

    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
    expect(screen.getByText("No access")).toBeInTheDocument();
  });

  it("renders fallback when no session exists", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(
      <PermissionGate
        module="SALES"
        action="viewAll"
        fallback={<div>Login required</div>}
      >
        <div>Content</div>
      </PermissionGate>
    );

    expect(screen.queryByText("Content")).not.toBeInTheDocument();
    expect(screen.getByText("Login required")).toBeInTheDocument();
  });

  it("checks the correct action key mapping", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          role: "USER",
          privileges: [
            {
              module: "SETUP",
              viewAll: false,
              viewDetails: false,
              canAdd: true,
              canEdit: false,
              canDelete: false,
            },
          ],
        },
        expires: "",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(
      <PermissionGate module="SETUP" action="add">
        <div>Can Add</div>
      </PermissionGate>
    );

    expect(screen.getByText("Can Add")).toBeInTheDocument();
  });

  it("hides content when module has no privileges entry", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "1",
          role: "USER",
          privileges: [
            {
              module: "SALES",
              viewAll: true,
              viewDetails: true,
              canAdd: true,
              canEdit: true,
              canDelete: true,
            },
          ],
        },
        expires: "",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(
      <PermissionGate module="WAREHOUSE" action="viewAll">
        <div>Warehouse Content</div>
      </PermissionGate>
    );

    expect(screen.queryByText("Warehouse Content")).not.toBeInTheDocument();
  });
});
