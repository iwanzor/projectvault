"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { fetchApi } from "@/lib/api";
import { DataTable, ColorRule } from "@/components/data-display/data-table";
import { FormDialog } from "@/components/forms/form-dialog";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// --- Types ---

interface Item {
  id: number;
  barcode: string;
  name: string;
  modelNo: string;
  itemType: string;
  isActive: boolean;
  brandId: number;
  mainCategoryId: number;
  subCategory1Id: number;
  subCategory2Id: number;
  unitId: number;
  salesRate: number;
  fobPrice: number;
  defaultPrice: number;
  estimatedArrivalPrice: number;
  brand?: { id: number; name: string };
  mainCategory?: { id: number; name: string };
}

interface LookupItem {
  id: number;
  name: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---

const costItemSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
  name: z.string().min(1, "Name is required"),
  modelNo: z.string().min(1, "Model No is required"),
  isActive: z.boolean(),
  brandId: z.coerce.number().min(1, "Brand is required"),
  mainCategoryId: z.coerce.number().min(1, "Main Category is required"),
  subCategory1Id: z.coerce.number().min(1, "Sub Category 1 is required"),
  subCategory2Id: z.coerce.number().min(1, "Sub Category 2 is required"),
  unitId: z.coerce.number().min(1, "Unit is required"),
  fobPrice: z.coerce.number().min(0),
  salesRate: z.coerce.number().min(0),
  defaultPrice: z.coerce.number().min(0),
  estimatedArrivalPrice: z.coerce.number().min(0),
});

type CostItemFormData = z.infer<typeof costItemSchema>;

// --- Component ---

