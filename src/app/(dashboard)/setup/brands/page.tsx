"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-display/data-table";
import { FormDialog } from "@/components/forms/form-dialog";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api";

// --- Types ---
interface Brand {
  id: number;
  brandCode: string;
  name: string;
  _count?: { items: number };
}

interface ListResponse {
  data: Brand[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const brandSchema = z.object({
  brandCode: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(150),
});

type BrandForm = z.infer<typeof brandSchema>;

// --- API ---
const API = "/api/setup/brands";

function fetchBrands() {
  return fetchApi<ListResponse>(`${API}?pageSize=1000`);
}

function createBrand(data: BrandForm) {
  return fetchApi<Brand>(API, { method: "POST", body: JSON.stringify(data) });
}

function updateBrand(id: number, data: BrandForm) {
  return fetchApi<Brand>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteBrand(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<Brand>[] = [
  {
    accessorKey: "brandCode",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Code <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    id: "items",
    header: "Items",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original._count?.items ?? 0}</Badge>
    ),
  },
];

// --- Page ---
export default function BrandsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Brand | null>(null);

  const form = useForm<BrandForm>({
    resolver: zodResolver(brandSchema),
    defaultValues: { brandCode: "", name: "" },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });

  const createMutation = useMutation({
    mutationFn: (values: BrandForm) => createBrand(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: BrandForm) => updateBrand(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBrand(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ brandCode: "", name: "" });
    setFormOpen(true);
  }

  function openEdit(brand: Brand) {
    setSelected(brand);
    form.reset({ brandCode: brand.brandCode, name: brand.name });
    setFormOpen(true);
  }

  function openDelete(brand: Brand) {
    setSelected(brand);
    setDeleteOpen(true);
  }

  function onSubmit(values: BrandForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<Brand>[] = [
    ...columns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => openDelete(row.original)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Brands</h1>
        <p className="text-sm text-zinc-500">Manage product brands and manufacturers.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search brands..."
        isLoading={isLoading}
        emptyMessage="No brands found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Brand
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Brand" : "Add Brand"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="brandCode">Code</Label>
          <Input id="brandCode" {...form.register("brandCode")} />
          {form.formState.errors.brandCode && (
            <p className="text-sm text-red-500">{form.formState.errors.brandCode.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Brand"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
