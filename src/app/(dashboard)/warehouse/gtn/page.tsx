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

interface GTN {
  id: number;
  gtnNo: string;
  gtnDate: string;
  fromProjectNo: string | null;
  toProjectNo: string | null;
  requestedBy: string | null;
  approvedBy: string | null;
  description: string | null;
  totalAmount: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export default function GtnPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [targetGtn, setTargetGtn] = React.useState<GTN | null>(null);

  const buildParams = () => {
    const params = new URLSearchParams({ pageSize: "200" });
    if (search) params.set("search", search);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("sortBy", "gtnDate");
    params.set("sortOrder", "desc");
    return params.toString();
  };

  const { data: gtnsData, isLoading } = useQuery({
    queryKey: ["gtns", search, dateFrom, dateTo],
    queryFn: () => fetchApi<PaginatedResponse<GTN>>(`/api/warehouse/gtn?${buildParams()}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/api/warehouse/gtn/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gtns"] });
      toast.success("GTN deleted successfully");
      setDeleteDialogOpen(false);
      setTargetGtn(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: ColumnDef<GTN, unknown>[] = [
    { accessorKey: "gtnNo", header: "GTN No" },
    {
      accessorKey: "gtnDate",
      header: "Date",
      cell: ({ row }) => {
        try { return format(new Date(row.original.gtnDate), "dd/MM/yyyy"); }
        catch { return row.original.gtnDate; }
      },
    },
    { accessorKey: "fromProjectNo", header: "From Project", cell: ({ row }) => row.original.fromProjectNo ?? "-" },
    { accessorKey: "toProjectNo", header: "To Project", cell: ({ row }) => row.original.toProjectNo ?? "-" },
    { accessorKey: "requestedBy", header: "Requested By", cell: ({ row }) => row.original.requestedBy ?? "-" },
    { accessorKey: "approvedBy", header: "Approved By", cell: ({ row }) => row.original.approvedBy ?? "-" },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.totalAmount)} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const gtn = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" title="View/Edit" onClick={(e) => { e.stopPropagation(); router.push(`/warehouse/gtn/${gtn.id}`); }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Delete" onClick={(e) => { e.stopPropagation(); setTargetGtn(gtn); setDeleteDialogOpen(true); }}>
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
          <h1 className="text-2xl font-semibold">Goods Transfer Notes</h1>
          <p className="text-sm text-zinc-500">{gtnsData?.total ?? 0} GTNs total</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search GTN no, project..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-[250px]" />
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-[140px]" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-[140px]" />
      </div>

      <DataTable
        columns={columns}
        data={gtnsData?.data ?? []}
        searchKey="gtnNo"
        searchPlaceholder="Filter by GTN no..."
        isLoading={isLoading}
        emptyMessage="No GTNs found."
        onRowClick={(row) => router.push(`/warehouse/gtn/${row.id}`)}
        toolbarActions={
          <Button size="sm" onClick={() => router.push("/warehouse/gtn/new")}>
            <Plus className="mr-2 h-4 w-4" />New GTN
          </Button>
        }
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete GTN"
        description={`Are you sure you want to delete GTN "${targetGtn?.gtnNo}"? This action cannot be undone.`}
        onConfirm={() => targetGtn && deleteMutation.mutate(targetGtn.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
