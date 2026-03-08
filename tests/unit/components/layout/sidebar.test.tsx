import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../../utils/render";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import type { Permission } from "@/types/next-auth";

const mockUsePathname = vi.mocked(usePathname);

function createPermission(module: string, viewAll = true): Permission {
  return {
    module,
    viewAll,
    viewDetails: viewAll,
    canAdd: false,
    canEdit: false,
    canDelete: false,
  };
}

describe("Sidebar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("renders the Dashboard link for all users", () => {
    render(<Sidebar userPermissions={[]} isAdmin={false} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders the ProjectVault brand", () => {
    render(<Sidebar userPermissions={[]} isAdmin={false} />);
    expect(screen.getByText("ProjectVault")).toBeInTheDocument();
  });

  it("shows module sections the user has permission for", () => {
    const permissions = [createPermission("SALES")];
    render(<Sidebar userPermissions={permissions} isAdmin={false} />);
    expect(screen.getByText("Sales")).toBeInTheDocument();
  });

  it("hides modules the user has no permission for", () => {
    render(<Sidebar userPermissions={[]} isAdmin={false} />);
    // Sales requires SALES permission, should not be visible
    expect(screen.queryByText("Sales")).not.toBeInTheDocument();
  });

  it("admin sees all sections including Admin", () => {
    render(<Sidebar userPermissions={[]} isAdmin={true} />);
    expect(screen.getByText("Sales")).toBeInTheDocument();
    expect(screen.getByText("Setup")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Accounting")).toBeInTheDocument();
    expect(screen.getByText("Warehouse")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("non-admin does not see Admin section", () => {
    const allPermissions = [
      createPermission("SALES"),
      createPermission("SETUP"),
      createPermission("PROJECT"),
      createPermission("ACCOUNT"),
      createPermission("WAREHOUSE"),
      createPermission("REPORTS"),
    ];
    render(<Sidebar userPermissions={allPermissions} isAdmin={false} />);
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("expands group when clicking on a section with children", async () => {
    const user = userEvent.setup();
    render(<Sidebar userPermissions={[]} isAdmin={true} />);

    // Sales has children (Quotations, Currency Preview)
    await user.click(screen.getByText("Sales"));
    expect(screen.getByText("Quotations")).toBeInTheDocument();
    expect(screen.getByText("Currency Preview")).toBeInTheDocument();
  });

  it("collapses group when clicking expanded section", async () => {
    const user = userEvent.setup();
    render(<Sidebar userPermissions={[]} isAdmin={true} />);

    // Expand Sales
    await user.click(screen.getByText("Sales"));
    expect(screen.getByText("Quotations")).toBeInTheDocument();

    // Collapse Sales
    await user.click(screen.getByText("Sales"));
    expect(screen.queryByText("Quotations")).not.toBeInTheDocument();
  });

  it("collapse toggle works", async () => {
    const user = userEvent.setup();
    render(<Sidebar userPermissions={[]} isAdmin={true} />);

    // Should show Collapse text initially
    expect(screen.getByText("Collapse")).toBeInTheDocument();

    // Click collapse
    await user.click(screen.getByText("Collapse"));

    // After collapsing, the "ProjectVault" text should be hidden
    expect(screen.queryByText("ProjectVault")).not.toBeInTheDocument();
    expect(screen.queryByText("Collapse")).not.toBeInTheDocument();
  });

  it("highlights active route", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Sidebar userPermissions={[]} isAdmin={false} />);
    const dashboardLink = screen.getByText("Dashboard").closest("a")!;
    expect(dashboardLink.className).toContain("bg-slate-800");
  });
});
