"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { fetchApi } from "@/lib/api";
import { DataTable } from "@/components/data-display/data-table";
import { FormDialog } from "@/components/forms/form-dialog";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";

// --- Types ---

interface ComboParent {
  id: number;
  barcode: string;
  name: string;
  modelNo: string;
  salesRate: number;
  comboChildren?: ComboChild[];
  _count?: { comboChildren: number };
}

interface ComboChild {
  id: number;
  parentItemId: number;
  childItemId: number;
  quantity: number | null;
  childItem?: { id: number; name: string; barcode: string };
}

interface ItemOption {
  id: number;
  name: string;
  barcode: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---

const comboItemSchema = z.object({
  parentItemId: z.coerce.number().min(1, "Parent item is required"),
  children: z.array(
    z.object({
      childItemId: z.coerce.number().min(1, "Child item is required"),
      quantity: z.coerce.number().min(0.01, "Quantity must be > 0"),
    })
  ).min(1, "At least one child item is required"),
});

type ComboItemFormData = z.infer<typeof comboItemSchema>;

// --- Component ---

export default function ComboItemsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editingCombo, setEditingCombo] = React.useState<ComboParent | null>(null);
  const [deletingCombo, setDeletingCombo] = React.useState<ComboParent | null>(null);

  // --- Data fetching ---

  const { data: combosData, isLoading } = useQuery({
    queryKey: ["combo-items"],
    queryFn: () => fetchApi<PaginatedResponse<ComboParent>>("/api/setup/combo-items?pageSize=200"),
  });

  const { data: comboParentItems = [] } = useQuery({
    queryKey: ["combo-parent-items"],
    queryFn: () =>
      fetchApi<PaginatedResponse<ItemOption>>("/api/setup/items?pageSize=500&isCombo=true").then((r) => r.data),
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ["all-items-lookup"],
    queryFn: () => fetchApi<PaginatedResponse<ItemOption>>("/api/setup/items?pageSize=1000").then((r) => r.data),
  });

  // --- Form ---

  const form = useForm<ComboItemFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(comboItemSchema) as any,
    defaultValues: {
      parentItemId: 0,
      children: [{ childItemId: 0, quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "children",
  });

  // --- Mutations ---

  const createMutation = useMutation({
    mutationFn: (data: ComboItemFormData) =>
      fetchApi("/api/setup/combo-items", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combo-items"] });
      toast.success("Combo item created successfully");
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ComboItemFormData) =>
      fetchApi(`/api/setup/combo-items/${editingCombo!.id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combo-items"] });
      toast.success("Combo item updated successfully");
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/api/setup/combo-items/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combo-items"] });
      toast.success("Combo item deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingCombo(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // --- Handlers ---

  function handleOpenCreate() {
    setEditingCombo(null);
    form.reset({
      parentItemId: 0,
      children: [{ childItemId: 0, quantity: 1 }],
    });
    setDialogOpen(true);
  }

  function handleOpenEdit(combo: ComboParent) {
    setEditingCombo(combo);
    form.reset({
      parentItemId: combo.id,
      children:
        combo.comboChildren && combo.comboChildren.length > 0
          ? combo.comboChildren.map((c) => ({
              childItemId: c.childItemId,
              quantity: Number(c.quantity ?? 1),
            }))
          : [{ childItemId: 0, quantity: 1 }],
    });
    setDialogOpen(true);
  }

  function handleCloseDialog() {
    setDialogOpen(false);
    setEditingCombo(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    form.handleSubmit((data) => {
      if (editingCombo) {
        updateMutation.mutate(data);
      } else {
        createMutation.mutate(data);
      }
    })(e);
  }

  function handleDelete(combo: ComboParent) {
    setDeletingCombo(combo);
    setDeleteDialogOpen(true);
  }

  // --- Columns ---

  const columns: ColumnDef<ComboParent, unknown>[] = [
    { accessorKey: "barcode", header: "Barcode" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "modelNo", header: "Model" },
    {
      id: "childCount",
      header: "Children",
      cell: ({ row }) => {
        const count = row.original._count?.comboChildren ?? row.original.comboChildren?.length ?? 0;
        return <span>{count} items</span>;
      },
    },
    {
      accessorKey: "salesRate",
      header: "Sales Rate",
      cell: ({ row }) => Number(row.original.salesRate).toFixed(2),
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
        <h1 className="text-2xl font-semibold">Combo Items</h1>
        <p className="text-sm text-zinc-500">{combosData?.total ?? 0} combo items total</p>
      </div>

      <DataTable
        columns={columns}
        data={combosData?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search combo items..."
        isLoading={isLoading}
        emptyMessage="No combo items found."
        toolbarActions={
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Combo Item
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <FormDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        title={editingCombo ? "Edit Combo Item" : "Create Combo Item"}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-1">
          <Label htmlFor="parentItemId">Parent Combo Item *</Label>
          <Select
            id="parentItemId"
            {...form.register("parentItemId")}
            disabled={!!editingCombo}
          >
            <SelectOption value="0">Select Combo Item</SelectOption>
            {comboParentItems.map((item) => (
              <SelectOption key={item.id} value={String(item.id)}>
                {item.barcode} - {item.name}
              </SelectOption>
            ))}
          </Select>
          {form.formState.errors.parentItemId && (
            <p className="text-xs text-red-500">{form.formState.errors.parentItemId.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Child Items *</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ childItemId: 0, quantity: 1 })}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Row
            </Button>
          </div>
          {form.formState.errors.children && !Array.isArray(form.formState.errors.children) && (
            <p className="text-xs text-red-500">{form.formState.errors.children.message}</p>
          )}
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1 space-y-1">
                  <Select {...form.register(`children.${index}.childItemId`)}>
                    <SelectOption value="0">Select Item</SelectOption>
                    {allItems.map((item) => (
                      <SelectOption key={item.id} value={String(item.id)}>
                        {item.barcode} - {item.name}
                      </SelectOption>
                    ))}
                  </Select>
                  {form.formState.errors.children?.[index]?.childItemId && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.children[index]?.childItemId?.message}
                    </p>
                  )}
                </div>
                <div className="w-24 space-y-1">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Qty"
                    {...form.register(`children.${index}.quantity`, { valueAsNumber: true })}
                  />
                  {form.formState.errors.children?.[index]?.quantity && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.children[index]?.quantity?.message}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-0.5"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length <= 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </FormDialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Combo Item"
        description={`Are you sure you want to delete combo "${deletingCombo?.name}"? All child items will be removed.`}
        onConfirm={() => deletingCombo && deleteMutation.mutate(deletingCombo.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
