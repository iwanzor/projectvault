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

interface GIN {
  id: number;
  ginNo: string;
  ginDate: string;
  requestedBy: string | null;
  description: string | null;
  totalAmount: number;
  projectNo: string | null;
  project?: { id: number; projectNo: string; name: string } | null;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export default function GinPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [targetGin, setTargetGin] = React.useState<GIN | null>(null);

  const buildParams = () => {
    const params = new URLSearchParams({ pageSize: "200" });
    if (search) params.set("search", search);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("sortBy", "ginDate");
    params.set("sortOrder", "desc");
    return params.toString();
  };

  const { data: ginsData, isLoading } = useQuery({
    queryKey: ["gins", search, dateFrom, dateTo],
    queryFn: () => fetchApi<PaginatedResponse<GIN>>(`/api/warehouse/gin?${buildParams()}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/api/warehouse/gin/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gins"] });
      toast.success("GIN deleted successfully");
      setDeleteDialogOpen(false);
      setTargetGin(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: ColumnDef<GIN, unknown>[] = [
    { accessorKey: "ginNo", header: "GIN No" },
    {
      accessorKey: "ginDate",
      header: "Date",
      cell: ({ row }) => {
        try { return format(new Date(row.original.ginDate), "dd/MM/yyyy"); }
        catch { return row.original.ginDate; }
      },
    },
    { accessorKey: "requestedBy", header: "Requested By", cell: ({ row }) => row.original.requestedBy ?? "-" },
    {
      id: "projectNo",
      header: "Project",
      accessorFn: (row) => row.project?.projectNo ?? row.projectNo ?? "-",
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.totalAmount)} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const gin = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" title="View/Edit" onClick={(e) => { e.stopPropagation(); router.push(`/warehouse/gin/${gin.id}`); }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Delete" onClick={(e) => { e.stopPropagation(); setTargetGin(gin); setDeleteDialogOpen(true); }}>
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
          <h1 className="text-2xl font-semibold">Goods Issue Notes</h1>
          <p className="text-sm text-zinc-500">{ginsData?.total ?? 0} GINs total</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search GIN no, requested by..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-[250px]" />
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-[140px]" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-[140px]" />
      </div>

      <DataTable
        columns={columns}
        data={ginsData?.data ?? []}
        searchKey="ginNo"
        searchPlaceholder="Filter by GIN no..."
        isLoading={isLoading}
        emptyMessage="No GINs found."
        onRowClick={(row) => router.push(`/warehouse/gin/${row.id}`)}
        toolbarActions={
          <Button size="sm" onClick={() => router.push("/warehouse/gin/new")}>
            <Plus className="mr-2 h-4 w-4" />New GIN
          </Button>
        }
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete GIN"
        description={`Are you sure you want to delete GIN "${targetGin?.ginNo}"? This action cannot be undone.`}
        onConfirm={() => targetGin && deleteMutation.mutate(targetGin.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
