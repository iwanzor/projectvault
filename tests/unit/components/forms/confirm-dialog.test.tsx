import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../../utils/render";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
  };

  it("shows default confirmation message", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
  });

  it("shows custom title and description", () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        title="Delete item?"
        description="This will permanently remove the item."
      />
    );
    expect(screen.getByText("Delete item?")).toBeInTheDocument();
    expect(
      screen.getByText("This will permanently remove the item.")
    ).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenChange(false) when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows custom confirm and cancel labels", () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Yes, delete"
        cancelLabel="No, keep"
      />
    );
    expect(screen.getByRole("button", { name: "Yes, delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No, keep" })).toBeInTheDocument();
  });

  it("shows 'Processing...' when isLoading", () => {
    render(<ConfirmDialog {...defaultProps} isLoading={true} />);
    expect(screen.getByRole("button", { name: "Processing..." })).toBeInTheDocument();
  });

  it("disables buttons when isLoading", () => {
    render(<ConfirmDialog {...defaultProps} isLoading={true} />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Processing..." })).toBeDisabled();
  });

  it("does not render when open is false", () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
  });
});
