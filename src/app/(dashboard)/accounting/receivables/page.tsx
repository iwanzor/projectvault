"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Lock, Archive } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { fetchApi } from "@/lib/api";
import { DataTable, ColorRule } from "@/components/data-display/data-table";
import { CurrencyDisplay } from "@/components/data-display/currency-display";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { TransactionForm, Transaction, TransactionFormData } from "@/components/accounting/transaction-form";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";

// --- Types ---

interface SelectItem {
  id: number;
  code?: string;
  name: string;
}

interface ProjectItem {
  id: number;
  projectNo: string;
  name: string;
}

interface TransactionSummary {
  totalAmount: number;
  totalAmountPaid: number;
  totalAmountLeft: number;
}

// --- Component ---

export default function ReceivablesPage() {
  const queryClient = useQueryClient();
  const [projectFilter, setProjectFilter] = React.useState("");
  const [purposeFilter, setPurposeFilter] = React.useState("");
  const [channelFilter, setChannelFilter] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [lockDialogOpen, setLockDialogOpen] = React.useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = React.useState(false);
  const [targetTransaction, setTargetTransaction] = React.useState<Transaction | null>(null);
  const [lockDescription, setLockDescription] = React.useState("");
  const [archiveDescription, setArchiveDescription] = React.useState("");

  // --- Data fetching ---

  const buildParams = () => {
    const params = new URLSearchParams();
    params.set("category", "INCOME");
    params.set("isArchived", "false");
    if (projectFilter) params.set("projectNo", projectFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params.toString();
  };

  const { data: transactionsResponse, isLoading } = useQuery({
    queryKey: ["receivables", projectFilter, purposeFilter, channelFilter, dateFrom, dateTo],
    queryFn: () => fetchApi<{ data: Transaction[] }>(`/api/accounting/transactions?pageSize=1000&${buildParams()}`),
  });
  const transactions = transactionsResponse?.data ?? [];

  const { data: summary } = useQuery({
    queryKey: ["receivables-summary", dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("category", "INCOME");
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      return fetchApi<TransactionSummary>(`/api/accounting/transactions/summary?${params.toString()}`);
    },
  });

  const { data: projectsResponse } = useQuery({
    queryKey: ["acc-projects-lookup"],
    queryFn: () => fetchApi<{ data: ProjectItem[] }>("/api/accounting/acc-projects?pageSize=1000"),
  });
  const projects = projectsResponse?.data ?? [];

  const { data: purposesResponse } = useQuery({
    queryKey: ["purposes-lookup"],
    queryFn: () => fetchApi<{ data: SelectItem[] }>("/api/accounting/purposes?pageSize=1000"),
  });
  const purposes = purposesResponse?.data ?? [];

  const { data: paymentChannelsResponse } = useQuery({
    queryKey: ["payment-channels-lookup"],
    queryFn: () => fetchApi<{ data: SelectItem[] }>("/api/accounting/payment-channels?pageSize=1000"),
  });
  const paymentChannels = paymentChannelsResponse?.data ?? [];

  // --- Filtered data ---

  const filteredTransactions = React.useMemo(() => {
    let result = transactions;
    if (purposeFilter) {
      result = result.filter((t) => t.purposeCode === purposeFilter);
    }
    if (channelFilter) {
      result = result.filter((t) => t.paymentChannelCode === channelFilter);
    }
    return result;
  }, [transactions, purposeFilter, channelFilter]);

  // --- Mutations ---

  const createMutation = useMutation({
    mutationFn: (data: TransactionFormData) =>
      fetchApi("/api/accounting/transactions", {
        method: "POST",
        body: JSON.stringify({ ...data, category: "INCOME" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      queryClient.invalidateQueries({ queryKey: ["receivables-summary"] });
      toast.success("Receivable transaction created");
      setFormOpen(false);
      setEditingTransaction(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransactionFormData }) =>
      fetchApi(`/api/accounting/transactions/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...data, category: "INCOME" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      queryClient.invalidateQueries({ queryKey: ["receivables-summary"] });
      toast.success("Receivable transaction updated");
      setFormOpen(false);
      setEditingTransaction(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/api/accounting/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      queryClient.invalidateQueries({ queryKey: ["receivables-summary"] });
      toast.success("Transaction deleted");
      setDeleteDialogOpen(false);
      setTargetTransaction(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const lockMutation = useMutation({
    mutationFn: ({ id, descriptionLock }: { id: number; descriptionLock: string }) =>
      fetchApi(`/api/accounting/transactions/${id}/lock`, {
        method: "POST",
        body: JSON.stringify({ descriptionLock }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      toast.success("Transaction locked");
      setLockDialogOpen(false);
      setTargetTransaction(null);
      setLockDescription("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, descriptionArchive }: { id: number; descriptionArchive: string }) =>
      fetchApi(`/api/accounting/transactions/${id}/archive`, {
        method: "POST",
        body: JSON.stringify({ descriptionArchive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      queryClient.invalidateQueries({ queryKey: ["receivables-summary"] });
      toast.success("Transaction archived");
      setArchiveDialogOpen(false);
      setTargetTransaction(null);
      setArchiveDescription("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // --- Handlers ---

  function handleCreate() {
    setEditingTransaction(null);
    setFormOpen(true);
  }

  function handleEdit(transaction: Transaction) {
    setEditingTransaction(transaction);
    setFormOpen(true);
  }

  function handleFormSubmit(data: TransactionFormData) {
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  // --- Columns ---

  const columns: ColumnDef<Transaction, unknown>[] = [
    { accessorKey: "transactionNo", header: "Transaction No" },
    {
      accessorKey: "actualDate",
      header: "Date",
      cell: ({ row }) => {
        const date = row.original.actualDate;
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
      id: "paymentChannel",
      header: "Channel",
      accessorFn: (row) => row.paymentChannel?.name ?? row.paymentChannelCode ?? "-",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.amount)} />,
    },
    {
      accessorKey: "amountPaid",
      header: "Received",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.amountPaid)} />,
    },
    {
      accessorKey: "amountLeft",
      header: "Left",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.amountLeft)} />,
    },
    {
      accessorKey: "isLocked",
      header: "Locked",
      cell: ({ row }) =>
        row.original.isLocked ? (
          <Lock className="h-4 w-4 text-amber-500" />
        ) : (
          <span className="text-zinc-400">-</span>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="flex items-center gap-1">
            <PermissionGate module="ACCOUNT" action="edit">
              <Button
                variant="ghost"
                size="icon"
                title="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(t);
                }}
                disabled={t.isLocked}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </PermissionGate>
            {!t.isLocked && (
              <PermissionGate module="ACCOUNT" action="edit">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Lock"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTargetTransaction(t);
                    setLockDialogOpen(true);
                  }}
                >
                  <Lock className="h-4 w-4 text-amber-500" />
                </Button>
              </PermissionGate>
            )}
            <PermissionGate module="ACCOUNT" action="edit">
              <Button
                variant="ghost"
                size="icon"
                title="Archive"
                onClick={(e) => {
                  e.stopPropagation();
                  setTargetTransaction(t);
                  setArchiveDialogOpen(true);
                }}
              >
                <Archive className="h-4 w-4 text-blue-500" />
              </Button>
            </PermissionGate>
            {!t.isLocked && (
              <PermissionGate module="ACCOUNT" action="delete">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTargetTransaction(t);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </PermissionGate>
            )}
          </div>
        );
      },
    },
  ];

  const colorRules: ColorRule<Transaction>[] = [
    { condition: (row) => row.isLocked, className: "bg-amber-50/50 dark:bg-amber-950/10" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Account Receivables</h1>
          <p className="text-sm text-zinc-500">
            {filteredTransactions.length} transactions
          </p>
        </div>
      </div>

      {/* Filters */}
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
        <Select
          value={purposeFilter}
          onChange={(e) => setPurposeFilter(e.target.value)}
          className="h-8 w-[160px]"
        >
          <SelectOption value="">All Purposes</SelectOption>
          {purposes.map((p) => (
            <SelectOption key={p.id} value={p.code ?? String(p.id)}>
              {p.name}
            </SelectOption>
          ))}
        </Select>
        <Select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="h-8 w-[170px]"
        >
          <SelectOption value="">All Channels</SelectOption>
          {paymentChannels.map((c) => (
            <SelectOption key={c.id} value={c.code ?? String(c.id)}>
              {c.name}
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

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-xs text-zinc-500">Total Amount</p>
            <CurrencyDisplay amount={summary.totalAmount} className="text-lg font-semibold" />
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-xs text-zinc-500">Total Received</p>
            <CurrencyDisplay amount={summary.totalAmountPaid} className="text-lg font-semibold" />
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-xs text-zinc-500">Total Outstanding</p>
            <CurrencyDisplay amount={summary.totalAmountLeft} className="text-lg font-semibold" />
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredTransactions}
        searchKey="transactionNo"
        searchPlaceholder="Filter by transaction no..."
        isLoading={isLoading}
        emptyMessage="No receivable transactions found."
        colorRules={colorRules}
        toolbarActions={
          <PermissionGate module="ACCOUNT" action="add">
            <Button size="sm" onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Receipt
            </Button>
          </PermissionGate>
        }
      />

      {/* Transaction Form */}
      <TransactionForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTransaction(null);
        }}
        title={editingTransaction ? "Edit Receivable Transaction" : "New Receivable Transaction"}
        defaultValues={
          editingTransaction
            ? {
                projectNo: editingTransaction.projectNo ?? "",
                purposeCode: editingTransaction.purposeCode ?? "",
                description: editingTransaction.description ?? "",
                paymentChannelCode: editingTransaction.paymentChannelCode ?? "",
                bankCode: editingTransaction.bankCode ?? "",
                accountNo: editingTransaction.accountNo ?? "",
                paymentTypeCode: editingTransaction.paymentTypeCode ?? "",
                currency: editingTransaction.currency ?? "AED",
                amount: Number(editingTransaction.amount),
                amountPaid: Number(editingTransaction.amountPaid),
                bankDocNo: editingTransaction.bankDocNo ?? "",
                expectedDate: editingTransaction.expectedDate?.split("T")[0] ?? "",
                actualDate: editingTransaction.actualDate?.split("T")[0] ?? "",
                internalDocNo: editingTransaction.internalDocNo ?? "",
              }
            : undefined
        }
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Transaction"
        description={`Are you sure you want to delete transaction "${targetTransaction?.transactionNo}"? This action cannot be undone.`}
        onConfirm={() => targetTransaction && deleteMutation.mutate(targetTransaction.id)}
        isLoading={deleteMutation.isPending}
      />

      {/* Lock Dialog */}
      <ConfirmDialog
        open={lockDialogOpen}
        onOpenChange={(open) => {
          setLockDialogOpen(open);
          if (!open) setLockDescription("");
        }}
        title="Lock Transaction"
        description={`Lock transaction "${targetTransaction?.transactionNo}"? Locked transactions cannot be edited.`}
        confirmLabel="Lock"
        onConfirm={() =>
          targetTransaction && lockMutation.mutate({ id: targetTransaction.id, descriptionLock: lockDescription })
        }
        isLoading={lockMutation.isPending}
        variant="default"
      />

      {/* Archive Dialog */}
      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={(open) => {
          setArchiveDialogOpen(open);
          if (!open) setArchiveDescription("");
        }}
        title="Archive Transaction"
        description={`Archive transaction "${targetTransaction?.transactionNo}"? Archived transactions will be moved to the archive.`}
        confirmLabel="Archive"
        onConfirm={() =>
          targetTransaction && archiveMutation.mutate({ id: targetTransaction.id, descriptionArchive: archiveDescription })
        }
        isLoading={archiveMutation.isPending}
        variant="default"
      />
    </div>
  );
}
