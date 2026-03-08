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
import { Select, SelectOption } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api";

// --- Types ---
interface MainCategory {
  id: number;
  mainCategoryCode: string;
  name: string;
}

interface SubCategory1 {
  id: number;
  subCategory1Code: string;
  name: string;
  mainCategoryId: number;
  mainCategory?: MainCategory;
  _count?: { subCategories2: number };
}

interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const subCat1Schema = z.object({
  subCategory1Code: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(150),
  mainCategoryId: z.coerce.number().min(1, "Main category is required"),
});

type SubCat1Form = z.infer<typeof subCat1Schema>;

// --- API ---
const API = "/api/setup/sub-categories-1";

function fetchSubCat1() {
  return fetchApi<ListResponse<SubCategory1>>(`${API}?pageSize=1000`);
}

function fetchCategories() {
  return fetchApi<ListResponse<MainCategory>>("/api/setup/categories?pageSize=1000");
}

function createSubCat1(data: SubCat1Form) {
  return fetchApi<SubCategory1>(API, { method: "POST", body: JSON.stringify(data) });
}

function updateSubCat1(id: number, data: SubCat1Form) {
  return fetchApi<SubCategory1>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteSubCat1(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<SubCategory1>[] = [
  {
    accessorKey: "subCategory1Code",
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
    id: "mainCategory",
    header: "Main Category",
    cell: ({ row }) => row.original.mainCategory?.name ?? "-",
  },
  {
    id: "subCategories2",
    header: "Sub-categories 2",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original._count?.subCategories2 ?? 0}</Badge>
    ),
  },
];

// --- Page ---
export default function SubCategories1Page() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<SubCategory1 | null>(null);

  const form = useForm<SubCat1Form>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(subCat1Schema) as any,
    defaultValues: { subCategory1Code: "", name: "", mainCategoryId: 0 },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["sub-categories-1"],
    queryFn: fetchSubCat1,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const createMutation = useMutation({
    mutationFn: (values: SubCat1Form) => createSubCat1(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories-1"] });
      toast.success("Sub-category created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: SubCat1Form) => updateSubCat1(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories-1"] });
      toast.success("Sub-category updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSubCat1(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories-1"] });
      toast.success("Sub-category deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ subCategory1Code: "", name: "", mainCategoryId: 0 });
    setFormOpen(true);
  }

  function openEdit(item: SubCategory1) {
    setSelected(item);
    form.reset({
      subCategory1Code: item.subCategory1Code,
      name: item.name,
      mainCategoryId: item.mainCategoryId,
    });
    setFormOpen(true);
  }

  function openDelete(item: SubCategory1) {
    setSelected(item);
    setDeleteOpen(true);
  }

  function onSubmit(values: SubCat1Form) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<SubCategory1>[] = [
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
        <h1 className="text-2xl font-semibold">Sub-Categories 1</h1>
        <p className="text-sm text-zinc-500">Manage first-level product sub-categories.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search sub-categories..."
        isLoading={isLoading}
        emptyMessage="No sub-categories found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Sub-Category
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Sub-Category 1" : "Add Sub-Category 1"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="subCategory1Code">Code</Label>
          <Input id="subCategory1Code" {...form.register("subCategory1Code")} />
          {form.formState.errors.subCategory1Code && (
            <p className="text-sm text-red-500">{form.formState.errors.subCategory1Code.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="mainCategoryId">Main Category</Label>
          <Select id="mainCategoryId" {...form.register("mainCategoryId", { valueAsNumber: true })}>
            <SelectOption value="">Select category...</SelectOption>
            {categoriesData?.data.map((c) => (
              <SelectOption key={c.id} value={c.id}>
                {c.name}
              </SelectOption>
            ))}
          </Select>
          {form.formState.errors.mainCategoryId && (
            <p className="text-sm text-red-500">{form.formState.errors.mainCategoryId.message}</p>
          )}
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Sub-Category 1"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
