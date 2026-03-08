"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { fetchApi } from "@/lib/api";
import { DataTable } from "@/components/data-display/data-table";
import { FormDialog } from "@/components/forms/form-dialog";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// --- Types ---

interface Supplier {
  id: number;
  supplierCode: string;
  name: string;
  address: string | null;
  currencyCode: string | null;
  isImport: boolean;
  terms: string | null;
  phone: string | null;
  email: string | null;
}

interface CurrencyOption {
  id: number;
  currencyCode: string;
  name: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---

const supplierSchema = z.object({
  supplierCode: z.string().min(1, "Supplier code is required"),
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  currencyCode: z.string().optional(),
  isImport: z.boolean(),
  terms: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

// --- Component ---

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = React.useState<Supplier | null>(null);

  // --- Data fetching ---

  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => fetchApi<PaginatedResponse<Supplier>>("/api/setup/suppliers?pageSize=200"),
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ["currencies-lookup"],
    queryFn: () => fetchApi<PaginatedResponse<CurrencyOption>>("/api/setup/currencies?pageSize=500").then((r) => r.data),
  });

  // --- Form ---

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      supplierCode: "",
      name: "",
      address: "",
      currencyCode: "",
      isImport: false,
      terms: "",
    },
  });

  // --- Mutations ---

  const createMutation = useMutation({
    mutationFn: (data: SupplierFormData) =>
      fetchApi<Supplier>("/api/setup/suppliers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier created successfully");
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: SupplierFormData) =>
      fetchApi<Supplier>(`/api/setup/suppliers/${editingSupplier!.id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier updated successfully");
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/api/setup/suppliers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingSupplier(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // --- Handlers ---

  function handleOpenCreate() {
    setEditingSupplier(null);
    form.reset({
      supplierCode: "",
      name: "",
      address: "",
      currencyCode: "",
      isImport: false,
      terms: "",
    });
    setDialogOpen(true);
  }

  function handleOpenEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    form.reset({
      supplierCode: supplier.supplierCode,
      name: supplier.name,
      address: supplier.address ?? "",
      currencyCode: supplier.currencyCode ?? "",
      isImport: supplier.isImport,
      terms: supplier.terms ?? "",
    });
    setDialogOpen(true);
  }

  function handleCloseDialog() {
    setDialogOpen(false);
    setEditingSupplier(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    form.handleSubmit((data) => {
      const cleaned = {
        ...data,
        currencyCode: data.currencyCode || undefined,
      };
      if (editingSupplier) {
        updateMutation.mutate(cleaned);
      } else {
        createMutation.mutate(cleaned);
      }
    })(e);
  }

  function handleDelete(supplier: Supplier) {
    setDeletingSupplier(supplier);
    setDeleteDialogOpen(true);
  }

  // --- Columns ---

  const columns: ColumnDef<Supplier, unknown>[] = [
    { accessorKey: "supplierCode", header: "Code" },
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "currencyCode",
      header: "Currency",
      cell: ({ row }) => row.original.currencyCode ?? "-",
    },
    {
      accessorKey: "isImport",
      header: "Import",
      cell: ({ row }) =>
        row.original.isImport ? <Badge variant="warning">Import</Badge> : null,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(row.original);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.original);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Suppliers</h1>
        <p className="text-sm text-zinc-500">{suppliersData?.total ?? 0} suppliers total</p>
      </div>

      <DataTable
        columns={columns}
        data={suppliersData?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search suppliers..."
        isLoading={isLoading}
        emptyMessage="No suppliers found."
        toolbarActions={
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <FormDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        title={editingSupplier ? "Edit Supplier" : "Create Supplier"}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        className="max-w-2xl"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="supplierCode">Supplier Code *</Label>
            <Input id="supplierCode" {...form.register("supplierCode")} />
            {form.formState.errors.supplierCode && (
              <p className="text-xs text-red-500">{form.formState.errors.supplierCode.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="address">Address</Label>
          <textarea
            id="address"
            {...form.register("address")}
            className="flex w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700"
            rows={2}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="currencyCode">Currency</Label>
            <Select id="currencyCode" {...form.register("currencyCode")}>
              <SelectOption value="">Select Currency</SelectOption>
              {currencies.map((c) => (
                <SelectOption key={c.id} value={c.currencyCode}>
                  {c.name} ({c.currencyCode})
                </SelectOption>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" id="isImport" {...form.register("isImport")} className="rounded" />
            <Label htmlFor="isImport">Import Supplier</Label>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="terms">Terms</Label>
          <textarea
            id="terms"
            {...form.register("terms")}
            className="flex w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700"
            rows={3}
          />
        </div>
      </FormDialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Supplier"
        description={`Are you sure you want to delete "${deletingSupplier?.name}"? This action cannot be undone.`}
        onConfirm={() => deletingSupplier && deleteMutation.mutate(deletingSupplier.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
