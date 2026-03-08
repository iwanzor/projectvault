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
interface VatRate {
  id: number;
  vatCode: string;
  name: string;
  vatPerc: number | string;
}

interface ListResponse {
  data: VatRate[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const vatSchema = z.object({
  vatCode: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(50),
  vatPerc: z.number().min(0, "Must be 0 or more").max(100, "Must be 100 or less"),
});

type VatForm = z.infer<typeof vatSchema>;

// --- API ---
const API = "/api/setup/vat";

function fetchVatRates() {
  return fetchApi<ListResponse>(`${API}?pageSize=1000`);
}

function createVatRate(data: VatForm) {
  return fetchApi<VatRate>(API, { method: "POST", body: JSON.stringify(data) });
}

function updateVatRate(id: number, data: VatForm) {
  return fetchApi<VatRate>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteVatRate(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<VatRate>[] = [
  {
    accessorKey: "vatCode",
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
    accessorKey: "vatPerc",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Percentage <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => `${Number(row.original.vatPerc)}%`,
  },
];

// --- Page ---
export default function VatPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<VatRate | null>(null);

  const form = useForm<VatForm>({
    resolver: zodResolver(vatSchema),
    defaultValues: { vatCode: "", name: "", vatPerc: 0 },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["vat"],
    queryFn: fetchVatRates,
  });

  const createMutation = useMutation({
    mutationFn: (values: VatForm) => createVatRate(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vat"] });
      toast.success("VAT rate created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: VatForm) => updateVatRate(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vat"] });
      toast.success("VAT rate updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVatRate(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vat"] });
      toast.success("VAT rate deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ vatCode: "", name: "", vatPerc: 0 });
    setFormOpen(true);
  }

  function openEdit(vat: VatRate) {
    setSelected(vat);
    form.reset({ vatCode: vat.vatCode, name: vat.name, vatPerc: Number(vat.vatPerc) });
    setFormOpen(true);
  }

  function openDelete(vat: VatRate) {
    setSelected(vat);
    setDeleteOpen(true);
  }

  function onSubmit(values: VatForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<VatRate>[] = [
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
        <h1 className="text-2xl font-semibold">VAT Rates</h1>
        <p className="text-sm text-zinc-500">Configure VAT rates and tax settings.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search VAT rates..."
        isLoading={isLoading}
        emptyMessage="No VAT rates found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add VAT Rate
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit VAT Rate" : "Add VAT Rate"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="vatCode">Code</Label>
          <Input id="vatCode" {...form.register("vatCode")} />
          {form.formState.errors.vatCode && (
            <p className="text-sm text-red-500">{form.formState.errors.vatCode.message}</p>
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
          <Label htmlFor="vatPerc">Percentage (%)</Label>
          <Input id="vatPerc" type="number" step="0.01" {...form.register("vatPerc", { valueAsNumber: true })} />
          {form.formState.errors.vatPerc && (
            <p className="text-sm text-red-500">{form.formState.errors.vatPerc.message}</p>
          )}
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete VAT Rate"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
