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
interface Remark {
  id: number;
  remarkCode: string;
  name: string;
  description: string | null;
}

interface ListResponse {
  data: Remark[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const remarkSchema = z.object({
  remarkCode: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().default(""),
});

type RemarkForm = z.infer<typeof remarkSchema>;

// --- API ---
const API = "/api/accounting/remarks";

function fetchRemarks() {
  return fetchApi<ListResponse>(`${API}?pageSize=1000`);
}

function createRemark(data: RemarkForm) {
  return fetchApi<Remark>(API, { method: "POST", body: JSON.stringify(data) });
}

function updateRemark(id: number, data: RemarkForm) {
  return fetchApi<Remark>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteRemark(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<Remark>[] = [
  {
    accessorKey: "remarkCode",
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
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => row.original.description || "-",
  },
];

// --- Page ---
export default function RemarksPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Remark | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<RemarkForm>({
    resolver: zodResolver(remarkSchema) as any,
    defaultValues: { remarkCode: "", name: "", description: "" },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["remarks"],
    queryFn: fetchRemarks,
  });

  const createMutation = useMutation({
    mutationFn: (values: RemarkForm) => createRemark(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remarks"] });
      toast.success("Remark created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: RemarkForm) => updateRemark(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remarks"] });
      toast.success("Remark updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRemark(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remarks"] });
      toast.success("Remark deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ remarkCode: "", name: "", description: "" });
    setFormOpen(true);
  }

  function openEdit(item: Remark) {
    setSelected(item);
    form.reset({ remarkCode: item.remarkCode, name: item.name, description: item.description ?? "" });
    setFormOpen(true);
  }

  function openDelete(item: Remark) {
    setSelected(item);
    setDeleteOpen(true);
  }

  function onSubmit(values: RemarkForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<Remark>[] = [
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
        <h1 className="text-2xl font-semibold">Remarks</h1>
        <p className="text-sm text-zinc-500">Manage remark templates for transactions.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search remarks..."
        isLoading={isLoading}
        emptyMessage="No remarks found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Remark
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Remark" : "Add Remark"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="remarkCode">Code</Label>
          <Input id="remarkCode" {...form.register("remarkCode")} />
          {form.formState.errors.remarkCode && (
            <p className="text-sm text-red-500">{form.formState.errors.remarkCode.message}</p>
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
          <Label htmlFor="description">Description</Label>
          <Input id="description" {...form.register("description")} />
          {form.formState.errors.description && (
            <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
          )}
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Remark"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
