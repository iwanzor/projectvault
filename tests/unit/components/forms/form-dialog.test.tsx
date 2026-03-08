import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../../utils/render";
import { FormDialog } from "@/components/forms/form-dialog";

describe("FormDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: "Create Item",
    onSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
    children: <input placeholder="Item name" />,
  };

  it("renders with title when open", () => {
    render(<FormDialog {...defaultProps} />);
    expect(screen.getByText("Create Item")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <FormDialog {...defaultProps} description="Fill in the details below" />
    );
    expect(screen.getByText("Fill in the details below")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<FormDialog {...defaultProps} />);
    // Only the title should be present, no description element
    expect(screen.queryByText("Fill in the details below")).not.toBeInTheDocument();
  });

  it("renders children form content", () => {
    render(<FormDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText("Item name")).toBeInTheDocument();
  });

  it("calls onSubmit when submit button is clicked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(<FormDialog {...defaultProps} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("calls onOpenChange(false) when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<FormDialog {...defaultProps} onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows custom submit and cancel labels", () => {
    render(
      <FormDialog
        {...defaultProps}
        submitLabel="Create"
        cancelLabel="Discard"
      />
    );
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard" })).toBeInTheDocument();
  });

  it("shows 'Saving...' and disables buttons when isSubmitting", () => {
    render(<FormDialog {...defaultProps} isSubmitting={true} />);
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("does not render when open is false", () => {
    render(<FormDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("Create Item")).not.toBeInTheDocument();
  });
});
