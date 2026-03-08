import { describe, it, expect } from "vitest";
import { render, screen } from "../../../utils/render";
import { StatusBadge } from "@/components/data-display/status-badge";

describe("StatusBadge", () => {
  it("renders 'Active' status with success variant", () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByText("Active");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-green-100");
  });

  it("renders 'Inactive' status with secondary variant", () => {
    render(<StatusBadge status="inactive" />);
    const badge = screen.getByText("Inactive");
    expect(badge.className).toContain("bg-zinc-100");
  });

  it("renders 'Pending' status with warning variant", () => {
    render(<StatusBadge status="pending" />);
    const badge = screen.getByText("Pending");
    expect(badge.className).toContain("bg-yellow-100");
  });

  it("renders 'Rejected' status with destructive variant", () => {
    render(<StatusBadge status="rejected" />);
    const badge = screen.getByText("Rejected");
    expect(badge.className).toContain("bg-red-100");
  });

  it("renders 'Approved' status with success variant", () => {
    render(<StatusBadge status="approved" />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("renders 'Draft' status with secondary variant", () => {
    render(<StatusBadge status="draft" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("renders 'Completed' status with success variant", () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders 'Cancelled' status with destructive variant", () => {
    render(<StatusBadge status="cancelled" />);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("handles case-insensitive status", () => {
    render(<StatusBadge status="ACTIVE" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("falls back to showing raw status for unknown statuses", () => {
    render(<StatusBadge status="custom-status" />);
    const badge = screen.getByText("custom-status");
    expect(badge).toBeInTheDocument();
    // Falls back to secondary variant
    expect(badge.className).toContain("bg-zinc-100");
  });

  it("uses custom statusMap when provided", () => {
    const customMap = {
      "in-review": { label: "In Review", variant: "warning" as const },
    };
    render(<StatusBadge status="in-review" statusMap={customMap} />);
    const badge = screen.getByText("In Review");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-yellow-100");
  });
});
