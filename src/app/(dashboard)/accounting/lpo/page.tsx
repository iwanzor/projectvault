"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format, isPast, isValid } from "date-fns";

import { fetchApi } from "@/lib/api";
import { DataTable, ColorRule } from "@/components/data-display/data-table";
import { StatusBadge } from "@/components/data-display/status-badge";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";

// --- Types ---

interface LpoItem {
  id: number;
  projectNo: string;
  projectName: string;
  modelNo: string | null;
  quantity: number;
  lpoDate: string | null;
  arrivalDate: string | null;
  project?: { projectNo: string; name: string };
}

interface ProjectItem {
  id: number;
  projectNo: string;
  name: string;
}

function getLpoStatus(lpoDate: string | null, arrivalDate: string | null): string {
  if (!lpoDate) return "pending";
  if (arrivalDate) {
    const arrival = new Date(arrivalDate);
    if (isValid(arrival) && isPast(arrival)) return "completed";
    return "in-transit";
  }
  // LPO date set but no arrival date
  const lpo = new Date(lpoDate);
  if (isValid(lpo) && isPast(lpo)) return "overdue";
  return "pending";
}

const lpoStatusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  completed: { label: "Completed", variant: "success" },
  "in-transit": { label: "In Transit", variant: "default" },
  overdue: { label: "Overdue", variant: "destructive" },
  pending: { label: "Pending", variant: "warning" },
};

// --- Component ---

export default function LpoPage() {
  const [projectFilter, setProjectFilter] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const { data: lpoData = [], isLoading } = useQuery({
    queryKey: ["lpo-tracking"],
    queryFn: () => fetchApi<LpoItem[]>("/api/accounting/lpo"),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["acc-projects-lookup"],
    queryFn: () => fetchApi<ProjectItem[]>("/api/accounting/acc-projects"),
  });

  // Client-side filtering
  const filteredData = React.useMemo(() => {
    let result = lpoData;
    if (projectFilter) {
      result = result.filter((item) => item.projectNo === projectFilter);
    }
    if (dateFrom) {
      result = result.filter((item) => {
        const d = item.lpoDate ?? item.arrivalDate;
        return d && d >= dateFrom;
      });
    }
    if (dateTo) {
      result = result.filter((item) => {
        const d = item.lpoDate ?? item.arrivalDate;
        return d && d <= dateTo;
      });
    }
    return result;
  }, [lpoData, projectFilter, dateFrom, dateTo]);

  const columns: ColumnDef<LpoItem, unknown>[] = [
    {
      id: "project",
      header: "Project",
      accessorFn: (row) => row.project?.projectNo ?? row.projectNo ?? "-",
    },
    {
      id: "projectName",
      header: "Project Name",
      accessorFn: (row) => row.project?.name ?? row.projectName ?? "-",
    },
    {
      accessorKey: "modelNo",
      header: "Model No",
      cell: ({ row }) => row.original.modelNo ?? "-",
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
    },
    {
      accessorKey: "lpoDate",
      header: "LPO Date",
      cell: ({ row }) => {
        const date = row.original.lpoDate;
        if (!date) return "-";
        try {
          return format(new Date(date), "dd/MM/yyyy");
        } catch {
          return date;
        }
      },
    },
    {
      accessorKey: "arrivalDate",
      header: "Arrival Date",
      cell: ({ row }) => {
        const date = row.original.arrivalDate;
        if (!date) return "-";
        try {
          return format(new Date(date), "dd/MM/yyyy");
        } catch {
          return date;
        }
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = getLpoStatus(row.original.lpoDate, row.original.arrivalDate);
        return <StatusBadge status={status} statusMap={lpoStatusMap} />;
      },
    },
  ];

  const colorRules: ColorRule<LpoItem>[] = [
    {
      condition: (row) => getLpoStatus(row.lpoDate, row.arrivalDate) === "overdue",
      className: "bg-red-50 dark:bg-red-950/20",
    },
    {
      condition: (row) => getLpoStatus(row.lpoDate, row.arrivalDate) === "completed",
      className: "bg-green-50/50 dark:bg-green-950/10",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">LPO Tracking</h1>
          <p className="text-sm text-zinc-500">
            {filteredData.length} LPO entries
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="h-8 w-[180px]"
        >
          <SelectOption value="">All Projects</SelectOption>
          {projects.map((p) => (
            <SelectOption key={p.id} value={p.projectNo}>
              {p.projectNo} - {p.name}
            </SelectOption>
          ))}
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-8 w-[140px]"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-8 w-[140px]"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        searchKey="projectNo"
        searchPlaceholder="Filter by project..."
        isLoading={isLoading}
        emptyMessage="No LPO entries found."
        colorRules={colorRules}
      />
    </div>
  );
}
