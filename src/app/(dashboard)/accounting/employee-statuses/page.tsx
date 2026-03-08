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
interface EmployeeStatus {
  id: number;
  statusCode: string;
  name: string;
  description: string | null;
}

interface ListResponse {
  data: EmployeeStatus[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const employeeStatusSchema = z.object({
  statusCode: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().default(""),
});

type EmployeeStatusForm = z.infer<typeof employeeStatusSchema>;

// --- API ---
const API = "/api/accounting/employee-statuses";

function fetchEmployeeStatuses() {
  return fetchApi<ListResponse>(`${API}?pageSize=1000`);
}

function createEmployeeStatus(data: EmployeeStatusForm) {
  return fetchApi<EmployeeStatus>(API, { method: "POST", body: JSON.stringify(data) });
}

function updateEmployeeStatus(id: number, data: EmployeeStatusForm) {
  return fetchApi<EmployeeStatus>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteEmployeeStatus(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<EmployeeStatus>[] = [
  {
    accessorKey: "statusCode",
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
export default function EmployeeStatusesPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<EmployeeStatus | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<EmployeeStatusForm>({
    resolver: zodResolver(employeeStatusSchema) as any,
    defaultValues: { statusCode: "", name: "", description: "" },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["employee-statuses"],
    queryFn: fetchEmployeeStatuses,
  });

  const createMutation = useMutation({
    mutationFn: (values: EmployeeStatusForm) => createEmployeeStatus(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-statuses"] });
      toast.success("Employee status created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: EmployeeStatusForm) => updateEmployeeStatus(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-statuses"] });
      toast.success("Employee status updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEmployeeStatus(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-statuses"] });
      toast.success("Employee status deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ statusCode: "", name: "", description: "" });
    setFormOpen(true);
  }

  function openEdit(item: EmployeeStatus) {
    setSelected(item);
    form.reset({ statusCode: item.statusCode, name: item.name, description: item.description ?? "" });
    setFormOpen(true);
  }

  function openDelete(item: EmployeeStatus) {
    setSelected(item);
    setDeleteOpen(true);
  }

  function onSubmit(values: EmployeeStatusForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<EmployeeStatus>[] = [
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
        <h1 className="text-2xl font-semibold">Employee Statuses</h1>
        <p className="text-sm text-zinc-500">Manage employee status classifications.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search employee statuses..."
        isLoading={isLoading}
        emptyMessage="No employee statuses found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Status
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Employee Status" : "Add Employee Status"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="statusCode">Code</Label>
          <Input id="statusCode" {...form.register("statusCode")} />
          {form.formState.errors.statusCode && (
            <p className="text-sm text-red-500">{form.formState.errors.statusCode.message}</p>
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
        title="Delete Employee Status"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
