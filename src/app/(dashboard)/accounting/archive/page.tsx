"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { fetchApi } from "@/lib/api";
import { DataTable, ColorRule } from "@/components/data-display/data-table";
import { CurrencyDisplay } from "@/components/data-display/currency-display";
import { StatusBadge } from "@/components/data-display/status-badge";
import { Transaction } from "@/components/accounting/transaction-form";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";

// --- Types ---

interface ProjectItem {
  id: number;
  projectNo: string;
  name: string;
}

const categoryStatusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  income: { label: "Income", variant: "success" },
  expense: { label: "Expense", variant: "destructive" },
};

// --- Component ---

export default function ArchivePage() {
  const [projectFilter, setProjectFilter] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const buildParams = () => {
    const params = new URLSearchParams();
    params.set("isArchived", "true");
    if (categoryFilter) params.set("category", categoryFilter);
    if (projectFilter) params.set("projectNo", projectFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params.toString();
  };

  const { data: transactionsResponse, isLoading } = useQuery({
    queryKey: ["archived-transactions", projectFilter, categoryFilter, dateFrom, dateTo],
    queryFn: () => fetchApi<{ data: Transaction[] }>(`/api/accounting/transactions?pageSize=1000&${buildParams()}`),
  });
  const transactions = transactionsResponse?.data ?? [];

  const { data: projectsResponse } = useQuery({
    queryKey: ["acc-projects-lookup"],
    queryFn: () => fetchApi<{ data: ProjectItem[] }>("/api/accounting/acc-projects?pageSize=1000"),
  });
  const projects = projectsResponse?.data ?? [];

  const columns: ColumnDef<Transaction, unknown>[] = [
    { accessorKey: "transactionNo", header: "Transaction No" },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <StatusBadge status={row.original.category} statusMap={categoryStatusMap} />
      ),
    },
    {
      accessorKey: "actualDate",
      header: "Date",
      cell: ({ row }) => {
        const date = row.original.actualDate ?? row.original.expectedDate;
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
        <span className="max-w-[200px] truncate block">{row.original.description ?? "-"}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.amount)} />,
    },
    {
      accessorKey: "amountPaid",
      header: "Paid",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.amountPaid)} />,
    },
    {
      accessorKey: "descriptionArchive",
      header: "Archive Reason",
      cell: ({ row }) => (
        <span className="max-w-[150px] truncate block">{row.original.descriptionArchive ?? "-"}</span>
      ),
    },
  ];

  const colorRules: ColorRule<Transaction>[] = [
    { condition: (row) => row.category === "INCOME", className: "bg-green-50/50 dark:bg-green-950/10" },
    { condition: (row) => row.category === "EXPENSE", className: "bg-red-50/50 dark:bg-red-950/10" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Archived Transactions</h1>
          <p className="text-sm text-zinc-500">
            {transactions.length} archived transactions (read-only)
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-8 w-[150px]"
        >
          <SelectOption value="">All Categories</SelectOption>
          <SelectOption value="INCOME">Income</SelectOption>
          <SelectOption value="EXPENSE">Expense</SelectOption>
        </Select>
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
        data={transactions}
        searchKey="transactionNo"
        searchPlaceholder="Filter by transaction no..."
        isLoading={isLoading}
        emptyMessage="No archived transactions found."
        colorRules={colorRules}
      />
    </div>
  );
}
