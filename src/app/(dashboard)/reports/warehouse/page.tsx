"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Warehouse, Truck, ArrowLeftRight, RotateCcw } from "lucide-react";

import { fetchApi } from "@/lib/api";
import { DataTable } from "@/components/data-display/data-table";
import { CurrencyDisplay } from "@/components/data-display/currency-display";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ExportButton } from "@/components/reports/export-button";
import { ReportSummaryCard } from "@/components/reports/report-summary-card";
import { Select, SelectOption } from "@/components/ui/select";

interface WarehouseDetail {
  id: number;
  documentNo: string;
  type: string;
  date: string;
  projectNo: string;
  itemCount: number;
  totalValue: number;
  description: string;
}

interface WarehouseReportData {
  summary: {
    totalGrn: number;
    totalGin: number;
    totalGtn: number;
    totalGrrn: number;
    totalValue: number;
  };
  details: WarehouseDetail[];
}

const currencyFmt = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  minimumFractionDigits: 2,
});

const typeOptions = ["", "GRN", "GIN", "GTN", "GRRN"];

export default function WarehouseReportPage() {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [projectNo, setProjectNo] = React.useState("");
  const [type, setType] = React.useState("");

  const buildParams = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (projectNo) params.set("projectNo", projectNo);
    if (type) params.set("type", type);
    return params.toString();
  };

  const { data, isLoading } = useQuery({
    queryKey: ["reports-warehouse", from, to, projectNo, type],
    queryFn: () => fetchApi<WarehouseReportData>(`/api/reports/warehouse?${buildParams()}`),
  });

  const columns: ColumnDef<WarehouseDetail, unknown>[] = [
    { accessorKey: "documentNo", header: "Document No" },
    { accessorKey: "type", header: "Type" },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        try {
          return format(new Date(row.original.date), "dd/MM/yyyy");
        } catch {
          return row.original.date;
        }
      },
    },
    { accessorKey: "projectNo", header: "Project" },
    { accessorKey: "itemCount", header: "Items" },
    {
      accessorKey: "totalValue",
      header: "Total Value",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.totalValue)} />,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate block">{row.original.description || "-"}</span>
      ),
    },
  ];

  const exportParams: Record<string, string> = {};
  if (from) exportParams.from = from;
  if (to) exportParams.to = to;
  if (projectNo) exportParams.projectNo = projectNo;
  if (type) exportParams.type = type;

  return (
    <PermissionGate module="REPORTS" action="viewAll" fallback={<p>You do not have permission to view reports.</p>}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Warehouse Report</h1>
            <p className="text-sm text-zinc-500">Warehouse operations overview</p>
          </div>
          <ExportButton
            endpoint="/api/reports/export/warehouse"
            filename="warehouse-report.csv"
            params={exportParams}
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <DateRangePicker from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
          <input
            type="text"
            placeholder="Project No..."
            value={projectNo}
            onChange={(e) => setProjectNo(e.target.value)}
            className="flex h-8 w-[140px] rounded-md border border-zinc-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:placeholder:text-zinc-500"
          />
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-8 w-[120px]"
          >
            <SelectOption value="">All Types</SelectOption>
            {typeOptions.filter(Boolean).map((t) => (
              <SelectOption key={t} value={t}>{t}</SelectOption>
            ))}
          </Select>
        </div>

        {data?.summary && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <ReportSummaryCard icon={Truck} label="Total GRNs" value={data.summary.totalGrn} />
            <ReportSummaryCard icon={ArrowLeftRight} label="Total GINs" value={data.summary.totalGin} />
            <ReportSummaryCard icon={ArrowLeftRight} label="Total GTNs" value={data.summary.totalGtn} />
            <ReportSummaryCard icon={RotateCcw} label="Total GRRNs" value={data.summary.totalGrrn} />
            <ReportSummaryCard icon={Warehouse} label="Total Value" value={currencyFmt.format(data.summary.totalValue)} />
          </div>
        )}

        <DataTable
          columns={columns}
          data={data?.details ?? []}
          searchKey="documentNo"
          searchPlaceholder="Filter by document no..."
          isLoading={isLoading}
          emptyMessage="No warehouse data found."
        />
      </div>
    </PermissionGate>
  );
}
