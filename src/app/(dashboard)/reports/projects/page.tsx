"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { FolderKanban } from "lucide-react";

import { fetchApi } from "@/lib/api";
import { DataTable } from "@/components/data-display/data-table";
import { CurrencyDisplay } from "@/components/data-display/currency-display";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ExportButton } from "@/components/reports/export-button";
import { ReportSummaryCard } from "@/components/reports/report-summary-card";
import { Select, SelectOption } from "@/components/ui/select";

interface ProjectDetail {
  id: number;
  projectNo: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
  totalValue: number;
  progress: number;
}

interface ProjectReportData {
  summary: {
    total: number;
    byStatus: Record<string, number>;
    totalValue: number;
  };
  details: ProjectDetail[];
}

const currencyFmt = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  minimumFractionDigits: 2,
});

const projectStatusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  active: { label: "Active", variant: "success" },
  on_hold: { label: "On Hold", variant: "warning" },
  completed: { label: "Completed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const statusOptions = ["", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];

export default function ProjectReportPage() {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [status, setStatus] = React.useState("");

  const buildParams = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (status) params.set("status", status);
    return params.toString();
  };

  const { data, isLoading } = useQuery({
    queryKey: ["reports-projects", from, to, status],
    queryFn: () => fetchApi<ProjectReportData>(`/api/reports/projects?${buildParams()}`),
  });

  const columns: ColumnDef<ProjectDetail, unknown>[] = [
    { accessorKey: "projectNo", header: "Project No" },
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} statusMap={projectStatusMap} />,
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => {
        try {
          return format(new Date(row.original.startDate), "dd/MM/yyyy");
        } catch {
          return row.original.startDate;
        }
      },
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => {
        if (!row.original.endDate) return "-";
        try {
          return format(new Date(row.original.endDate), "dd/MM/yyyy");
        } catch {
          return row.original.endDate;
        }
      },
    },
    {
      accessorKey: "totalValue",
      header: "Total Value",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.totalValue)} />,
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${Math.min(100, Number(row.original.progress))}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500">{Number(row.original.progress)}%</span>
        </div>
      ),
    },
  ];

  return (
    <PermissionGate module="REPORTS" action="viewAll" fallback={<p>You do not have permission to view reports.</p>}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Project Report</h1>
            <p className="text-sm text-zinc-500">Project status overview and analytics</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <DateRangePicker from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-8 w-[160px]"
          >
            <SelectOption value="">All Statuses</SelectOption>
            {statusOptions.filter(Boolean).map((s) => (
              <SelectOption key={s} value={s}>{s}</SelectOption>
            ))}
          </Select>
        </div>

        {data?.summary && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <ReportSummaryCard icon={FolderKanban} label="Total Projects" value={data.summary.total} />
            <ReportSummaryCard
              icon={FolderKanban}
              label="Total Value"
              value={currencyFmt.format(data.summary.totalValue)}
            />
            {Object.entries(data.summary.byStatus).map(([key, count]) => (
              <ReportSummaryCard key={key} icon={FolderKanban} label={key} value={count} />
            ))}
          </div>
        )}

        <DataTable
          columns={columns}
          data={data?.details ?? []}
          searchKey="projectNo"
          searchPlaceholder="Filter by project no..."
          isLoading={isLoading}
          emptyMessage="No project data found."
        />
      </div>
    </PermissionGate>
  );
}
