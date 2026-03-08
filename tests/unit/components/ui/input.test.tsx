import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../../utils/render";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders with placeholder", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("handles onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input placeholder="Type here" onChange={onChange} />);
    const input = screen.getByPlaceholderText("Type here");
    await user.type(input, "hello");
    expect(onChange).toHaveBeenCalled();
    expect(input).toHaveValue("hello");
  });

  it("applies className", () => {
    render(<Input className="custom-input" placeholder="test" />);
    const input = screen.getByPlaceholderText("test");
    expect(input.className).toContain("custom-input");
  });

  it("renders as disabled", () => {
    render(<Input disabled placeholder="disabled" />);
    expect(screen.getByPlaceholderText("disabled")).toBeDisabled();
  });

  it("renders with specified type", () => {
    render(<Input type="password" placeholder="password" />);
    const input = screen.getByPlaceholderText("password");
    expect(input).toHaveAttribute("type", "password");
  });
});
