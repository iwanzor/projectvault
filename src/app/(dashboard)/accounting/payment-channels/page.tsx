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
interface PaymentChannel {
  id: number;
  paymentChannelCode: string;
  name: string;
}

interface ListResponse {
  data: PaymentChannel[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const paymentChannelSchema = z.object({
  paymentChannelCode: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(100),
});

type PaymentChannelForm = z.infer<typeof paymentChannelSchema>;

// --- API ---
const API = "/api/accounting/payment-channels";

function fetchPaymentChannels() {
  return fetchApi<ListResponse>(`${API}?pageSize=1000`);
}

function createPaymentChannel(data: PaymentChannelForm) {
  return fetchApi<PaymentChannel>(API, { method: "POST", body: JSON.stringify(data) });
}

function updatePaymentChannel(id: number, data: PaymentChannelForm) {
  return fetchApi<PaymentChannel>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deletePaymentChannel(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<PaymentChannel>[] = [
  {
    accessorKey: "paymentChannelCode",
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
export default function PaymentChannelsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<PaymentChannel | null>(null);

  const form = useForm<PaymentChannelForm>({
    resolver: zodResolver(paymentChannelSchema),
    defaultValues: { paymentChannelCode: "", name: "" },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["payment-channels"],
    queryFn: fetchPaymentChannels,
  });

  const createMutation = useMutation({
    mutationFn: (values: PaymentChannelForm) => createPaymentChannel(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-channels"] });
      toast.success("Payment channel created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: PaymentChannelForm) => updatePaymentChannel(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-channels"] });
      toast.success("Payment channel updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePaymentChannel(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-channels"] });
      toast.success("Payment channel deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ paymentChannelCode: "", name: "" });
    setFormOpen(true);
  }

  function openEdit(item: PaymentChannel) {
    setSelected(item);
    form.reset({ paymentChannelCode: item.paymentChannelCode, name: item.name });
    setFormOpen(true);
  }

  function openDelete(item: PaymentChannel) {
    setSelected(item);
    setDeleteOpen(true);
  }

  function onSubmit(values: PaymentChannelForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<PaymentChannel>[] = [
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
        <h1 className="text-2xl font-semibold">Payment Channels</h1>
        <p className="text-sm text-zinc-500">Manage payment channels and routing.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search payment channels..."
        isLoading={isLoading}
        emptyMessage="No payment channels found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Payment Channel
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Payment Channel" : "Add Payment Channel"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="paymentChannelCode">Code</Label>
          <Input id="paymentChannelCode" {...form.register("paymentChannelCode")} />
          {form.formState.errors.paymentChannelCode && (
            <p className="text-sm text-red-500">{form.formState.errors.paymentChannelCode.message}</p>
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
        title="Delete Payment Channel"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
