import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent, within } from "../../../utils/render";
import { DataTable, type ColorRule } from "@/components/data-display/data-table";
import type { ColumnDef } from "@tanstack/react-table";

type TestData = { id: number; name: string; status: string };

const columns: ColumnDef<TestData, unknown>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "status", header: "Status" },
];

const testData: TestData[] = [
  { id: 1, name: "Alpha", status: "active" },
  { id: 2, name: "Beta", status: "inactive" },
  { id: 3, name: "Gamma", status: "active" },
];

describe("DataTable", () => {
  it("renders columns and data", () => {
    render(<DataTable columns={columns} data={testData} />);

    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("Gamma")).toBeInTheDocument();
  });

  it("shows empty state when no data", () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("shows custom empty message", () => {
    render(
      <DataTable columns={columns} data={[]} emptyMessage="Nothing here" />
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading is true", () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} isLoading={true} loadingRows={3} />
    );
    // Loading state renders Skeleton components (divs with animate-pulse)
    // The loading state renders a table with skeleton rows
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(3);
  });

  it("calls onRowClick when a row is clicked", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(
      <DataTable columns={columns} data={testData} onRowClick={onRowClick} />
    );

    const row = screen.getByText("Alpha").closest("tr")!;
    await user.click(row);
    expect(onRowClick).toHaveBeenCalledWith(testData[0]);
  });

  it("applies color rules to matching rows", () => {
    const colorRules: ColorRule<TestData>[] = [
      {
        condition: (row) => row.status === "inactive",
        className: "bg-red-50",
      },
    ];

    render(
      <DataTable columns={columns} data={testData} colorRules={colorRules} />
    );

    const betaRow = screen.getByText("Beta").closest("tr")!;
    expect(betaRow.className).toContain("bg-red-50");

    const alphaRow = screen.getByText("Alpha").closest("tr")!;
    expect(alphaRow.className).not.toContain("bg-red-50");
  });

  it("renders pagination info", () => {
    render(<DataTable columns={columns} data={testData} />);
    expect(screen.getByText(/row\(s\) total/)).toBeInTheDocument();
  });
});
