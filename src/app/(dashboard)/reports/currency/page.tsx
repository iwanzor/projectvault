"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DollarSign } from "lucide-react";

import { fetchApi } from "@/lib/api";
import { DataTable } from "@/components/data-display/data-table";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ReportSummaryCard } from "@/components/reports/report-summary-card";
import { Select, SelectOption } from "@/components/ui/select";

interface CurrencyRow {
  code: string;
  totalQuotations: number;
  totalValue: number;
  avgRate: number;
}

interface CurrencyReportData {
  currencies: CurrencyRow[];
}

const numFmt = (n: number) =>
  new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function CurrencyReportPage() {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [currencyCode, setCurrencyCode] = React.useState("");

  const buildParams = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (currencyCode) params.set("currencyCode", currencyCode);
    return params.toString();
  };

  const { data, isLoading } = useQuery({
    queryKey: ["reports-currency", from, to, currencyCode],
    queryFn: () => fetchApi<CurrencyReportData>(`/api/reports/currency?${buildParams()}`),
  });

  const columns: ColumnDef<CurrencyRow, unknown>[] = [
    { accessorKey: "code", header: "Currency Code" },
    { accessorKey: "totalQuotations", header: "Total Quotations" },
    {
      accessorKey: "totalValue",
      header: "Total Value",
      cell: ({ row }) => numFmt(Number(row.original.totalValue)),
    },
    {
      accessorKey: "avgRate",
      header: "Average Rate",
      cell: ({ row }) => Number(row.original.avgRate).toFixed(4),
    },
    {
      id: "valueAed",
      header: "Value in AED",
      cell: ({ row }) => numFmt(Number(row.original.totalValue) * Number(row.original.avgRate)),
    },
  ];

  const topCurrencies = data?.currencies?.slice(0, 4) ?? [];

  return (
    <PermissionGate module="REPORTS" action="viewAll" fallback={<p>You do not have permission to view reports.</p>}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Currency Report</h1>
          <p className="text-sm text-zinc-500">Multi-currency quotation analysis</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <DateRangePicker from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
          <Select
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value)}
            className="h-8 w-[140px]"
          >
            <SelectOption value="">All Currencies</SelectOption>
            <SelectOption value="AED">AED</SelectOption>
            <SelectOption value="USD">USD</SelectOption>
            <SelectOption value="EUR">EUR</SelectOption>
            <SelectOption value="GBP">GBP</SelectOption>
          </Select>
        </div>

        {topCurrencies.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {topCurrencies.map((c) => (
              <ReportSummaryCard
                key={c.code}
                icon={DollarSign}
                label={c.code}
                value={numFmt(c.totalValue)}
                subtitle={`${c.totalQuotations} quotations`}
              />
            ))}
          </div>
        )}

        <DataTable
          columns={columns}
          data={data?.currencies ?? []}
          searchKey="code"
          searchPlaceholder="Filter by currency..."
          isLoading={isLoading}
          emptyMessage="No currency data found."
        />
      </div>
    </PermissionGate>
  );
}
