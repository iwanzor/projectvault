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
interface Unit {
  id: number;
  unitCode: string;
  name: string;
}

interface ListResponse {
  data: Unit[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const unitSchema = z.object({
  unitCode: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(50),
});

type UnitForm = z.infer<typeof unitSchema>;

// --- API ---
const API = "/api/setup/units";

function fetchUnits() {
  return fetchApi<ListResponse>(`${API}?pageSize=1000`);
}

function createUnit(data: UnitForm) {
  return fetchApi<Unit>(API, { method: "POST", body: JSON.stringify(data) });
}

function updateUnit(id: number, data: UnitForm) {
  return fetchApi<Unit>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteUnit(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<Unit>[] = [
  {
    accessorKey: "unitCode",
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
export default function UnitsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Unit | null>(null);

  const form = useForm<UnitForm>({
    resolver: zodResolver(unitSchema),
    defaultValues: { unitCode: "", name: "" },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["units"],
    queryFn: fetchUnits,
  });

  const createMutation = useMutation({
    mutationFn: (values: UnitForm) => createUnit(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Unit created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: UnitForm) => updateUnit(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Unit updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUnit(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Unit deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ unitCode: "", name: "" });
    setFormOpen(true);
  }

  function openEdit(unit: Unit) {
    setSelected(unit);
    form.reset({ unitCode: unit.unitCode, name: unit.name });
    setFormOpen(true);
  }

  function openDelete(unit: Unit) {
    setSelected(unit);
    setDeleteOpen(true);
  }

  function onSubmit(values: UnitForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<Unit>[] = [
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
        <h1 className="text-2xl font-semibold">Units of Measure</h1>
        <p className="text-sm text-zinc-500">Manage product units of measurement.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search units..."
        isLoading={isLoading}
        emptyMessage="No units found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Unit
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Unit" : "Add Unit"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="unitCode">Code</Label>
          <Input id="unitCode" {...form.register("unitCode")} />
          {form.formState.errors.unitCode && (
            <p className="text-sm text-red-500">{form.formState.errors.unitCode.message}</p>
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
        title="Delete Unit"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