export default function CostItemsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<Item | null>(null);

  // --- Data fetching ---

  const { data: itemsData, isLoading } = useQuery({
    queryKey: ["cost-items"],
    queryFn: () => fetchApi<PaginatedResponse<Item>>("/api/setup/items?pageSize=200&itemType=COST_ITEM"),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands-lookup"],
    queryFn: () => fetchApi<PaginatedResponse<LookupItem>>("/api/setup/brands?pageSize=500").then((r) => r.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-lookup"],
    queryFn: () => fetchApi<PaginatedResponse<LookupItem>>("/api/setup/categories?pageSize=500").then((r) => r.data),
  });

  const { data: units = [] } = useQuery({
    queryKey: ["units-lookup"],
    queryFn: () => fetchApi<PaginatedResponse<LookupItem>>("/api/setup/units?pageSize=500").then((r) => r.data),
  });

  // --- Form ---

  const form = useForm<CostItemFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(costItemSchema) as any,
    defaultValues: {
      barcode: "",
      name: "",
      modelNo: "",
      isActive: true,
      brandId: 0,
      mainCategoryId: 0,
      subCategory1Id: 0,
      subCategory2Id: 0,
      unitId: 0,
      fobPrice: 0,
      salesRate: 0,
      defaultPrice: 0,
      estimatedArrivalPrice: 0,
    },
  });

  const watchMainCategory = form.watch("mainCategoryId");
  const watchSubCategory1 = form.watch("subCategory1Id");

  const { data: subCategories1 = [] } = useQuery({
    queryKey: ["sub-categories-1-lookup", watchMainCategory],
    queryFn: () =>
      fetchApi<PaginatedResponse<LookupItem>>(
        `/api/setup/sub-categories-1?pageSize=500&mainCategoryId=${watchMainCategory}`
      ).then((r) => r.data),
    enabled: !!watchMainCategory && watchMainCategory > 0,
  });

  const { data: subCategories2 = [] } = useQuery({
    queryKey: ["sub-categories-2-lookup", watchSubCategory1],
    queryFn: () =>
      fetchApi<PaginatedResponse<LookupItem>>(
        `/api/setup/sub-categories-2?pageSize=500&subCategory1Id=${watchSubCategory1}`
      ).then((r) => r.data),
    enabled: !!watchSubCategory1 && watchSubCategory1 > 0,
  });

  React.useEffect(() => {
    if (!editingItem) {
      form.setValue("subCategory1Id", 0);
      form.setValue("subCategory2Id", 0);
    }
  }, [watchMainCategory]);

  React.useEffect(() => {
    if (!editingItem) {
      form.setValue("subCategory2Id", 0);
    }
  }, [watchSubCategory1]);

  // --- Mutations ---

  const createMutation = useMutation({
    mutationFn: (data: CostItemFormData) =>
      fetchApi<Item>("/api/setup/items", {
        method: "POST",
        body: JSON.stringify({ ...data, itemType: "COST_ITEM" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-items"] });
      toast.success("Cost item created successfully");
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CostItemFormData) =>
      fetchApi<Item>(`/api/setup/items/${editingItem!.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...data, itemType: "COST_ITEM" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-items"] });
      toast.success("Cost item updated successfully");
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/api/setup/items/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-items"] });
      toast.success("Cost item deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // --- Handlers ---

  function handleOpenCreate() {
    setEditingItem(null);
    form.reset({
      barcode: "",
      name: "",
      modelNo: "",
      isActive: true,
      brandId: 0,
      mainCategoryId: 0,
      subCategory1Id: 0,
      subCategory2Id: 0,
      unitId: 0,
      fobPrice: 0,
      salesRate: 0,
      defaultPrice: 0,
      estimatedArrivalPrice: 0,
    });
    setDialogOpen(true);
  }

  function handleOpenEdit(item: Item) {
    setEditingItem(item);
    form.reset({
      barcode: item.barcode,
      name: item.name,
      modelNo: item.modelNo,
      isActive: item.isActive,
      brandId: item.brandId,
      mainCategoryId: item.mainCategoryId,
      subCategory1Id: item.subCategory1Id,
      subCategory2Id: item.subCategory2Id,
      unitId: item.unitId,
      fobPrice: Number(item.fobPrice),
      salesRate: Number(item.salesRate),
      defaultPrice: Number(item.defaultPrice),
      estimatedArrivalPrice: Number(item.estimatedArrivalPrice),
    });
    setDialogOpen(true);
  }

  function handleCloseDialog() {
    setDialogOpen(false);
    setEditingItem(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    form.handleSubmit((data) => {
      if (editingItem) {
        updateMutation.mutate(data);
      } else {
        createMutation.mutate(data);
      }
    })(e);
  }

  function handleDelete(item: Item) {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  }

  // --- Columns ---

  const columns: ColumnDef<Item, unknown>[] = [
    { accessorKey: "barcode", header: "Barcode" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "modelNo", header: "Model" },
    {
      accessorKey: "brand",
      header: "Brand",
      cell: ({ row }) => row.original.brand?.name ?? "-",
    },
    {
      accessorKey: "mainCategory",
      header: "Category",
      cell: ({ row }) => row.original.mainCategory?.name ?? "-",
    },
    {
      accessorKey: "salesRate",
      header: "Sales Rate",
      cell: ({ row }) => Number(row.original.salesRate).toFixed(2),
    },
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="destructive">Inactive</Badge>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(row.original);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.original);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const colorRules: ColorRule<Item>[] = [
    { condition: (row) => !row.isActive, className: "bg-gray-50 dark:bg-zinc-900/50" },
  ];

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Cost Items</h1>
        <p className="text-sm text-zinc-500">{itemsData?.total ?? 0} cost items total</p>
      </div>

      <DataTable
        columns={columns}
        data={itemsData?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search cost items..."
        isLoading={isLoading}
        emptyMessage="No cost items found."
        colorRules={colorRules}
        toolbarActions={
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Cost Item
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <FormDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        title={editingItem ? "Edit Cost Item" : "Create Cost Item"}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 border-b pb-1">Basic Info</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="barcode">Barcode *</Label>
              <Input id="barcode" {...form.register("barcode")} />
              {form.formState.errors.barcode && (
                <p className="text-xs text-red-500">{form.formState.errors.barcode.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="modelNo">Model No *</Label>
              <Input id="modelNo" {...form.register("modelNo")} />
              {form.formState.errors.modelNo && (
                <p className="text-xs text-red-500">{form.formState.errors.modelNo.message}</p>
              )}
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="isActive" {...form.register("isActive")} className="rounded" />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 border-b pb-1">Classification</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="brandId">Brand *</Label>
              <Select id="brandId" {...form.register("brandId")}>
                <SelectOption value="0">Select Brand</SelectOption>
                {brands.map((b) => (
                  <SelectOption key={b.id} value={String(b.id)}>{b.name}</SelectOption>
                ))}
              </Select>
              {form.formState.errors.brandId && (
                <p className="text-xs text-red-500">{form.formState.errors.brandId.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="mainCategoryId">Main Category *</Label>
              <Select id="mainCategoryId" {...form.register("mainCategoryId")}>
                <SelectOption value="0">Select Category</SelectOption>
                {categories.map((c) => (
                  <SelectOption key={c.id} value={String(c.id)}>{c.name}</SelectOption>
                ))}
              </Select>
              {form.formState.errors.mainCategoryId && (
                <p className="text-xs text-red-500">{form.formState.errors.mainCategoryId.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="subCategory1Id">Sub Category 1 *</Label>
              <Select id="subCategory1Id" {...form.register("subCategory1Id")} disabled={!watchMainCategory || watchMainCategory === 0}>
                <SelectOption value="0">Select</SelectOption>
                {subCategories1.map((s) => (
                  <SelectOption key={s.id} value={String(s.id)}>{s.name}</SelectOption>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="subCategory2Id">Sub Category 2 *</Label>
              <Select id="subCategory2Id" {...form.register("subCategory2Id")} disabled={!watchSubCategory1 || watchSubCategory1 === 0}>
                <SelectOption value="0">Select</SelectOption>
                {subCategories2.map((s) => (
                  <SelectOption key={s.id} value={String(s.id)}>{s.name}</SelectOption>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="unitId">Unit *</Label>
              <Select id="unitId" {...form.register("unitId")}>
                <SelectOption value="0">Select Unit</SelectOption>
                {units.map((u) => (
                  <SelectOption key={u.id} value={String(u.id)}>{u.name}</SelectOption>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 border-b pb-1">Pricing</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="fobPrice">FOB Price</Label>
              <Input id="fobPrice" type="number" step="0.01" {...form.register("fobPrice")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="estimatedArrivalPrice">Est. Arrival Price</Label>
              <Input id="estimatedArrivalPrice" type="number" step="0.01" {...form.register("estimatedArrivalPrice")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="salesRate">Sales Rate</Label>
              <Input id="salesRate" type="number" step="0.01" {...form.register("salesRate")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="defaultPrice">Default Price</Label>
              <Input id="defaultPrice" type="number" step="0.01" {...form.register("defaultPrice")} />
            </div>
          </div>
        </div>
      </FormDialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Cost Item"
        description={`Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone.`}
        onConfirm={() => deletingItem && deleteMutation.mutate(deletingItem.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
