import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../../utils/render";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with default variant", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("bg-zinc-900");
  });

  it("renders destructive variant", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.className).toContain("bg-red-600");
  });

  it("renders outline variant", () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole("button", { name: "Outline" });
    expect(button.className).toContain("border");
  });

  it("renders secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button", { name: "Secondary" });
    expect(button.className).toContain("bg-zinc-100");
  });

  it("renders ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole("button", { name: "Ghost" });
    expect(button.className).toContain("hover:bg-zinc-100");
  });

  it("renders link variant", () => {
    render(<Button variant="link">Link</Button>);
    const button = screen.getByRole("button", { name: "Link" });
    expect(button.className).toContain("underline-offset-4");
  });

  it("renders sm size", () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole("button", { name: "Small" });
    expect(button.className).toContain("h-8");
  });

  it("renders default size", () => {
    render(<Button size="default">Default</Button>);
    const button = screen.getByRole("button", { name: "Default" });
    expect(button.className).toContain("h-9");
  });

  it("renders lg size", () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole("button", { name: "Large" });
    expect(button.className).toContain("h-10");
  });

  it("handles click events", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole("button", { name: "Click" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire click when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>
    );
    const button = screen.getByRole("button", { name: "Disabled" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole("button", { name: "Custom" });
    expect(button.className).toContain("custom-class");
  });
});
