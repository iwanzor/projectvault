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

interface Customer {
  id: number;
  customerCode: string;
  name: string;
  address: string | null;
  areaId: number | null;
  cityId: number | null;
  phone: string | null;
  email: string | null;
  contactPerson1: string | null;
  isExport: boolean;
  area?: { id: number; name: string; city?: { id: number; name: string; country?: { name: string } } } | null;
  city?: { id: number; name: string } | null;
}

interface AreaOption {
  id: number;
  name: string;
  city?: { id: number; name: string; country?: { name: string } };
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---

const customerSchema = z.object({
  customerCode: z.string().min(1, "Customer code is required"),
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  areaId: z.coerce.number().optional(),
  contactPerson1: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  isExport: z.boolean(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

// --- Component ---

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = React.useState<Customer | null>(null);

  // --- Data fetching ---

  const { data: customersData, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => fetchApi<PaginatedResponse<Customer>>("/api/setup/customers?pageSize=200"),
  });

  const { data: areas = [] } = useQuery({
    queryKey: ["areas-lookup"],
    queryFn: () => fetchApi<PaginatedResponse<AreaOption>>("/api/setup/areas?pageSize=500").then((r) => r.data),
  });

  // --- Form ---

  const form = useForm<CustomerFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      customerCode: "",
      name: "",
      address: "",
      areaId: undefined,
      contactPerson1: "",
      email: "",
      phone: "",
      isExport: false,
    },
  });

  // --- Mutations ---

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormData) =>
      fetchApi<Customer>("/api/setup/customers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created successfully");
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CustomerFormData) =>
      fetchApi<Customer>(`/api/setup/customers/${editingCustomer!.id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated successfully");
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/api/setup/customers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingCustomer(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // --- Handlers ---

  function handleOpenCreate() {
    setEditingCustomer(null);
    form.reset({
      customerCode: "",
      name: "",
      address: "",
      areaId: undefined,
      contactPerson1: "",
      email: "",
      phone: "",
      isExport: false,
    });
    setDialogOpen(true);
  }

  function handleOpenEdit(customer: Customer) {
    setEditingCustomer(customer);
    form.reset({
      customerCode: customer.customerCode,
      name: customer.name,
      address: customer.address ?? "",
      areaId: customer.areaId ?? undefined,
      contactPerson1: customer.contactPerson1 ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      isExport: customer.isExport,
    });
    setDialogOpen(true);
  }

  function handleCloseDialog() {
    setDialogOpen(false);
    setEditingCustomer(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    form.handleSubmit((data) => {
      const cleaned = {
        ...data,
        areaId: data.areaId || undefined,
        email: data.email || undefined,
      };
      if (editingCustomer) {
        updateMutation.mutate(cleaned);
      } else {
        createMutation.mutate(cleaned);
      }
    })(e);
  }

  function handleDelete(customer: Customer) {
    setDeletingCustomer(customer);
    setDeleteDialogOpen(true);
  }

  // --- Columns ---

  const columns: ColumnDef<Customer, unknown>[] = [
    { accessorKey: "customerCode", header: "Code" },
    { accessorKey: "name", header: "Name" },
    {
      id: "area",
      header: "Area",
      cell: ({ row }) => {
        const area = row.original.area;
        if (!area) return "-";
        const cityName = area.city?.name ?? "";
        return cityName ? `${area.name}, ${cityName}` : area.name;
      },
    },
    { accessorKey: "contactPerson1", header: "Contact", cell: ({ row }) => row.original.contactPerson1 ?? "-" },
    { accessorKey: "phone", header: "Phone", cell: ({ row }) => row.original.phone ?? "-" },
    { accessorKey: "email", header: "Email", cell: ({ row }) => row.original.email ?? "-" },
    {
      accessorKey: "isExport",
      header: "Export",
      cell: ({ row }) =>
        row.original.isExport ? <Badge variant="warning">Export</Badge> : null,
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
        <h1 className="text-2xl font-semibold">Customers</h1>
        <p className="text-sm text-zinc-500">{customersData?.total ?? 0} customers total</p>
      </div>

      <DataTable
        columns={columns}
        data={customersData?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search customers..."
        isLoading={isLoading}
        emptyMessage="No customers found."
        toolbarActions={
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <FormDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        title={editingCustomer ? "Edit Customer" : "Create Customer"}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        className="max-w-2xl"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="customerCode">Customer Code *</Label>
            <Input id="customerCode" {...form.register("customerCode")} />
            {form.formState.errors.customerCode && (
              <p className="text-xs text-red-500">{form.formState.errors.customerCode.message}</p>
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
            <Label htmlFor="areaId">Area</Label>
            <Select id="areaId" {...form.register("areaId")}>
              <SelectOption value="">Select Area</SelectOption>
              {areas.map((a) => (
                <SelectOption key={a.id} value={String(a.id)}>
                  {a.name}{a.city ? `, ${a.city.name}` : ""}
                </SelectOption>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="contactPerson1">Contact Person</Label>
            <Input id="contactPerson1" {...form.register("contactPerson1")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isExport" {...form.register("isExport")} className="rounded" />
          <Label htmlFor="isExport">Export Customer</Label>
        </div>
      </FormDialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Customer"
        description={`Are you sure you want to delete "${deletingCustomer?.name}"? This action cannot be undone.`}
        onConfirm={() => deletingCustomer && deleteMutation.mutate(deletingCustomer.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
