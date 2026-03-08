import { describe, it, expect } from "vitest";
import { render, screen } from "../../../utils/render";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders with default variant", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-zinc-900");
  });

  it("renders secondary variant", () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    const badge = screen.getByText("Secondary");
    expect(badge.className).toContain("bg-zinc-100");
  });

  it("renders destructive variant", () => {
    render(<Badge variant="destructive">Error</Badge>);
    const badge = screen.getByText("Error");
    expect(badge.className).toContain("bg-red-100");
  });

  it("renders outline variant", () => {
    render(<Badge variant="outline">Outline</Badge>);
    const badge = screen.getByText("Outline");
    expect(badge.className).toContain("border");
  });

  it("renders success variant", () => {
    render(<Badge variant="success">Success</Badge>);
    const badge = screen.getByText("Success");
    expect(badge.className).toContain("bg-green-100");
  });

  it("renders warning variant", () => {
    render(<Badge variant="warning">Warning</Badge>);
    const badge = screen.getByText("Warning");
    expect(badge.className).toContain("bg-yellow-100");
  });

  it("displays children text", () => {
    render(<Badge>Hello World</Badge>);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Badge className="my-class">Styled</Badge>);
    const badge = screen.getByText("Styled");
    expect(badge.className).toContain("my-class");
  });
});
