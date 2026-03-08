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
  isCombo: boolean;
  hasSerialNumber: boolean;
  brandId: number;
  mainCategoryId: number;
  subCategory1Id: number;
  subCategory2Id: number;
  unitId: number;
  packingTypeId: number | null;
  supplierId: number | null;
  currencyId: number | null;
  salesRate: number;
  fobPrice: number;
  defaultPrice: number;
  estimatedArrivalPrice: number;
  shipmentCostPara: number;
  customsCostPara: number | null;
  conversionRate: number | null;
  salesMarkup: number | null;
  vatPerc: number | null;
  weight: number;
  height: number;
  depth: number;
  width: number | null;
  imagePath: string | null;
  pdfDocPath: string | null;
  footprintPath: string | null;
  brand?: { id: number; name: string };
  mainCategory?: { id: number; name: string };
  subCategory1?: { id: number; name: string };
  subCategory2?: { id: number; name: string };
  unit?: { id: number; name: string };
  packingType?: { id: number; name: string } | null;
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

const ITEM_TYPES = ["ITEM", "FREE_TEXT", "COMBO", "OHP", "NON_SERIAL", "COST_ITEM"] as const;

const itemSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
  name: z.string().min(1, "Name is required"),
  modelNo: z.string().min(1, "Model No is required"),
  itemType: z.enum(ITEM_TYPES),
  isActive: z.boolean(),
  isCombo: z.boolean(),
  hasSerialNumber: z.boolean(),
  brandId: z.coerce.number().min(1, "Brand is required"),
  mainCategoryId: z.coerce.number().min(1, "Main Category is required"),
  subCategory1Id: z.coerce.number().min(1, "Sub Category 1 is required"),
  subCategory2Id: z.coerce.number().min(1, "Sub Category 2 is required"),
  unitId: z.coerce.number().min(1, "Unit is required"),
  packingTypeId: z.coerce.number().optional(),
  supplierId: z.coerce.number().optional(),
  currencyId: z.coerce.number().optional(),
  fobPrice: z.coerce.number().min(0),
  shipmentCostPara: z.coerce.number().min(0),
  customsCostPara: z.coerce.number().min(0).optional(),
  conversionRate: z.coerce.number().min(0).optional(),
  estimatedArrivalPrice: z.coerce.number().min(0),
  salesMarkup: z.coerce.number().min(0).optional(),
  salesRate: z.coerce.number().min(0),
  defaultPrice: z.coerce.number().min(0),
  vatPerc: z.coerce.number().min(0).optional(),
  weight: z.coerce.number().min(0),
  height: z.coerce.number().min(0),
  depth: z.coerce.number().min(0),
  width: z.coerce.number().min(0).optional(),
  imagePath: z.string().optional(),
  pdfDocPath: z.string().optional(),
  footprintPath: z.string().optional(),
});

type ItemFormData = z.infer<typeof itemSchema>;

// --- Component ---

