"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

import { fetchApi } from "@/lib/api";
import { DataTable } from "@/components/data-display/data-table";
import { FormDialog } from "@/components/forms/form-dialog";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { CurrencyDisplay } from "@/components/data-display/currency-display";

// --- Types ---

interface FsfMaster {
  id: number;
  note: string;
  description: string;
  type: string;
  reportMode: string;
  nature: string;
  category: string;
  amount: number;
  branchCode: string;
}

interface FsfReportData {
  branchCode: string;
  items: Array<{
    note: string;
    description: string;
    type: string;
    amount: number;
  }>;
  totals: Record<string, number>;
}

// --- Schema ---

const fsfSchema = z.object({
  note: z.string().min(1, "Note is required"),
  description: z.string().min(1, "Description is required"),
  type: z.string().min(1, "Type is required"),
  reportMode: z.string().min(1, "Report mode is required"),
  nature: z.string().min(1, "Nature is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().default(0),
  branchCode: z.string().min(1, "Branch code is required"),
});

type FsfFormData = z.infer<typeof fsfSchema>;

// --- Component ---

export default function FinancialStatementsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<FsfMaster | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [target, setTarget] = React.useState<FsfMaster | null>(null);
  const [branchFilter, setBranchFilter] = React.useState("");
  const [showReport, setShowReport] = React.useState(false);

  const form = useForm<FsfFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(fsfSchema) as any,
    defaultValues: {
      note: "",
      description: "",
      type: "",
      reportMode: "",
      nature: "",
      category: "",
      amount: 0,
      branchCode: "",
    },
  });

  // --- Data Fetching ---

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["fsf-records"],
    queryFn: () => fetchApi<FsfMaster[]>("/api/reports/fsf"),
  });

  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ["fsf-report", branchFilter],
    queryFn: () => fetchApi<FsfReportData>(`/api/reports/fsf/report?branchCode=${branchFilter}`),
    enabled: showReport && !!branchFilter,
  });

  // --- Mutations ---

  const createMutation = useMutation({
    mutationFn: (data: FsfFormData) =>
      fetchApi("/api/reports/fsf", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fsf-records"] });
      toast.success("FSF record created");
      setFormOpen(false);
      setEditing(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FsfFormData }) =>
      fetchApi(`/api/reports/fsf/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fsf-records"] });
      toast.success("FSF record updated");
      setFormOpen(false);
      setEditing(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/api/reports/fsf/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fsf-records"] });
      toast.success("FSF record deleted");
      setDeleteOpen(false);
      setTarget(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // --- Handlers ---

  function handleCreate() {
    setEditing(null);
    form.reset({
      note: "",
      description: "",
      type: "",
      reportMode: "",
      nature: "",
      category: "",
      amount: 0,
      branchCode: "",
    });
    setFormOpen(true);
  }

  function handleEdit(record: FsfMaster) {
    setEditing(record);
    form.reset({
      note: record.note,
      description: record.description,
      type: record.type,
      reportMode: record.reportMode,
      nature: record.nature,
      category: record.category,
      amount: Number(record.amount),
      branchCode: record.branchCode,
    });
    setFormOpen(true);
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    form.handleSubmit((data) => {
      if (editing) {
        updateMutation.mutate({ id: editing.id, data });
      } else {
        createMutation.mutate(data);
      }
    })(e);
  }

  function handleGenerateReport() {
    if (!branchFilter) {
      toast.error("Please select a branch code first");
      return;
    }
    setShowReport(true);
  }

  // --- Columns ---

  const columns: ColumnDef<FsfMaster, unknown>[] = [
    { accessorKey: "note", header: "Note" },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate block">{row.original.description}</span>
      ),
    },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "reportMode", header: "Report Mode" },
    { accessorKey: "nature", header: "Nature" },
    { accessorKey: "category", header: "Category" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.amount)} />,
    },
    { accessorKey: "branchCode", header: "Branch" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex items-center gap-1">
            <PermissionGate module="REPORTS" action="edit">
              <Button
                variant="ghost"
                size="icon"
                title="Edit"
                onClick={(e) => { e.stopPropagation(); handleEdit(r); }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </PermissionGate>
            <PermissionGate module="REPORTS" action="delete">
              <Button
                variant="ghost"
                size="icon"
                title="Delete"
                onClick={(e) => { e.stopPropagation(); setTarget(r); setDeleteOpen(true); }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </PermissionGate>
          </div>
        );
      },
    },
  ];

  // Unique branch codes for filtering
  const branchCodes = React.useMemo(
    () => [...new Set(records.map((r) => r.branchCode).filter(Boolean))],
    [records]
  );

  const currencyFmt = new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 2,
  });

  return (
    <PermissionGate module="REPORTS" action="viewAll" fallback={<p>You do not have permission to view reports.</p>}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Financial Statements (FSF)</h1>
            <p className="text-sm text-zinc-500">Manage financial statement records</p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={branchFilter}
              onChange={(e) => { setBranchFilter(e.target.value); setShowReport(false); }}
              className="h-8 w-[140px]"
            >
              <SelectOption value="">Branch...</SelectOption>
              {branchCodes.map((code) => (
                <SelectOption key={code} value={code}>{code}</SelectOption>
              ))}
            </Select>
            <Button variant="outline" size="sm" onClick={handleGenerateReport} disabled={!branchFilter}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Generated Report */}
        {showReport && branchFilter && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <h3 className="text-sm font-medium mb-3">Financial Statement - Branch: {branchFilter}</h3>
            {reportLoading ? (
              <p className="text-sm text-zinc-500">Loading report...</p>
            ) : reportData?.items?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left py-2 pr-4 font-medium text-zinc-500">Note</th>
                      <th className="text-left py-2 pr-4 font-medium text-zinc-500">Description</th>
                      <th className="text-left py-2 pr-4 font-medium text-zinc-500">Type</th>
                      <th className="text-right py-2 font-medium text-zinc-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2 pr-4">{item.note}</td>
                        <td className="py-2 pr-4">{item.description}</td>
                        <td className="py-2 pr-4">{item.type}</td>
                        <td className="py-2 text-right">{currencyFmt.format(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {reportData.totals && Object.keys(reportData.totals).length > 0 && (
                    <tfoot>
                      {Object.entries(reportData.totals).map(([label, total]) => (
                        <tr key={label} className="border-t-2 border-zinc-300 dark:border-zinc-600 font-medium">
                          <td colSpan={3} className="py-2 pr-4">{label}</td>
                          <td className="py-2 text-right">{currencyFmt.format(total)}</td>
                        </tr>
                      ))}
                    </tfoot>
                  )}
                </table>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No report data available for this branch.</p>
            )}
          </div>
        )}

        {/* FSF Records Table */}
        <DataTable
          columns={columns}
          data={records}
          searchKey="note"
          searchPlaceholder="Filter by note..."
          isLoading={isLoading}
          emptyMessage="No FSF records found."
          toolbarActions={
            <PermissionGate module="REPORTS" action="add">
              <Button size="sm" onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                New Record
              </Button>
            </PermissionGate>
          }
        />

        {/* Form Dialog */}
        <FormDialog
          open={formOpen}
          onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null); }}
          title={editing ? "Edit FSF Record" : "New FSF Record"}
          onSubmit={handleFormSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          className="max-w-2xl"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="fsf-note">Note *</Label>
              <Input id="fsf-note" {...form.register("note")} />
              {form.formState.errors.note && (
                <p className="text-xs text-red-500">{form.formState.errors.note.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="fsf-type">Type *</Label>
              <Input id="fsf-type" {...form.register("type")} />
              {form.formState.errors.type && (
                <p className="text-xs text-red-500">{form.formState.errors.type.message}</p>
              )}
            </div>
            <div className="space-y-1 col-span-2">
              <Label htmlFor="fsf-desc">Description *</Label>
              <Input id="fsf-desc" {...form.register("description")} />
              {form.formState.errors.description && (
                <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="fsf-report-mode">Report Mode *</Label>
              <Input id="fsf-report-mode" {...form.register("reportMode")} />
              {form.formState.errors.reportMode && (
                <p className="text-xs text-red-500">{form.formState.errors.reportMode.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="fsf-nature">Nature *</Label>
              <Input id="fsf-nature" {...form.register("nature")} />
              {form.formState.errors.nature && (
                <p className="text-xs text-red-500">{form.formState.errors.nature.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="fsf-category">Category *</Label>
              <Input id="fsf-category" {...form.register("category")} />
              {form.formState.errors.category && (
                <p className="text-xs text-red-500">{form.formState.errors.category.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="fsf-amount">Amount</Label>
              <Input id="fsf-amount" type="number" step="0.01" {...form.register("amount")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fsf-branch">Branch Code *</Label>
              <Input id="fsf-branch" {...form.register("branchCode")} />
              {form.formState.errors.branchCode && (
                <p className="text-xs text-red-500">{form.formState.errors.branchCode.message}</p>
              )}
            </div>
          </div>
        </FormDialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete FSF Record"
          description={`Are you sure you want to delete record "${target?.note}"? This action cannot be undone.`}
          onConfirm={() => target && deleteMutation.mutate(target.id)}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </PermissionGate>
  );
}
