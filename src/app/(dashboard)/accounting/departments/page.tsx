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
import { fetchApi } from "@/lib/api";

// --- Types ---
interface Department {
  id: number;
  departmentCode: string;
  name: string;
  description: string | null;
}

interface ListResponse {
  data: Department[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const departmentSchema = z.object({
  departmentCode: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().default(""),
});

type DepartmentForm = z.infer<typeof departmentSchema>;

// --- API ---
const API = "/api/accounting/departments";

function fetchDepartments() {
  return fetchApi<ListResponse>(`${API}?pageSize=1000`);
}

function createDepartment(data: DepartmentForm) {
  return fetchApi<Department>(API, { method: "POST", body: JSON.stringify(data) });
}

function updateDepartment(id: number, data: DepartmentForm) {
  return fetchApi<Department>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteDepartment(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<Department>[] = [
  {
    accessorKey: "departmentCode",
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
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => row.original.description || "-",
  },
];

// --- Page ---
export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Department | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema) as any,
    defaultValues: { departmentCode: "", name: "", description: "" },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  const createMutation = useMutation({
    mutationFn: (values: DepartmentForm) => createDepartment(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: DepartmentForm) => updateDepartment(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDepartment(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ departmentCode: "", name: "", description: "" });
    setFormOpen(true);
  }

  function openEdit(item: Department) {
    setSelected(item);
    form.reset({ departmentCode: item.departmentCode, name: item.name, description: item.description ?? "" });
    setFormOpen(true);
  }

  function openDelete(item: Department) {
    setSelected(item);
    setDeleteOpen(true);
  }

  function onSubmit(values: DepartmentForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<Department>[] = [
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
        <h1 className="text-2xl font-semibold">Departments</h1>
        <p className="text-sm text-zinc-500">Manage department records.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search departments..."
        isLoading={isLoading}
        emptyMessage="No departments found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Department
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Department" : "Add Department"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="departmentCode">Code</Label>
          <Input id="departmentCode" {...form.register("departmentCode")} />
          {form.formState.errors.departmentCode && (
            <p className="text-sm text-red-500">{form.formState.errors.departmentCode.message}</p>
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
          <Label htmlFor="description">Description</Label>
          <Input id="description" {...form.register("description")} />
          {form.formState.errors.description && (
            <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
          )}
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Department"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
