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
import { fetchApi } from "@/lib/api";

// --- Types ---
interface SubCategory1 {
  id: number;
  subCategory1Code: string;
  name: string;
}

interface SubCategory2 {
  id: number;
  subCategory2Code: string;
  name: string;
  subCategory1Id: number;
  subCategory1?: SubCategory1;
}

interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const subCat2Schema = z.object({
  subCategory2Code: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(150),
  subCategory1Id: z.coerce.number().min(1, "Sub-category 1 is required"),
});

type SubCat2Form = z.infer<typeof subCat2Schema>;

// --- API ---
const API = "/api/setup/sub-categories-2";

function fetchSubCat2() {
  return fetchApi<ListResponse<SubCategory2>>(`${API}?pageSize=1000`);
}

function fetchSubCat1() {
  return fetchApi<ListResponse<SubCategory1>>("/api/setup/sub-categories-1?pageSize=1000");
}

function createSubCat2(data: SubCat2Form) {
  return fetchApi<SubCategory2>(API, { method: "POST", body: JSON.stringify(data) });
}

function updateSubCat2(id: number, data: SubCat2Form) {
  return fetchApi<SubCategory2>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteSubCat2(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<SubCategory2>[] = [
  {
    accessorKey: "subCategory2Code",
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
    id: "subCategory1",
    header: "Sub-Category 1",
    cell: ({ row }) => row.original.subCategory1?.name ?? "-",
  },
];

// --- Page ---
export default function SubCategories2Page() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<SubCategory2 | null>(null);

  const form = useForm<SubCat2Form>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(subCat2Schema) as any,
    defaultValues: { subCategory2Code: "", name: "", subCategory1Id: 0 },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["sub-categories-2"],
    queryFn: fetchSubCat2,
  });

  const { data: subCat1Data } = useQuery({
    queryKey: ["sub-categories-1"],
    queryFn: fetchSubCat1,
  });

  const createMutation = useMutation({
    mutationFn: (values: SubCat2Form) => createSubCat2(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories-2"] });
      toast.success("Sub-category created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: SubCat2Form) => updateSubCat2(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories-2"] });
      toast.success("Sub-category updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSubCat2(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories-2"] });
      toast.success("Sub-category deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ subCategory2Code: "", name: "", subCategory1Id: 0 });
    setFormOpen(true);
  }

  function openEdit(item: SubCategory2) {
    setSelected(item);
    form.reset({
      subCategory2Code: item.subCategory2Code,
      name: item.name,
      subCategory1Id: item.subCategory1Id,
    });
    setFormOpen(true);
  }

  function openDelete(item: SubCategory2) {
    setSelected(item);
    setDeleteOpen(true);
  }

  function onSubmit(values: SubCat2Form) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<SubCategory2>[] = [
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
        <h1 className="text-2xl font-semibold">Sub-Categories 2</h1>
        <p className="text-sm text-zinc-500">Manage second-level product sub-categories.</p>
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
        title={selected ? "Edit Sub-Category 2" : "Add Sub-Category 2"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="subCategory2Code">Code</Label>
          <Input id="subCategory2Code" {...form.register("subCategory2Code")} />
          {form.formState.errors.subCategory2Code && (
            <p className="text-sm text-red-500">{form.formState.errors.subCategory2Code.message}</p>
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
          <Label htmlFor="subCategory1Id">Sub-Category 1</Label>
          <Select id="subCategory1Id" {...form.register("subCategory1Id", { valueAsNumber: true })}>
            <SelectOption value="">Select sub-category 1...</SelectOption>
            {subCat1Data?.data.map((c) => (
              <SelectOption key={c.id} value={c.id}>
                {c.name}
              </SelectOption>
            ))}
          </Select>
          {form.formState.errors.subCategory1Id && (
            <p className="text-sm text-red-500">{form.formState.errors.subCategory1Id.message}</p>
          )}
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Sub-Category 2"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
