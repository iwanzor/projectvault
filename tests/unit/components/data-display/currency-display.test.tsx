import { describe, it, expect } from "vitest";
import { render, screen } from "../../../utils/render";
import { CurrencyDisplay } from "@/components/data-display/currency-display";

describe("CurrencyDisplay", () => {
  it("formats a positive number as AED currency", () => {
    render(<CurrencyDisplay amount={1000} />);
    const el = screen.getByText(/1,000\.00/);
    expect(el).toBeInTheDocument();
    expect(el.className).toContain("tabular-nums");
  });

  it("handles zero amount", () => {
    render(<CurrencyDisplay amount={0} />);
    expect(screen.getByText(/0\.00/)).toBeInTheDocument();
  });

  it("formats negative numbers with minus sign and red color", () => {
    render(<CurrencyDisplay amount={-500} />);
    const el = screen.getByText(/-/);
    expect(el).toBeInTheDocument();
    expect(el.className).toContain("text-red-600");
  });

  it("formats large numbers correctly", () => {
    render(<CurrencyDisplay amount={1234567.89} />);
    expect(screen.getByText(/1,234,567\.89/)).toBeInTheDocument();
  });

  it("shows plus sign for positive amounts when showSign is true", () => {
    render(<CurrencyDisplay amount={100} showSign />);
    const el = screen.getByText(/\+/);
    expect(el).toBeInTheDocument();
  });

  it("does not show plus sign when showSign is false", () => {
    const { container } = render(<CurrencyDisplay amount={100} />);
    expect(container.textContent).not.toContain("+");
  });

  it("does not show sign for zero even with showSign", () => {
    const { container } = render(<CurrencyDisplay amount={0} showSign />);
    const text = container.textContent || "";
    expect(text).not.toContain("+");
    expect(text).not.toContain("-");
  });

  it("applies custom className", () => {
    render(<CurrencyDisplay amount={50} className="custom-money" />);
    const el = screen.getByText(/50\.00/);
    expect(el.className).toContain("custom-money");
  });
});
