"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format, isPast } from "date-fns";

import { fetchApi } from "@/lib/api";
import { DataTable, ColorRule } from "@/components/data-display/data-table";
import { CurrencyDisplay } from "@/components/data-display/currency-display";
import { Transaction } from "@/components/accounting/transaction-form";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";

// --- Types ---

interface ProjectItem {
  id: number;
  projectNo: string;
  name: string;
}

// --- Component ---

export default function ExpectedReceivablesPage() {
  const [projectFilter, setProjectFilter] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const buildParams = () => {
    const params = new URLSearchParams();
    params.set("category", "INCOME");
    params.set("isArchived", "false");
    if (projectFilter) params.set("projectNo", projectFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params.toString();
  };

  const { data: allTransactionsResponse, isLoading } = useQuery({
    queryKey: ["expected-receivables", projectFilter, dateFrom, dateTo],
    queryFn: () => fetchApi<{ data: Transaction[] }>(`/api/accounting/transactions?pageSize=1000&${buildParams()}`),
  });
  const allTransactions = allTransactionsResponse?.data ?? [];

  // Filter to only expected: actualDate is null, expectedDate is not null
  const transactions = React.useMemo(
    () => allTransactions.filter((t) => !t.actualDate && t.expectedDate),
    [allTransactions]
  );

  const { data: projectsResponse } = useQuery({
    queryKey: ["acc-projects-lookup"],
    queryFn: () => fetchApi<{ data: ProjectItem[] }>("/api/accounting/acc-projects?pageSize=1000"),
  });
  const projects = projectsResponse?.data ?? [];

  const columns: ColumnDef<Transaction, unknown>[] = [
    { accessorKey: "transactionNo", header: "Transaction No" },
    {
      accessorKey: "expectedDate",
      header: "Expected Date",
      cell: ({ row }) => {
        const date = row.original.expectedDate;
        if (!date) return "-";
        try {
          return format(new Date(date), "dd/MM/yyyy");
        } catch {
          return date;
        }
      },
    },
    {
      id: "project",
      header: "Project",
      accessorFn: (row) => row.project?.projectNo ?? row.projectNo ?? "-",
    },
    {
      id: "purpose",
      header: "Purpose",
      accessorFn: (row) => row.purpose?.name ?? row.purposeCode ?? "-",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="max-w-[250px] truncate block">{row.original.description ?? "-"}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.amount)} />,
    },
  ];

  const colorRules: ColorRule<Transaction>[] = [
    {
      condition: (row) => {
        if (!row.expectedDate) return false;
        return isPast(new Date(row.expectedDate));
      },
      className: "bg-red-50 dark:bg-red-950/20",
    },
  ];

  // Calculate total expected
  const totalExpected = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Expected Receivables</h1>
          <p className="text-sm text-zinc-500">
            {transactions.length} upcoming receipts
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

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 w-fit">
        <p className="text-xs text-zinc-500">Total Expected</p>
        <CurrencyDisplay amount={totalExpected} className="text-lg font-semibold" />
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        searchKey="transactionNo"
        searchPlaceholder="Filter by transaction no..."
        isLoading={isLoading}
        emptyMessage="No expected receivables found."
        colorRules={colorRules}
      />
    </div>
  );
}
