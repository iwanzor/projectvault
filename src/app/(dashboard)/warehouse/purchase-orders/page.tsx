"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Check, PackageCheck } from "lucide-react";
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

interface PurchaseOrder {
  id: number;
  poNo: string;
  poDate: string;
  description: string | null;
  status: string;
  totalAmount: number;
  grossTotal: number;
  supplierId: number;
  projectNo: string | null;
  supplier?: { id: number; name: string };
  project?: { id: number; projectNo: string; name: string } | null;
  _count?: { details: number };
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface SupplierLookup {
  id: number;
  name: string;
}

const poStatusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  draft: { label: "Draft", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  received: { label: "Received", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [supplierFilter, setSupplierFilter] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = React.useState(false);
  const [targetPO, setTargetPO] = React.useState<PurchaseOrder | null>(null);

  const buildParams = () => {
    const params = new URLSearchParams({ pageSize: "200" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (supplierFilter) params.set("supplierId", supplierFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("sortBy", "poDate");
    params.set("sortOrder", "desc");
    return params.toString();
  };

  const { data: posData, isLoading } = useQuery({
    queryKey: ["purchase-orders", search, statusFilter, supplierFilter, dateFrom, dateTo],
    queryFn: () => fetchApi<PaginatedResponse<PurchaseOrder>>(`/api/warehouse/purchase-orders?${buildParams()}`),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-lookup"],
    queryFn: () =>
      fetchApi<PaginatedResponse<SupplierLookup>>("/api/setup/suppliers?pageSize=500").then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/api/warehouse/purchase-orders/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order deleted successfully");
      setDeleteDialogOpen(false);
      setTargetPO(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) =>
      fetchApi(`/api/warehouse/purchase-orders/${id}/approve`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order approved");
      setApproveDialogOpen(false);
      setTargetPO(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const receiveMutation = useMutation({
    mutationFn: (id: number) =>
      fetchApi(`/api/warehouse/purchase-orders/${id}/receive`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order marked as received");
      setReceiveDialogOpen(false);
      setTargetPO(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: ColumnDef<PurchaseOrder, unknown>[] = [
    { accessorKey: "poNo", header: "PO No" },
    {
      accessorKey: "poDate",
      header: "Date",
      cell: ({ row }) => {
        try {
          return format(new Date(row.original.poDate), "dd/MM/yyyy");
        } catch {
          return row.original.poDate;
        }
      },
    },
    {
      id: "supplierName",
      header: "Supplier",
      accessorFn: (row) => row.supplier?.name ?? "-",
    },
    {
      id: "projectNo",
      header: "Project",
      accessorFn: (row) => row.project?.projectNo ?? row.projectNo ?? "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} statusMap={poStatusMap} />
      ),
    },
    {
      accessorKey: "grossTotal",
      header: "Total",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.grossTotal)} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const po = row.original;
        const isDraft = po.status === "DRAFT";
        const isApproved = po.status === "APPROVED";
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="View/Edit"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/warehouse/purchase-orders/${po.id}`);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {isDraft && (
              <Button
                variant="ghost"
                size="icon"
                title="Approve"
                onClick={(e) => {
                  e.stopPropagation();
                  setTargetPO(po);
                  setApproveDialogOpen(true);
                }}
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
            )}
            {isApproved && (
              <Button
                variant="ghost"
                size="icon"
                title="Receive"
                onClick={(e) => {
                  e.stopPropagation();
                  setTargetPO(po);
                  setReceiveDialogOpen(true);
                }}
              >
                <PackageCheck className="h-4 w-4 text-blue-600" />
              </Button>
            )}
            {isDraft && (
              <Button
                variant="ghost"
                size="icon"
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  setTargetPO(po);
                  setDeleteDialogOpen(true);
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

  const colorRules: ColorRule<PurchaseOrder>[] = [
    { condition: (row) => row.status === "APPROVED", className: "bg-blue-50 dark:bg-blue-950/20" },
    { condition: (row) => row.status === "RECEIVED", className: "bg-green-50 dark:bg-green-950/20" },
    { condition: (row) => row.status === "CANCELLED", className: "bg-gray-50/80 dark:bg-gray-900/30 opacity-75" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Purchase Orders</h1>
          <p className="text-sm text-zinc-500">
            {posData?.total ?? 0} purchase orders total
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search PO no, supplier..."
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
          <SelectOption value="DRAFT">Draft</SelectOption>
          <SelectOption value="APPROVED">Approved</SelectOption>
          <SelectOption value="RECEIVED">Received</SelectOption>
          <SelectOption value="CANCELLED">Cancelled</SelectOption>
        </Select>
        <Select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="h-8 w-[180px]"
        >
          <SelectOption value="">All Suppliers</SelectOption>
          {suppliers.map((s) => (
            <SelectOption key={s.id} value={String(s.id)}>
              {s.name}
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
        data={posData?.data ?? []}
        searchKey="poNo"
        searchPlaceholder="Filter by PO no..."
        isLoading={isLoading}
        emptyMessage="No purchase orders found."
        colorRules={colorRules}
        onRowClick={(row) => router.push(`/warehouse/purchase-orders/${row.id}`)}
        toolbarActions={
          <Button size="sm" onClick={() => router.push("/warehouse/purchase-orders/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Purchase Order
          </Button>
        }
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Purchase Order"
        description={`Are you sure you want to delete purchase order "${targetPO?.poNo}"? This action cannot be undone.`}
        onConfirm={() => targetPO && deleteMutation.mutate(targetPO.id)}
        isLoading={deleteMutation.isPending}
      />

      <ConfirmDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        title="Approve Purchase Order"
        description={`Are you sure you want to approve purchase order "${targetPO?.poNo}"?`}
        confirmLabel="Approve"
        onConfirm={() => targetPO && approveMutation.mutate(targetPO.id)}
        isLoading={approveMutation.isPending}
        variant="default"
      />

      <ConfirmDialog
        open={receiveDialogOpen}
        onOpenChange={setReceiveDialogOpen}
        title="Receive Purchase Order"
        description={`Mark purchase order "${targetPO?.poNo}" as received?`}
        confirmLabel="Receive"
        onConfirm={() => targetPO && receiveMutation.mutate(targetPO.id)}
        isLoading={receiveMutation.isPending}
        variant="default"
      />
    </div>
  );
}
