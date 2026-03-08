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
interface PaymentType {
  id: number;
  paymentTypeCode: string;
  name: string;
}

interface ListResponse {
  data: PaymentType[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const paymentTypeSchema = z.object({
  paymentTypeCode: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(100),
});

type PaymentTypeForm = z.infer<typeof paymentTypeSchema>;

// --- API ---
const API = "/api/accounting/payment-types";

function fetchPaymentTypes() {
  return fetchApi<ListResponse>(`${API}?pageSize=1000`);
}

function createPaymentType(data: PaymentTypeForm) {
  return fetchApi<PaymentType>(API, { method: "POST", body: JSON.stringify(data) });
}

function updatePaymentType(id: number, data: PaymentTypeForm) {
  return fetchApi<PaymentType>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deletePaymentType(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<PaymentType>[] = [
  {
    accessorKey: "paymentTypeCode",
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
export default function PaymentTypesPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<PaymentType | null>(null);

  const form = useForm<PaymentTypeForm>({
    resolver: zodResolver(paymentTypeSchema),
    defaultValues: { paymentTypeCode: "", name: "" },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["payment-types"],
    queryFn: fetchPaymentTypes,
  });

  const createMutation = useMutation({
    mutationFn: (values: PaymentTypeForm) => createPaymentType(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-types"] });
      toast.success("Payment type created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: PaymentTypeForm) => updatePaymentType(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-types"] });
      toast.success("Payment type updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePaymentType(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-types"] });
      toast.success("Payment type deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ paymentTypeCode: "", name: "" });
    setFormOpen(true);
  }

  function openEdit(item: PaymentType) {
    setSelected(item);
    form.reset({ paymentTypeCode: item.paymentTypeCode, name: item.name });
    setFormOpen(true);
  }

  function openDelete(item: PaymentType) {
    setSelected(item);
    setDeleteOpen(true);
  }

  function onSubmit(values: PaymentTypeForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<PaymentType>[] = [
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
        <h1 className="text-2xl font-semibold">Payment Types</h1>
        <p className="text-sm text-zinc-500">Manage payment type classifications.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search payment types..."
        isLoading={isLoading}
        emptyMessage="No payment types found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Payment Type
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Payment Type" : "Add Payment Type"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="paymentTypeCode">Code</Label>
          <Input id="paymentTypeCode" {...form.register("paymentTypeCode")} />
          {form.formState.errors.paymentTypeCode && (
            <p className="text-sm text-red-500">{form.formState.errors.paymentTypeCode.message}</p>
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
        title="Delete Payment Type"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
