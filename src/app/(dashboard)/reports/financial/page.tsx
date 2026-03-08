"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";

import { fetchApi } from "@/lib/api";
import { DataTable } from "@/components/data-display/data-table";
import { CurrencyDisplay } from "@/components/data-display/currency-display";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ExportButton } from "@/components/reports/export-button";
import { ReportSummaryCard } from "@/components/reports/report-summary-card";
import { Select, SelectOption } from "@/components/ui/select";

interface FinancialDetail {
  id: number;
  transactionNo: string;
  date: string;
  category: string;
  purpose: string;
  projectNo: string;
  amount: number;
  status: string;
}

interface FinancialReportData {
  summary: {
    totalIncome: number;
    totalExpense: number;
    net: number;
    byPurpose: Record<string, number>;
    byProject: Record<string, number>;
    monthlyTrend: Array<{ month: string; income: number; expense: number }>;
  };
  details: FinancialDetail[];
}

const currencyFmt = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  minimumFractionDigits: 2,
});

export default function FinancialReportPage() {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [projectNo, setProjectNo] = React.useState("");

  const buildParams = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (category) params.set("category", category);
    if (projectNo) params.set("projectNo", projectNo);
    return params.toString();
  };

  const { data, isLoading } = useQuery({
    queryKey: ["reports-financial", from, to, category, projectNo],
    queryFn: () => fetchApi<FinancialReportData>(`/api/reports/financial?${buildParams()}`),
  });

  const columns: ColumnDef<FinancialDetail, unknown>[] = [
    { accessorKey: "transactionNo", header: "Transaction No" },
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
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className={row.original.category === "INCOME" ? "text-green-600" : "text-red-600"}>
          {row.original.category}
        </span>
      ),
    },
    { accessorKey: "purpose", header: "Purpose" },
    { accessorKey: "projectNo", header: "Project" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.amount)} />,
    },
    { accessorKey: "status", header: "Status" },
  ];

  const exportParams: Record<string, string> = {};
  if (from) exportParams.from = from;
  if (to) exportParams.to = to;
  if (category) exportParams.category = category;
  if (projectNo) exportParams.projectNo = projectNo;

  return (
    <PermissionGate module="REPORTS" action="viewAll" fallback={<p>You do not have permission to view reports.</p>}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Financial Report</h1>
            <p className="text-sm text-zinc-500">Income, expenses, and net position analysis</p>
          </div>
          <ExportButton
            endpoint="/api/reports/export/financial"
            filename="financial-report.csv"
            params={exportParams}
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <DateRangePicker from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-8 w-[150px]"
          >
            <SelectOption value="">All Categories</SelectOption>
            <SelectOption value="INCOME">Income</SelectOption>
            <SelectOption value="EXPENSE">Expense</SelectOption>
          </Select>
          <input
            type="text"
            placeholder="Project No..."
            value={projectNo}
            onChange={(e) => setProjectNo(e.target.value)}
            className="flex h-8 w-[140px] rounded-md border border-zinc-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:placeholder:text-zinc-500"
          />
        </div>

        {data?.summary && (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <ReportSummaryCard
                icon={TrendingUp}
                label="Total Income"
                value={currencyFmt.format(data.summary.totalIncome)}
                className="border-green-200 dark:border-green-900"
              />
              <ReportSummaryCard
                icon={TrendingDown}
                label="Total Expenses"
                value={currencyFmt.format(data.summary.totalExpense)}
                className="border-red-200 dark:border-red-900"
              />
              <ReportSummaryCard
                icon={DollarSign}
                label="Net Position"
                value={currencyFmt.format(data.summary.net)}
                className={data.summary.net >= 0 ? "border-green-200 dark:border-green-900" : "border-red-200 dark:border-red-900"}
              />
            </div>

            {/* Breakdown by Purpose */}
            {Object.keys(data.summary.byPurpose).length > 0 && (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                <h3 className="text-sm font-medium mb-2">By Purpose</h3>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {Object.entries(data.summary.byPurpose).map(([purpose, amount]) => (
                    <div key={purpose} className="text-sm">
                      <span className="text-zinc-500">{purpose}:</span>{" "}
                      <span className="font-medium">{currencyFmt.format(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Breakdown by Project */}
            {Object.keys(data.summary.byProject).length > 0 && (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                <h3 className="text-sm font-medium mb-2">By Project</h3>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {Object.entries(data.summary.byProject).map(([project, amount]) => (
                    <div key={project} className="text-sm">
                      <span className="text-zinc-500">{project}:</span>{" "}
                      <span className="font-medium">{currencyFmt.format(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Trend */}
            {data.summary.monthlyTrend?.length > 0 && (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                <h3 className="text-sm font-medium mb-2">Monthly Trend</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-1 pr-4 font-medium text-zinc-500">Month</th>
                        <th className="text-right py-1 pr-4 font-medium text-green-600">Income</th>
                        <th className="text-right py-1 pr-4 font-medium text-red-600">Expense</th>
                        <th className="text-right py-1 font-medium text-zinc-500">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.summary.monthlyTrend.map((m) => (
                        <tr key={m.month} className="border-b border-zinc-100 dark:border-zinc-800">
                          <td className="py-1 pr-4">{m.month}</td>
                          <td className="py-1 pr-4 text-right text-green-600">{currencyFmt.format(m.income)}</td>
                          <td className="py-1 pr-4 text-right text-red-600">{currencyFmt.format(m.expense)}</td>
                          <td className="py-1 text-right">{currencyFmt.format(m.income - m.expense)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        <DataTable
          columns={columns}
          data={data?.details ?? []}
          searchKey="transactionNo"
          searchPlaceholder="Filter by transaction no..."
          isLoading={isLoading}
          emptyMessage="No financial data found."
        />
      </div>
    </PermissionGate>
  );
}
