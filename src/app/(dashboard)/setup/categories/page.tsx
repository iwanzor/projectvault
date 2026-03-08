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
interface MainCategory {
  id: number;
  mainCategoryCode: string;
  name: string;
  _count?: { subCategories1: number };
}

interface ListResponse {
  data: MainCategory[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const categorySchema = z.object({
  mainCategoryCode: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(150),
});

type CategoryForm = z.infer<typeof categorySchema>;

// --- API ---
const API = "/api/setup/categories";

function fetchCategories() {
  return fetchApi<ListResponse>(`${API}?pageSize=1000`);
}

function createCategory(data: CategoryForm) {
  return fetchApi<MainCategory>(API, { method: "POST", body: JSON.stringify(data) });
}

function updateCategory(id: number, data: CategoryForm) {
  return fetchApi<MainCategory>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteCategory(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<MainCategory>[] = [
  {
    accessorKey: "mainCategoryCode",
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
    id: "subCategories",
    header: "Sub-categories",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original._count?.subCategories1 ?? 0}</Badge>
    ),
  },
];

// --- Page ---
export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<MainCategory | null>(null);

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { mainCategoryCode: "", name: "" },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const createMutation = useMutation({
    mutationFn: (values: CategoryForm) => createCategory(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: CategoryForm) => updateCategory(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCategory(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ mainCategoryCode: "", name: "" });
    setFormOpen(true);
  }

  function openEdit(cat: MainCategory) {
    setSelected(cat);
    form.reset({ mainCategoryCode: cat.mainCategoryCode, name: cat.name });
    setFormOpen(true);
  }

  function openDelete(cat: MainCategory) {
    setSelected(cat);
    setDeleteOpen(true);
  }

  function onSubmit(values: CategoryForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<MainCategory>[] = [
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
        <h1 className="text-2xl font-semibold">Main Categories</h1>
        <p className="text-sm text-zinc-500">Manage main product categories.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search categories..."
        isLoading={isLoading}
        emptyMessage="No categories found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Category" : "Add Category"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="mainCategoryCode">Code</Label>
          <Input id="mainCategoryCode" {...form.register("mainCategoryCode")} />
          {form.formState.errors.mainCategoryCode && (
            <p className="text-sm text-red-500">{form.formState.errors.mainCategoryCode.message}</p>
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
        title="Delete Category"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