export default function ItemsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<Item | null>(null);
  const [search, setSearch] = React.useState("");
  const [filterBrand, setFilterBrand] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState("");
  const [filterType, setFilterType] = React.useState("");
  const [filterActive, setFilterActive] = React.useState("");

  // --- Data fetching ---

  const buildParams = () => {
    const params = new URLSearchParams({ pageSize: "200" });
    if (search) params.set("search", search);
    if (filterBrand) params.set("brandId", filterBrand);
    if (filterCategory) params.set("mainCategoryId", filterCategory);
    if (filterType) params.set("itemType", filterType);
    if (filterActive) params.set("isActive", filterActive);
    return params.toString();
  };

  const { data: itemsData, isLoading } = useQuery({
    queryKey: ["items", search, filterBrand, filterCategory, filterType, filterActive],
    queryFn: () => fetchApi<PaginatedResponse<Item>>(`/api/setup/items?${buildParams()}`),
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

  const { data: packingTypes = [] } = useQuery({
    queryKey: ["packing-types-lookup"],
    queryFn: () => fetchApi<PaginatedResponse<LookupItem>>("/api/setup/packing-types?pageSize=500").then((r) => r.data),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-lookup"],
    queryFn: () => fetchApi<PaginatedResponse<{ id: number; name: string }>>("/api/setup/suppliers?pageSize=500").then((r) => r.data),
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ["currencies-lookup"],
    queryFn: () => fetchApi<PaginatedResponse<LookupItem>>("/api/setup/currencies?pageSize=500").then((r) => r.data),
  });

  // --- Form ---

  const form = useForm<ItemFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(itemSchema) as any,
    defaultValues: {
      barcode: "",
      name: "",
      modelNo: "",
      itemType: "ITEM",
      isActive: true,
      isCombo: false,
      hasSerialNumber: true,
      brandId: 0,
      mainCategoryId: 0,
      subCategory1Id: 0,
      subCategory2Id: 0,
      unitId: 0,
      packingTypeId: undefined,
      supplierId: undefined,
      currencyId: undefined,
      fobPrice: 0,
      shipmentCostPara: 0,
      customsCostPara: 0,
      conversionRate: 1,
      estimatedArrivalPrice: 0,
      salesMarkup: 0,
      salesRate: 0,
      defaultPrice: 0,
      vatPerc: 0,
      weight: 0,
      height: 0,
      depth: 0,
      width: 0,
      imagePath: "",
      pdfDocPath: "",
      footprintPath: "",
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

  // Reset sub-categories when parent changes
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
    mutationFn: (data: ItemFormData) => fetchApi<Item>("/api/setup/items", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item created successfully");
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ItemFormData) =>
      fetchApi<Item>(`/api/setup/items/${editingItem!.id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item updated successfully");
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/api/setup/items/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // --- Helpers ---

  function generateBarcode(): string {
    // Find the max ITM number from existing items
    const itmItems = items?.data?.filter((i) => i.barcode.startsWith("ITM-")) ?? [];
    let maxNum = 0;
    for (const item of itmItems) {
      const num = parseInt(item.barcode.replace("ITM-", ""), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
    const nextNum = maxNum + 1;
    return `ITM-${String(nextNum).padStart(4, "0")}`;
  }

  // --- Handlers ---

  function handleOpenCreate() {
    setEditingItem(null);
    const newBarcode = generateBarcode();
    form.reset({
      barcode: newBarcode,
      name: "",
      modelNo: "",
      itemType: "ITEM",
      isActive: true,
      isCombo: false,
      hasSerialNumber: true,
      brandId: 0,
      mainCategoryId: 0,
      subCategory1Id: 0,
      subCategory2Id: 0,
      unitId: 0,
      packingTypeId: undefined,
      supplierId: undefined,
      currencyId: undefined,
      fobPrice: 0,
      shipmentCostPara: 0,
      customsCostPara: 0,
      conversionRate: 1,
      estimatedArrivalPrice: 0,
      salesMarkup: 0,
      salesRate: 0,
      defaultPrice: 0,
      vatPerc: 0,
      weight: 0,
      height: 0,
      depth: 0,
      width: 0,
      imagePath: "",
      pdfDocPath: "",
      footprintPath: "",
    });
    setDialogOpen(true);
  }

  function handleOpenEdit(item: Item) {
    setEditingItem(item);
    form.reset({
      barcode: item.barcode,
      name: item.name,
      modelNo: item.modelNo,
      itemType: item.itemType as ItemFormData["itemType"],
      isActive: item.isActive,
      isCombo: item.isCombo,
      hasSerialNumber: item.hasSerialNumber,
      brandId: item.brandId,
      mainCategoryId: item.mainCategoryId,
      subCategory1Id: item.subCategory1Id,
      subCategory2Id: item.subCategory2Id,
      unitId: item.unitId,
      packingTypeId: item.packingTypeId ?? undefined,
      supplierId: item.supplierId ?? undefined,
      currencyId: item.currencyId ?? undefined,
      fobPrice: Number(item.fobPrice),
      shipmentCostPara: Number(item.shipmentCostPara),
      customsCostPara: item.customsCostPara != null ? Number(item.customsCostPara) : 0,
      conversionRate: item.conversionRate != null ? Number(item.conversionRate) : 1,
      estimatedArrivalPrice: Number(item.estimatedArrivalPrice),
      salesMarkup: item.salesMarkup != null ? Number(item.salesMarkup) : 0,
      salesRate: Number(item.salesRate),
      defaultPrice: Number(item.defaultPrice),
      vatPerc: item.vatPerc != null ? Number(item.vatPerc) : 0,
      weight: Number(item.weight),
      height: Number(item.height),
      depth: Number(item.depth),
      width: item.width != null ? Number(item.width) : 0,
      imagePath: item.imagePath ?? "",
      pdfDocPath: item.pdfDocPath ?? "",
      footprintPath: item.footprintPath ?? "",
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
      // Clean optional numeric fields: convert 0 to undefined for nullable FK fields
      const cleaned = {
        ...data,
        packingTypeId: data.packingTypeId || undefined,
        supplierId: data.supplierId || undefined,
        currencyId: data.currencyId || undefined,
      };
      if (editingItem) {
        updateMutation.mutate(cleaned);
      } else {
        createMutation.mutate(cleaned);
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
    { accessorKey: "name", header: "Name", cell: ({ row }) => (
      <span className="max-w-[300px] truncate block">{row.original.name}</span>
    )},
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
      accessorKey: "itemType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.itemType}</Badge>
      ),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Items</h1>
          <p className="text-sm text-zinc-500">
            {itemsData?.total ?? 0} items total
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by name, barcode, or model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-[250px]"
        />
        <Select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          className="h-8 w-[150px]"
        >
          <SelectOption value="">All Brands</SelectOption>
          {brands.map((b) => (
            <SelectOption key={b.id} value={String(b.id)}>
              {b.name}
            </SelectOption>
          ))}
        </Select>
        <Select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-8 w-[160px]"
        >
          <SelectOption value="">All Categories</SelectOption>
          {categories.map((c) => (
            <SelectOption key={c.id} value={String(c.id)}>
              {c.name}
            </SelectOption>
          ))}
        </Select>
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-8 w-[140px]"
        >
          <SelectOption value="">All Types</SelectOption>
          {ITEM_TYPES.map((t) => (
            <SelectOption key={t} value={t}>
              {t}
            </SelectOption>
          ))}
        </Select>
        <Select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="h-8 w-[120px]"
        >
          <SelectOption value="">All Status</SelectOption>
          <SelectOption value="true">Active</SelectOption>
          <SelectOption value="false">Inactive</SelectOption>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={itemsData?.data ?? []}
        searchKey="name"
        searchPlaceholder="Filter by name..."
        isLoading={isLoading}
        emptyMessage="No items found."
        colorRules={colorRules}
        toolbarActions={
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <FormDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        title={editingItem ? "Edit Item" : "Create Item"}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Section 1: Basic Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 border-b pb-1">Basic Info</h3>
          <div className="grid grid-cols-3 gap-3">
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
            <div className="space-y-1">
              <Label htmlFor="modelNo">Model No *</Label>
              <Input id="modelNo" {...form.register("modelNo")} />
              {form.formState.errors.modelNo && (
                <p className="text-xs text-red-500">{form.formState.errors.modelNo.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="itemType">Item Type</Label>
              <Select id="itemType" {...form.register("itemType")}>
                {ITEM_TYPES.map((t) => (
                  <SelectOption key={t} value={t}>{t}</SelectOption>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-6 col-span-2 pt-5">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register("isActive")} className="rounded" />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register("isCombo")} className="rounded" />
                Combo
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register("hasSerialNumber")} className="rounded" />
                Has Serial Number
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Classification */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 border-b pb-1">Classification</h3>
          <div className="grid grid-cols-3 gap-3">
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
            <div className="space-y-1">
              <Label htmlFor="subCategory1Id">Sub Category 1 *</Label>
              <Select id="subCategory1Id" {...form.register("subCategory1Id")} disabled={!watchMainCategory || watchMainCategory === 0}>
                <SelectOption value="0">Select Sub Category 1</SelectOption>
                {subCategories1.map((s) => (
                  <SelectOption key={s.id} value={String(s.id)}>{s.name}</SelectOption>
                ))}
              </Select>
              {form.formState.errors.subCategory1Id && (
                <p className="text-xs text-red-500">{form.formState.errors.subCategory1Id.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="subCategory2Id">Sub Category 2 *</Label>
              <Select id="subCategory2Id" {...form.register("subCategory2Id")} disabled={!watchSubCategory1 || watchSubCategory1 === 0}>
                <SelectOption value="0">Select Sub Category 2</SelectOption>
                {subCategories2.map((s) => (
                  <SelectOption key={s.id} value={String(s.id)}>{s.name}</SelectOption>
                ))}
              </Select>
              {form.formState.errors.subCategory2Id && (
                <p className="text-xs text-red-500">{form.formState.errors.subCategory2Id.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="unitId">Unit *</Label>
              <Select id="unitId" {...form.register("unitId")}>
                <SelectOption value="0">Select Unit</SelectOption>
                {units.map((u) => (
                  <SelectOption key={u.id} value={String(u.id)}>{u.name}</SelectOption>
                ))}
              </Select>
              {form.formState.errors.unitId && (
                <p className="text-xs text-red-500">{form.formState.errors.unitId.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="packingTypeId">Packing Type</Label>
              <Select id="packingTypeId" {...form.register("packingTypeId")}>
                <SelectOption value="">Select Packing Type</SelectOption>
                {packingTypes.map((p) => (
                  <SelectOption key={p.id} value={String(p.id)}>{p.name}</SelectOption>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Section 3: Pricing */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 border-b pb-1">Pricing</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="supplierId">Supplier</Label>
              <Select id="supplierId" {...form.register("supplierId")}>
                <SelectOption value="">Select Supplier</SelectOption>
                {suppliers.map((s) => (
                  <SelectOption key={s.id} value={String(s.id)}>{s.name}</SelectOption>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="currencyId">Currency</Label>
              <Select id="currencyId" {...form.register("currencyId")}>
                <SelectOption value="">Select Currency</SelectOption>
                {currencies.map((c) => (
                  <SelectOption key={c.id} value={String(c.id)}>{c.name}</SelectOption>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="fobPrice">FOB Price</Label>
              <Input id="fobPrice" type="number" step="0.01" {...form.register("fobPrice")} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="shipmentCostPara">Shipment Cost</Label>
              <Input id="shipmentCostPara" type="number" step="0.01" {...form.register("shipmentCostPara")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="customsCostPara">Customs Cost</Label>
              <Input id="customsCostPara" type="number" step="0.01" {...form.register("customsCostPara")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="conversionRate">Conversion Rate</Label>
              <Input id="conversionRate" type="number" step="0.01" {...form.register("conversionRate")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="estimatedArrivalPrice">Est. Arrival Price</Label>
              <Input id="estimatedArrivalPrice" type="number" step="0.01" {...form.register("estimatedArrivalPrice")} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="salesMarkup">Sales Markup (%)</Label>
              <Input id="salesMarkup" type="number" step="0.01" {...form.register("salesMarkup")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="salesRate">Sales Rate</Label>
              <Input id="salesRate" type="number" step="0.01" {...form.register("salesRate")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="defaultPrice">Default Price</Label>
              <Input id="defaultPrice" type="number" step="0.01" {...form.register("defaultPrice")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vatPerc">VAT (%)</Label>
              <Input id="vatPerc" type="number" step="0.01" {...form.register("vatPerc")} />
            </div>
          </div>
        </div>

        {/* Section 4: Dimensions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 border-b pb-1">Dimensions</h3>
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="weight">Weight</Label>
              <Input id="weight" type="number" step="0.01" {...form.register("weight")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="height">Height</Label>
              <Input id="height" type="number" step="0.01" {...form.register("height")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="depth">Depth</Label>
              <Input id="depth" type="number" step="0.01" {...form.register("depth")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="width">Width</Label>
              <Input id="width" type="number" step="0.01" {...form.register("width")} />
            </div>
          </div>
        </div>

        {/* Section 5: Files */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 border-b pb-1">Files</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="imagePath">Image Path</Label>
              <Input id="imagePath" {...form.register("imagePath")} placeholder="/images/..." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pdfDocPath">PDF Document Path</Label>
              <Input id="pdfDocPath" {...form.register("pdfDocPath")} placeholder="/docs/..." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="footprintPath">Footprint Path</Label>
              <Input id="footprintPath" {...form.register("footprintPath")} placeholder="/footprints/..." />
            </div>
          </div>
        </div>
      </FormDialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Item"
        description={`Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone.`}
        onConfirm={() => deletingItem && deleteMutation.mutate(deletingItem.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
