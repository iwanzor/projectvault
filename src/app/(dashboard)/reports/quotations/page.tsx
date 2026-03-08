"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { fetchApi } from "@/lib/api";
import { DataTable } from "@/components/data-display/data-table";
import { CurrencyDisplay } from "@/components/data-display/currency-display";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ExportButton } from "@/components/reports/export-button";
import { ReportSummaryCard } from "@/components/reports/report-summary-card";
import { Select, SelectOption } from "@/components/ui/select";
import { FileText, BarChart3, DollarSign, Users } from "lucide-react";

interface QuotationDetail {
  id: number;
  quotationNo: string;
  date: string;
  customerName: string;
  status: string;
  itemsCount: number;
  totalValue: number;
}

interface QuotationReportData {
  summary: {
    total: number;
    byStatus: Record<string, number>;
    byCustomer: Record<string, number>;
    totalValue: number;
  };
  details: QuotationDetail[];
}

const currencyFmt = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  minimumFractionDigits: 2,
});

const statusOptions = ["", "QUOTATION", "SUBMITTED", "PROJECT", "ARCHIVED"];

const quotationStatusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  quotation: { label: "Quotation", variant: "secondary" },
  submitted: { label: "Submitted", variant: "warning" },
  project: { label: "Project", variant: "success" },
  archived: { label: "Archived", variant: "default" },
};

export default function SqReportsPage() {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [customerId, setCustomerId] = React.useState("");

  const buildParams = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (status) params.set("status", status);
    if (customerId) params.set("customerId", customerId);
    return params.toString();
  };

  const { data, isLoading } = useQuery({
    queryKey: ["reports-quotations", from, to, status, customerId],
    queryFn: () => fetchApi<QuotationReportData>(`/api/reports/quotations?${buildParams()}`),
  });

  const columns: ColumnDef<QuotationDetail, unknown>[] = [
    { accessorKey: "quotationNo", header: "Quotation No" },
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
    { accessorKey: "customerName", header: "Customer" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} statusMap={quotationStatusMap} />,
    },
    { accessorKey: "itemsCount", header: "Items" },
    {
      accessorKey: "totalValue",
      header: "Total Value",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.totalValue)} />,
    },
  ];

  const exportParams: Record<string, string> = {};
  if (from) exportParams.from = from;
  if (to) exportParams.to = to;
  if (status) exportParams.status = status;
  if (customerId) exportParams.customerId = customerId;

  return (
    <PermissionGate module="REPORTS" action="viewAll" fallback={<p>You do not have permission to view reports.</p>}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">SQ Reports</h1>
            <p className="text-sm text-zinc-500">Sales quotation reporting and analytics</p>
          </div>
          <ExportButton
            endpoint="/api/reports/export/quotations"
            filename="quotations-report.csv"
            params={exportParams}
          />
        </div>

        {/* Date Range & Filters */}
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

        {/* Summary */}
        {data?.summary && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <ReportSummaryCard icon={FileText} label="Total Quotations" value={data.summary.total} />
              <ReportSummaryCard icon={DollarSign} label="Total Value" value={currencyFmt.format(data.summary.totalValue)} />
              {Object.entries(data.summary.byStatus).map(([key, count]) => (
                <ReportSummaryCard key={key} icon={BarChart3} label={key} value={count} />
              ))}
            </div>
          </div>
        )}

        {/* Detail Table */}
        <DataTable
          columns={columns}
          data={data?.details ?? []}
          searchKey="quotationNo"
          searchPlaceholder="Filter by quotation no..."
          isLoading={isLoading}
          emptyMessage="No quotation data found."
        />
      </div>
    </PermissionGate>
  );
}
