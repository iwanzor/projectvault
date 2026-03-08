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
interface QuotationTerm {
  id: number;
  quotationTermsCode: string;
  terms: string;
}

interface ListResponse {
  data: QuotationTerm[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const quotationTermSchema = z.object({
  quotationTermsCode: z.string().min(1, "Code is required").max(50),
  terms: z.string().min(1, "Terms content is required"),
});

type QuotationTermForm = z.infer<typeof quotationTermSchema>;

// --- API ---
const API = "/api/setup/quotation-terms";

function fetchQuotationTerms() {
  return fetchApi<ListResponse>(`${API}?pageSize=1000`);
}

function createQuotationTerm(data: QuotationTermForm) {
  return fetchApi<QuotationTerm>(API, { method: "POST", body: JSON.stringify(data) });
}

function updateQuotationTerm(id: number, data: QuotationTermForm) {
  return fetchApi<QuotationTerm>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteQuotationTerm(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<QuotationTerm>[] = [
  {
    accessorKey: "quotationTermsCode",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Code <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "terms",
    header: "Terms",
    cell: ({ row }) => {
      const terms = row.original.terms;
      return terms.length > 80 ? terms.slice(0, 80) + "..." : terms;
    },
  },
];

// --- Page ---
export default function QuotationTermsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<QuotationTerm | null>(null);

  const form = useForm<QuotationTermForm>({
    resolver: zodResolver(quotationTermSchema),
    defaultValues: { quotationTermsCode: "", terms: "" },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["quotation-terms"],
    queryFn: fetchQuotationTerms,
  });

  const createMutation = useMutation({
    mutationFn: (values: QuotationTermForm) => createQuotationTerm(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation-terms"] });
      toast.success("Quotation term created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: QuotationTermForm) => updateQuotationTerm(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation-terms"] });
      toast.success("Quotation term updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteQuotationTerm(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation-terms"] });
      toast.success("Quotation term deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ quotationTermsCode: "", terms: "" });
    setFormOpen(true);
  }

  function openEdit(qt: QuotationTerm) {
    setSelected(qt);
    form.reset({ quotationTermsCode: qt.quotationTermsCode, terms: qt.terms });
    setFormOpen(true);
  }

  function openDelete(qt: QuotationTerm) {
    setSelected(qt);
    setDeleteOpen(true);
  }

  function onSubmit(values: QuotationTermForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<QuotationTerm>[] = [
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
        <h1 className="text-2xl font-semibold">Quotation Terms</h1>
        <p className="text-sm text-zinc-500">Manage standard quotation terms and conditions templates.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="quotationTermsCode"
        searchPlaceholder="Search by code..."
        isLoading={isLoading}
        emptyMessage="No quotation terms found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Term
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Quotation Term" : "Add Quotation Term"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="quotationTermsCode">Code</Label>
          <Input id="quotationTermsCode" {...form.register("quotationTermsCode")} />
          {form.formState.errors.quotationTermsCode && (
            <p className="text-sm text-red-500">{form.formState.errors.quotationTermsCode.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="terms">Terms</Label>
          <textarea
            id="terms"
            rows={5}
            className="flex w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700"
            {...form.register("terms")}
          />
          {form.formState.errors.terms && (
            <p className="text-sm text-red-500">{form.formState.errors.terms.message}</p>
          )}
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Quotation Term"
        description={`Are you sure you want to delete "${selected?.quotationTermsCode}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
