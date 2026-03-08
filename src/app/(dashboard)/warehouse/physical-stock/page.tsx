"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

import { fetchApi } from "@/lib/api";
import { DataTable } from "@/components/data-display/data-table";
import { StatusBadge } from "@/components/data-display/status-badge";
import { CurrencyDisplay } from "@/components/data-display/currency-display";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { FormDialog } from "@/components/forms/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PhysicalStock {
  id: number;
  docNo: string;
  docDate: string;
  projectNo: string | null;
  barcode: string | null;
  location: string | null;
  serialNo: string | null;
  quantity: number;
  status: string;
  state: string;
  fobAed: number;
  itemDescription: string | null;
  model: string | null;
  accessories: boolean;
}

interface StockSummary {
  barcode: string;
  itemName: string;
  projectNo: string;
  totalQty: number;
  totalFobAed: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

const stockStatusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  available: { label: "Available", variant: "success" },
  reserved: { label: "Reserved", variant: "warning" },
  issued: { label: "Issued", variant: "default" },
  damaged: { label: "Damaged", variant: "destructive" },
};

const stockSchema = z.object({
  docDate: z.string().min(1, "Date is required"),
  projectNo: z.string().optional().default(""),
  barcode: z.string().optional().default(""),
  location: z.string().optional().default(""),
  serialNo: z.string().optional().default(""),
  quantity: z.coerce.number().min(0).default(1),
  status: z.string().optional().default("AVAILABLE"),
  state: z.string().optional().default("NEW"),
  fobAed: z.coerce.number().min(0).default(0),
  itemDescription: z.string().optional().default(""),
  model: z.string().optional().default(""),
  accessories: z.boolean().default(false),
});

type StockFormData = z.infer<typeof stockSchema>;

