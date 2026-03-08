"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

import { fetchApi } from "@/lib/api";
import { DataTable, ColorRule } from "@/components/data-display/data-table";
import { StatusBadge } from "@/components/data-display/status-badge";
import { CurrencyDisplay } from "@/components/data-display/currency-display";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";

// --- Types ---

interface Quotation {
  id: number;
  quotationNo: string;
  quotationDate: string;
  description: string | null;
  status: string;
  netAmount: number;
  grossTotal: number;
  customerId: number;
  customer?: { id: number; name: string };
  details?: unknown[];
  _count?: { details: number };
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface CustomerLookup {
  id: number;
  name: string;
}

const quotationStatusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  quotation: { label: "Quotation", variant: "secondary" },
  submitted: { label: "Submitted", variant: "success" },
  project: { label: "Project", variant: "default" },
  archived: { label: "Archived", variant: "warning" },
};

// --- Component ---

export default function QuotationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [customerFilter, setCustomerFilter] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = React.useState(false);
  const [targetQuotation, setTargetQuotation] = React.useState<Quotation | null>(null);

  // --- Data fetching ---

  const buildParams = () => {
    const params = new URLSearchParams({ pageSize: "200" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (customerFilter) params.set("customerId", customerFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("sortBy", "quotationDate");
    params.set("sortOrder", "desc");
    return params.toString();
  };

  const { data: quotationsData, isLoading } = useQuery({
    queryKey: ["quotations", search, statusFilter, customerFilter, dateFrom, dateTo],
    queryFn: () => fetchApi<PaginatedResponse<Quotation>>(`/api/sales/quotations?${buildParams()}`),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-lookup"],
    queryFn: () =>
      fetchApi<PaginatedResponse<CustomerLookup>>("/api/setup/customers?pageSize=500").then((r) => r.data),
  });

  // --- Mutations ---

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/api/sales/quotations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation deleted successfully");
      setDeleteDialogOpen(false);
      setTargetQuotation(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submitMutation = useMutation({
    mutationFn: (id: number) =>
      fetchApi(`/api/sales/quotations/${id}/submit`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation submitted successfully");
      setSubmitDialogOpen(false);
      setTargetQuotation(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reviseMutation = useMutation({
    mutationFn: (id: number) =>
      fetchApi<Quotation>(`/api/sales/quotations/${id}/revise`, { method: "POST" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation revised - opening new copy");
      router.push(`/sales/quotations/${data.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // --- Handlers ---

  function handleDelete(quotation: Quotation) {
    setTargetQuotation(quotation);
    setDeleteDialogOpen(true);
  }

  function handleSubmit(quotation: Quotation) {
    setTargetQuotation(quotation);
    setSubmitDialogOpen(true);
  }

  function handleRevise(quotation: Quotation) {
    reviseMutation.mutate(quotation.id);
  }

  // --- Columns ---

  const columns: ColumnDef<Quotation, unknown>[] = [
    { accessorKey: "quotationNo", header: "Quotation No" },
    {
      accessorKey: "quotationDate",
      header: "Date",
      cell: ({ row }) => {
        try {
          return format(new Date(row.original.quotationDate), "dd/MM/yyyy");
        } catch {
          return row.original.quotationDate;
        }
      },
    },
    {
      id: "customerName",
      header: "Customer",
      accessorFn: (row) => row.customer?.name ?? "-",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate block">
          {row.original.description ?? "-"}
        </span>
      ),
    },
    {
      id: "itemsCount",
      header: "Items",
      cell: ({ row }) => {
        const count = row.original._count?.details ?? row.original.details?.length ?? 0;
        return count;
      },
    },
    {
      accessorKey: "netAmount",
      header: "Net Amount",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.netAmount)} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} statusMap={quotationStatusMap} />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const q = row.original;
        const isQuotation = q.status === "QUOTATION";
        const isSubmitted = q.status === "SUBMITTED";
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="View/Edit"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/sales/quotations/${q.id}`);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {isQuotation && (
              <Button
                variant="ghost"
                size="icon"
                title="Submit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmit(q);
                }}
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
            )}
            {(isSubmitted || isQuotation) && (
              <Button
                variant="ghost"
                size="icon"
                title="Revise"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRevise(q);
                }}
              >
                <Copy className="h-4 w-4 text-blue-600" />
              </Button>
            )}
            {isQuotation && (
              <Button
                variant="ghost"
                size="icon"
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(q);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const colorRules: ColorRule<Quotation>[] = [
    { condition: (row) => row.status === "SUBMITTED", className: "bg-green-50 dark:bg-green-950/20" },
    { condition: (row) => row.status === "PROJECT", className: "bg-blue-50 dark:bg-blue-950/20" },
    { condition: (row) => row.status === "ARCHIVED", className: "bg-gray-50/80 dark:bg-gray-900/30 opacity-75" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sales Quotations</h1>
          <p className="text-sm text-zinc-500">
            {quotationsData?.total ?? 0} quotations total
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search quotation no, customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-[250px]"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 w-[150px]"
        >
          <SelectOption value="">All Status</SelectOption>
          <SelectOption value="QUOTATION">Quotation</SelectOption>
          <SelectOption value="SUBMITTED">Submitted</SelectOption>
          <SelectOption value="PROJECT">Project</SelectOption>
          <SelectOption value="ARCHIVED">Archived</SelectOption>
        </Select>
        <Select
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="h-8 w-[180px]"
        >
          <SelectOption value="">All Customers</SelectOption>
          {customers.map((c) => (
            <SelectOption key={c.id} value={String(c.id)}>
              {c.name}
            </SelectOption>
          ))}
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-8 w-[140px]"
          placeholder="From date"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-8 w-[140px]"
          placeholder="To date"
        />
      </div>

      <DataTable
        columns={columns}
        data={quotationsData?.data ?? []}
        searchKey="quotationNo"
        searchPlaceholder="Filter by quotation no..."
        isLoading={isLoading}
        emptyMessage="No quotations found."
        colorRules={colorRules}
        onRowClick={(row) => router.push(`/sales/quotations/${row.id}`)}
        toolbarActions={
          <Button size="sm" onClick={() => router.push("/sales/quotations/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Quotation
          </Button>
        }
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Quotation"
        description={`Are you sure you want to delete quotation "${targetQuotation?.quotationNo}"? This action cannot be undone.`}
        onConfirm={() => targetQuotation && deleteMutation.mutate(targetQuotation.id)}
        isLoading={deleteMutation.isPending}
      />

      {/* Submit Confirmation */}
      <ConfirmDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        title="Submit Quotation"
        description={`Are you sure you want to submit quotation "${targetQuotation?.quotationNo}"? Once submitted, it cannot be directly edited.`}
        confirmLabel="Submit"
        onConfirm={() => targetQuotation && submitMutation.mutate(targetQuotation.id)}
        isLoading={submitMutation.isPending}
        variant="default"
      />
    </div>
  );
}
