"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

import { fetchApi } from "@/lib/api";
import { DataTable } from "@/components/data-display/data-table";
import { CurrencyDisplay } from "@/components/data-display/currency-display";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";

interface GRN {
  id: number;
  grnNo: string;
  grnDate: string;
  vendorInvoice: string | null;
  description: string | null;
  totalAmount: number;
  supplierId: number;
  poNo: string | null;
  supplier?: { id: number; name: string };
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

export default function GrnPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [supplierFilter, setSupplierFilter] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [targetGrn, setTargetGrn] = React.useState<GRN | null>(null);

  const buildParams = () => {
    const params = new URLSearchParams({ pageSize: "200" });
    if (search) params.set("search", search);
    if (supplierFilter) params.set("supplierId", supplierFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("sortBy", "grnDate");
    params.set("sortOrder", "desc");
    return params.toString();
  };

  const { data: grnsData, isLoading } = useQuery({
    queryKey: ["grns", search, supplierFilter, dateFrom, dateTo],
    queryFn: () => fetchApi<PaginatedResponse<GRN>>(`/api/warehouse/grn?${buildParams()}`),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-lookup"],
    queryFn: () =>
      fetchApi<PaginatedResponse<SupplierLookup>>("/api/setup/suppliers?pageSize=500").then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/api/warehouse/grn/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grns"] });
      toast.success("GRN deleted successfully");
      setDeleteDialogOpen(false);
      setTargetGrn(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: ColumnDef<GRN, unknown>[] = [
    { accessorKey: "grnNo", header: "GRN No" },
    {
      accessorKey: "grnDate",
      header: "Date",
      cell: ({ row }) => {
        try { return format(new Date(row.original.grnDate), "dd/MM/yyyy"); }
        catch { return row.original.grnDate; }
      },
    },
    { accessorKey: "vendorInvoice", header: "Vendor Invoice", cell: ({ row }) => row.original.vendorInvoice ?? "-" },
    {
      id: "supplierName",
      header: "Supplier",
      accessorFn: (row) => row.supplier?.name ?? "-",
    },
    { accessorKey: "poNo", header: "PO No", cell: ({ row }) => row.original.poNo ?? "-" },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.totalAmount)} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const grn = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" title="View/Edit" onClick={(e) => { e.stopPropagation(); router.push(`/warehouse/grn/${grn.id}`); }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Delete" onClick={(e) => { e.stopPropagation(); setTargetGrn(grn); setDeleteDialogOpen(true); }}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Goods Received Notes</h1>
          <p className="text-sm text-zinc-500">{grnsData?.total ?? 0} GRNs total</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search GRN no, vendor invoice..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-[250px]" />
        <Select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="h-8 w-[180px]">
          <SelectOption value="">All Suppliers</SelectOption>
          {suppliers.map((s) => <SelectOption key={s.id} value={String(s.id)}>{s.name}</SelectOption>)}
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-[140px]" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-[140px]" />
      </div>

      <DataTable
        columns={columns}
        data={grnsData?.data ?? []}
        searchKey="grnNo"
        searchPlaceholder="Filter by GRN no..."
        isLoading={isLoading}
        emptyMessage="No GRNs found."
        onRowClick={(row) => router.push(`/warehouse/grn/${row.id}`)}
        toolbarActions={
          <Button size="sm" onClick={() => router.push("/warehouse/grn/new")}>
            <Plus className="mr-2 h-4 w-4" />New GRN
          </Button>
        }
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete GRN"
        description={`Are you sure you want to delete GRN "${targetGrn?.grnNo}"? This action cannot be undone.`}
        onConfirm={() => targetGrn && deleteMutation.mutate(targetGrn.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
