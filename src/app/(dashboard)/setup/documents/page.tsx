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
interface DocumentInfo {
  id: number;
  documentCode: string;
  description: string;
}

interface ListResponse {
  data: DocumentInfo[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const documentSchema = z.object({
  documentCode: z.string().min(1, "Code is required").max(50),
  description: z.string().min(1, "Description is required").max(100),
});

type DocumentForm = z.infer<typeof documentSchema>;

// --- API ---
const API = "/api/setup/documents";

function fetchDocuments() {
  return fetchApi<ListResponse>(`${API}?pageSize=1000`);
}

function createDocument(data: DocumentForm) {
  return fetchApi<DocumentInfo>(API, { method: "POST", body: JSON.stringify(data) });
}

function updateDocument(id: number, data: DocumentForm) {
  return fetchApi<DocumentInfo>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteDocument(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<DocumentInfo>[] = [
  {
    accessorKey: "documentCode",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Code <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Description <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const desc = row.original.description;
      return desc.length > 80 ? desc.slice(0, 80) + "..." : desc;
    },
  },
];

// --- Page ---
export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<DocumentInfo | null>(null);

  const form = useForm<DocumentForm>({
    resolver: zodResolver(documentSchema),
    defaultValues: { documentCode: "", description: "" },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  });

  const createMutation = useMutation({
    mutationFn: (values: DocumentForm) => createDocument(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document info created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: DocumentForm) => updateDocument(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document info updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDocument(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document info deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ documentCode: "", description: "" });
    setFormOpen(true);
  }

  function openEdit(doc: DocumentInfo) {
    setSelected(doc);
    form.reset({ documentCode: doc.documentCode, description: doc.description });
    setFormOpen(true);
  }

  function openDelete(doc: DocumentInfo) {
    setSelected(doc);
    setDeleteOpen(true);
  }

  function onSubmit(values: DocumentForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<DocumentInfo>[] = [
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
        <h1 className="text-2xl font-semibold">Document Info</h1>
        <p className="text-sm text-zinc-500">Manage document templates and settings.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="documentCode"
        searchPlaceholder="Search by code..."
        isLoading={isLoading}
        emptyMessage="No documents found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Document
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Document Info" : "Add Document Info"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="documentCode">Code</Label>
          <Input id="documentCode" {...form.register("documentCode")} />
          {form.formState.errors.documentCode && (
            <p className="text-sm text-red-500">{form.formState.errors.documentCode.message}</p>
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
        title="Delete Document Info"
        description={`Are you sure you want to delete "${selected?.documentCode}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