export default function PhysicalStockPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [stateFilter, setStateFilter] = React.useState("");
  const [projectFilter, setProjectFilter] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [accessoriesOnly, setAccessoriesOnly] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [targetStock, setTargetStock] = React.useState<PhysicalStock | null>(null);
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingStock, setEditingStock] = React.useState<PhysicalStock | null>(null);
  const [showSummary, setShowSummary] = React.useState(false);

  const buildParams = () => {
    const params = new URLSearchParams({ pageSize: "200" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (stateFilter) params.set("state", stateFilter);
    if (projectFilter) params.set("projectNo", projectFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (accessoriesOnly) params.set("accessories", "true");
    params.set("sortBy", "docDate");
    params.set("sortOrder", "desc");
    return params.toString();
  };

  const { data: stockData, isLoading } = useQuery({
    queryKey: ["physical-stock", search, statusFilter, stateFilter, projectFilter, dateFrom, dateTo, accessoriesOnly],
    queryFn: () => fetchApi<PaginatedResponse<PhysicalStock>>(`/api/warehouse/physical-stock?${buildParams()}`),
  });

  const { data: summaryData } = useQuery({
    queryKey: ["stock-summary"],
    queryFn: () => fetchApi<StockSummary[]>("/api/warehouse/stock-summary"),
    enabled: showSummary,
  });

  const form = useForm<StockFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(stockSchema) as any,
    defaultValues: {
      docDate: format(new Date(), "yyyy-MM-dd"),
      projectNo: "", barcode: "", location: "", serialNo: "",
      quantity: 1, status: "AVAILABLE", state: "NEW", fobAed: 0,
      itemDescription: "", model: "", accessories: false,
    },
  });

  React.useEffect(() => {
    if (editingStock) {
      form.reset({
        docDate: editingStock.docDate?.split("T")[0] ?? "",
        projectNo: editingStock.projectNo ?? "",
        barcode: editingStock.barcode ?? "",
        location: editingStock.location ?? "",
        serialNo: editingStock.serialNo ?? "",
        quantity: Number(editingStock.quantity),
        status: editingStock.status,
        state: editingStock.state,
        fobAed: Number(editingStock.fobAed),
        itemDescription: editingStock.itemDescription ?? "",
        model: editingStock.model ?? "",
        accessories: editingStock.accessories,
      });
    } else {
      form.reset({
        docDate: format(new Date(), "yyyy-MM-dd"),
        projectNo: "", barcode: "", location: "", serialNo: "",
        quantity: 1, status: "AVAILABLE", state: "NEW", fobAed: 0,
        itemDescription: "", model: "", accessories: false,
      });
    }
  }, [editingStock, form]);

  const createMutation = useMutation({
    mutationFn: (data: StockFormData) =>
      fetchApi("/api/warehouse/physical-stock", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["physical-stock"] });
      toast.success("Stock entry created");
      setFormDialogOpen(false);
      setEditingStock(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: StockFormData) =>
      fetchApi(`/api/warehouse/physical-stock/${editingStock!.id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["physical-stock"] });
      toast.success("Stock entry updated");
      setFormDialogOpen(false);
      setEditingStock(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/api/warehouse/physical-stock/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["physical-stock"] });
      toast.success("Stock entry deleted");
      setDeleteDialogOpen(false);
      setTargetStock(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    form.handleSubmit((data) => {
      if (editingStock) {
        updateMutation.mutate(data);
      } else {
        createMutation.mutate(data);
      }
    })(e);
  }

  const columns: ColumnDef<PhysicalStock, unknown>[] = [
    { accessorKey: "docNo", header: "Doc No" },
    {
      accessorKey: "docDate",
      header: "Date",
      cell: ({ row }) => {
        try { return format(new Date(row.original.docDate), "dd/MM/yyyy"); }
        catch { return row.original.docDate; }
      },
    },
    { accessorKey: "projectNo", header: "Project", cell: ({ row }) => row.original.projectNo ?? "-" },
    { accessorKey: "barcode", header: "Barcode", cell: ({ row }) => row.original.barcode ?? "-" },
    { accessorKey: "location", header: "Location", cell: ({ row }) => row.original.location ?? "-" },
    { accessorKey: "serialNo", header: "Serial No", cell: ({ row }) => row.original.serialNo ?? "-" },
    { accessorKey: "quantity", header: "Qty", cell: ({ row }) => Number(row.original.quantity) },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} statusMap={stockStatusMap} />,
    },
    { accessorKey: "state", header: "State", cell: ({ row }) => row.original.state },
    {
      accessorKey: "fobAed",
      header: "FOB AED",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.fobAed)} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const stock = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" title="Edit" onClick={(e) => {
              e.stopPropagation();
              setEditingStock(stock);
              setFormDialogOpen(true);
            }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Delete" onClick={(e) => {
              e.stopPropagation();
              setTargetStock(stock);
              setDeleteDialogOpen(true);
            }}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  const summaryColumns: ColumnDef<StockSummary, unknown>[] = [
    { accessorKey: "barcode", header: "Barcode" },
    { accessorKey: "itemName", header: "Item Name" },
    { accessorKey: "projectNo", header: "Project" },
    { accessorKey: "totalQty", header: "Total Qty" },
    {
      accessorKey: "totalFobAed",
      header: "Total FOB AED",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.totalFobAed)} />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Physical Stock</h1>
          <p className="text-sm text-zinc-500">{stockData?.total ?? 0} stock entries total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSummary(!showSummary)}>
            {showSummary ? "Show Detail" : "Show Summary"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search barcode, serial no..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-[220px]" />
        <Input placeholder="Project" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="h-8 w-[120px]" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 w-[130px]">
          <SelectOption value="">All Status</SelectOption>
          <SelectOption value="AVAILABLE">Available</SelectOption>
          <SelectOption value="RESERVED">Reserved</SelectOption>
          <SelectOption value="ISSUED">Issued</SelectOption>
          <SelectOption value="DAMAGED">Damaged</SelectOption>
        </Select>
        <Select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="h-8 w-[120px]">
          <SelectOption value="">All State</SelectOption>
          <SelectOption value="NEW">New</SelectOption>
          <SelectOption value="USED">Used</SelectOption>
          <SelectOption value="REFURBISHED">Refurbished</SelectOption>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-[140px]" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-[140px]" />
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="checkbox" checked={accessoriesOnly} onChange={(e) => setAccessoriesOnly(e.target.checked)} className="rounded border-zinc-300" />
          Accessories
        </label>
      </div>

      {showSummary ? (
        <DataTable
          columns={summaryColumns}
          data={summaryData ?? []}
          searchKey="barcode"
          searchPlaceholder="Filter by barcode..."
          isLoading={!summaryData}
          emptyMessage="No stock summary data."
        />
      ) : (
        <DataTable
          columns={columns}
          data={stockData?.data ?? []}
          searchKey="barcode"
          searchPlaceholder="Filter by barcode..."
          isLoading={isLoading}
          emptyMessage="No stock entries found."
          toolbarActions={
            <Button size="sm" onClick={() => { setEditingStock(null); setFormDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />New Stock Entry
            </Button>
          }
        />
      )}

      {/* Create/Edit Dialog */}
      <FormDialog
        open={formDialogOpen}
        onOpenChange={(open) => { setFormDialogOpen(open); if (!open) setEditingStock(null); }}
        title={editingStock ? "Edit Stock Entry" : "New Stock Entry"}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        className="max-w-2xl"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Date *</Label>
            <Input type="date" {...form.register("docDate")} />
          </div>
          <div className="space-y-1">
            <Label>Project</Label>
            <Input {...form.register("projectNo")} placeholder="Project No" />
          </div>
          <div className="space-y-1">
            <Label>Barcode</Label>
            <Input {...form.register("barcode")} placeholder="Barcode" />
          </div>
          <div className="space-y-1">
            <Label>Serial No</Label>
            <Input {...form.register("serialNo")} placeholder="Serial No" />
          </div>
          <div className="space-y-1">
            <Label>Item Description</Label>
            <Input {...form.register("itemDescription")} placeholder="Description" />
          </div>
          <div className="space-y-1">
            <Label>Model</Label>
            <Input {...form.register("model")} placeholder="Model" />
          </div>
          <div className="space-y-1">
            <Label>Location</Label>
            <Input {...form.register("location")} placeholder="Location" />
          </div>
          <div className="space-y-1">
            <Label>Quantity</Label>
            <Input type="number" min="0" {...form.register("quantity")} />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select {...form.register("status")}>
              <SelectOption value="AVAILABLE">Available</SelectOption>
              <SelectOption value="RESERVED">Reserved</SelectOption>
              <SelectOption value="ISSUED">Issued</SelectOption>
              <SelectOption value="DAMAGED">Damaged</SelectOption>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>State</Label>
            <Select {...form.register("state")}>
              <SelectOption value="NEW">New</SelectOption>
              <SelectOption value="USED">Used</SelectOption>
              <SelectOption value="REFURBISHED">Refurbished</SelectOption>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>FOB AED</Label>
            <Input type="number" step="0.01" min="0" {...form.register("fobAed")} />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...form.register("accessories")} className="rounded border-zinc-300" />
              Has Accessories
            </label>
          </div>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Stock Entry"
        description={`Delete stock entry "${targetStock?.docNo}"? This action cannot be undone.`}
        onConfirm={() => targetStock && deleteMutation.mutate(targetStock.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
