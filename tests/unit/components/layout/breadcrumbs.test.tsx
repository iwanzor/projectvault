import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../../utils/render";
import { usePathname } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

const mockUsePathname = vi.mocked(usePathname);

describe("Breadcrumbs", () => {
  it("renders home link always", () => {
    mockUsePathname.mockReturnValue("/setup/items");
    render(<Breadcrumbs />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav).toBeInTheDocument();
    // Home icon link
    const links = nav.querySelectorAll("a");
    expect(links[0]).toHaveAttribute("href", "/");
  });

  it("generates correct breadcrumbs from path", () => {
    mockUsePathname.mockReturnValue("/setup/items");
    render(<Breadcrumbs />);
    expect(screen.getByText("Setup")).toBeInTheDocument();
    expect(screen.getByText("Items")).toBeInTheDocument();
  });

  it("last item is not a link", () => {
    mockUsePathname.mockReturnValue("/setup/items");
    render(<Breadcrumbs />);
    const items = screen.getByText("Items");
    // The last breadcrumb should be a span, not wrapped in a link
    expect(items.tagName).toBe("SPAN");
    expect(items.closest("a")).toBeNull();
  });

  it("non-last items are links", () => {
    mockUsePathname.mockReturnValue("/setup/items");
    render(<Breadcrumbs />);
    const setup = screen.getByText("Setup");
    expect(setup.closest("a")).not.toBeNull();
    expect(setup.closest("a")).toHaveAttribute("href", "/setup");
  });

  it("returns null when at root path", () => {
    mockUsePathname.mockReturnValue("/");
    const { container } = render(<Breadcrumbs />);
    expect(container.firstChild).toBeNull();
  });

  it("formats known segment labels correctly", () => {
    mockUsePathname.mockReturnValue("/accounting/bank-accounts");
    render(<Breadcrumbs />);
    expect(screen.getByText("Accounting")).toBeInTheDocument();
    expect(screen.getByText("Bank Accounts")).toBeInTheDocument();
  });

  it("formats numeric segments with hash prefix", () => {
    mockUsePathname.mockReturnValue("/projects/123");
    render(<Breadcrumbs />);
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("#123")).toBeInTheDocument();
  });

  it("formats unknown segments as title case", () => {
    mockUsePathname.mockReturnValue("/some-unknown-path");
    render(<Breadcrumbs />);
    expect(screen.getByText("Some Unknown Path")).toBeInTheDocument();
  });
});
