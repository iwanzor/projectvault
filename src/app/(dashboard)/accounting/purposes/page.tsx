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
interface Purpose {
  id: number;
  purposeCode: string;
  name: string;
}

interface ListResponse {
  data: Purpose[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const purposeSchema = z.object({
  purposeCode: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(100),
});

type PurposeForm = z.infer<typeof purposeSchema>;

// --- API ---
const API = "/api/accounting/purposes";

function fetchPurposes() {
  return fetchApi<ListResponse>(`${API}?pageSize=1000`);
}

function createPurpose(data: PurposeForm) {
  return fetchApi<Purpose>(API, { method: "POST", body: JSON.stringify(data) });
}

function updatePurpose(id: number, data: PurposeForm) {
  return fetchApi<Purpose>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deletePurpose(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<Purpose>[] = [
  {
    accessorKey: "purposeCode",
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
];

// --- Page ---
export default function PurposesPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Purpose | null>(null);

  const form = useForm<PurposeForm>({
    resolver: zodResolver(purposeSchema),
    defaultValues: { purposeCode: "", name: "" },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["purposes"],
    queryFn: fetchPurposes,
  });

  const createMutation = useMutation({
    mutationFn: (values: PurposeForm) => createPurpose(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purposes"] });
      toast.success("Purpose created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: PurposeForm) => updatePurpose(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purposes"] });
      toast.success("Purpose updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePurpose(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purposes"] });
      toast.success("Purpose deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ purposeCode: "", name: "" });
    setFormOpen(true);
  }

  function openEdit(item: Purpose) {
    setSelected(item);
    form.reset({ purposeCode: item.purposeCode, name: item.name });
    setFormOpen(true);
  }

  function openDelete(item: Purpose) {
    setSelected(item);
    setDeleteOpen(true);
  }

  function onSubmit(values: PurposeForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<Purpose>[] = [
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
        <h1 className="text-2xl font-semibold">Purposes</h1>
        <p className="text-sm text-zinc-500">Manage transaction purpose classifications.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search purposes..."
        isLoading={isLoading}
        emptyMessage="No purposes found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Purpose
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Purpose" : "Add Purpose"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="purposeCode">Code</Label>
          <Input id="purposeCode" {...form.register("purposeCode")} />
          {form.formState.errors.purposeCode && (
            <p className="text-sm text-red-500">{form.formState.errors.purposeCode.message}</p>
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
        title="Delete Purpose"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
