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
interface PackingType {
  id: number;
  packingTypeCode: string;
  name: string;
}

interface ListResponse {
  data: PackingType[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const packingTypeSchema = z.object({
  packingTypeCode: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(50),
});

type PackingTypeForm = z.infer<typeof packingTypeSchema>;

// --- API ---
const API = "/api/setup/packing-types";

function fetchPackingTypes() {
  return fetchApi<ListResponse>(`${API}?pageSize=1000`);
}

function createPackingType(data: PackingTypeForm) {
  return fetchApi<PackingType>(API, { method: "POST", body: JSON.stringify(data) });
}

function updatePackingType(id: number, data: PackingTypeForm) {
  return fetchApi<PackingType>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deletePackingType(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<PackingType>[] = [
  {
    accessorKey: "packingTypeCode",
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
export default function PackingTypesPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<PackingType | null>(null);

  const form = useForm<PackingTypeForm>({
    resolver: zodResolver(packingTypeSchema),
    defaultValues: { packingTypeCode: "", name: "" },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["packing-types"],
    queryFn: fetchPackingTypes,
  });

  const createMutation = useMutation({
    mutationFn: (values: PackingTypeForm) => createPackingType(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing-types"] });
      toast.success("Packing type created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: PackingTypeForm) => updatePackingType(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing-types"] });
      toast.success("Packing type updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePackingType(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing-types"] });
      toast.success("Packing type deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ packingTypeCode: "", name: "" });
    setFormOpen(true);
  }

  function openEdit(pt: PackingType) {
    setSelected(pt);
    form.reset({ packingTypeCode: pt.packingTypeCode, name: pt.name });
    setFormOpen(true);
  }

  function openDelete(pt: PackingType) {
    setSelected(pt);
    setDeleteOpen(true);
  }

  function onSubmit(values: PackingTypeForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<PackingType>[] = [
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
        <h1 className="text-2xl font-semibold">Packing Types</h1>
        <p className="text-sm text-zinc-500">Manage product packing and packaging types.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search packing types..."
        isLoading={isLoading}
        emptyMessage="No packing types found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Packing Type
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Packing Type" : "Add Packing Type"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="packingTypeCode">Code</Label>
          <Input id="packingTypeCode" {...form.register("packingTypeCode")} />
          {form.formState.errors.packingTypeCode && (
            <p className="text-sm text-red-500">{form.formState.errors.packingTypeCode.message}</p>
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
        title="Delete Packing Type"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
