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
interface Currency {
  id: number;
  currencyCode: string;
  name: string;
  symbol: string | null;
  conversionRate: number | string | null;
}

interface ListResponse {
  data: Currency[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const currencySchema = z.object({
  currencyCode: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(100),
  symbol: z.string().max(50).optional().default(""),
  conversionRate: z.number().min(0, "Must be a positive number").optional().default(1),
});

type CurrencyForm = z.infer<typeof currencySchema>;

// --- API ---
const API = "/api/setup/currencies";

function fetchCurrencies() {
  return fetchApi<ListResponse>(`${API}?pageSize=1000`);
}

function createCurrency(data: CurrencyForm) {
  return fetchApi<Currency>(API, { method: "POST", body: JSON.stringify(data) });
}

function updateCurrency(id: number, data: CurrencyForm) {
  return fetchApi<Currency>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteCurrency(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<Currency>[] = [
  {
    accessorKey: "currencyCode",
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
    accessorKey: "symbol",
    header: "Symbol",
    cell: ({ row }) => row.original.symbol || "-",
  },
  {
    accessorKey: "conversionRate",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Conversion Rate <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => Number(row.original.conversionRate ?? 1).toFixed(4),
  },
];

// --- Page ---
export default function CurrenciesPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Currency | null>(null);

  const form = useForm<CurrencyForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(currencySchema) as any,
    defaultValues: { currencyCode: "", name: "", symbol: "", conversionRate: 1 },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["currencies"],
    queryFn: fetchCurrencies,
  });

  const createMutation = useMutation({
    mutationFn: (values: CurrencyForm) => createCurrency(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
      toast.success("Currency created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: CurrencyForm) => updateCurrency(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
      toast.success("Currency updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCurrency(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
      toast.success("Currency deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ currencyCode: "", name: "", symbol: "", conversionRate: 1 });
    setFormOpen(true);
  }

  function openEdit(currency: Currency) {
    setSelected(currency);
    form.reset({
      currencyCode: currency.currencyCode,
      name: currency.name,
      symbol: currency.symbol ?? "",
      conversionRate: Number(currency.conversionRate ?? 1),
    });
    setFormOpen(true);
  }

  function openDelete(currency: Currency) {
    setSelected(currency);
    setDeleteOpen(true);
  }

  function onSubmit(values: CurrencyForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<Currency>[] = [
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
        <h1 className="text-2xl font-semibold">Currencies</h1>
        <p className="text-sm text-zinc-500">Manage currencies and conversion rates.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search currencies..."
        isLoading={isLoading}
        emptyMessage="No currencies found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Currency
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Currency" : "Add Currency"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="currencyCode">Code</Label>
          <Input id="currencyCode" {...form.register("currencyCode")} />
          {form.formState.errors.currencyCode && (
            <p className="text-sm text-red-500">{form.formState.errors.currencyCode.message}</p>
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
          <Label htmlFor="symbol">Symbol</Label>
          <Input id="symbol" {...form.register("symbol")} />
          {form.formState.errors.symbol && (
            <p className="text-sm text-red-500">{form.formState.errors.symbol.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="conversionRate">Conversion Rate</Label>
          <Input id="conversionRate" type="number" step="0.0001" {...form.register("conversionRate", { valueAsNumber: true })} />
          {form.formState.errors.conversionRate && (
            <p className="text-sm text-red-500">{form.formState.errors.conversionRate.message}</p>
          )}
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Currency"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
