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

interface GRRN {
  id: number;
  grrnNo: string;
  grrnDate: string;
  returnedBy: string | null;
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

export default function GrrnPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [targetGrrn, setTargetGrrn] = React.useState<GRRN | null>(null);

  const buildParams = () => {
    const params = new URLSearchParams({ pageSize: "200" });
    if (search) params.set("search", search);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("sortBy", "grrnDate");
    params.set("sortOrder", "desc");
    return params.toString();
  };

  const { data: grrnsData, isLoading } = useQuery({
    queryKey: ["grrns", search, dateFrom, dateTo],
    queryFn: () => fetchApi<PaginatedResponse<GRRN>>(`/api/warehouse/grrn?${buildParams()}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/api/warehouse/grrn/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grrns"] });
      toast.success("GRRN deleted successfully");
      setDeleteDialogOpen(false);
      setTargetGrrn(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: ColumnDef<GRRN, unknown>[] = [
    { accessorKey: "grrnNo", header: "GRRN No" },
    {
      accessorKey: "grrnDate",
      header: "Date",
      cell: ({ row }) => {
        try { return format(new Date(row.original.grrnDate), "dd/MM/yyyy"); }
        catch { return row.original.grrnDate; }
      },
    },
    { accessorKey: "returnedBy", header: "Returned By", cell: ({ row }) => row.original.returnedBy ?? "-" },
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
        const grrn = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" title="View/Edit" onClick={(e) => { e.stopPropagation(); router.push(`/warehouse/grrn/${grrn.id}`); }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Delete" onClick={(e) => { e.stopPropagation(); setTargetGrrn(grrn); setDeleteDialogOpen(true); }}>
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
          <h1 className="text-2xl font-semibold">Goods Return Notes</h1>
          <p className="text-sm text-zinc-500">{grrnsData?.total ?? 0} GRRNs total</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search GRRN no, returned by..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-[250px]" />
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-[140px]" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-[140px]" />
      </div>

      <DataTable
        columns={columns}
        data={grrnsData?.data ?? []}
        searchKey="grrnNo"
        searchPlaceholder="Filter by GRRN no..."
        isLoading={isLoading}
        emptyMessage="No GRRNs found."
        onRowClick={(row) => router.push(`/warehouse/grrn/${row.id}`)}
        toolbarActions={
          <Button size="sm" onClick={() => router.push("/warehouse/grrn/new")}>
            <Plus className="mr-2 h-4 w-4" />New GRRN
          </Button>
        }
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete GRRN"
        description={`Are you sure you want to delete GRRN "${targetGrrn?.grrnNo}"? This action cannot be undone.`}
        onConfirm={() => targetGrrn && deleteMutation.mutate(targetGrrn.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
