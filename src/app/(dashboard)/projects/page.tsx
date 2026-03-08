"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

import { fetchApi } from "@/lib/api";
import { DataTable, ColorRule } from "@/components/data-display/data-table";
import { StatusBadge } from "@/components/data-display/status-badge";
import { CurrencyDisplay } from "@/components/data-display/currency-display";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { FormDialog } from "@/components/forms/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";

// --- Types ---

interface Project {
  id: number;
  projectNo: string;
  projectDate: string;
  projectName: string;
  description: string | null;
  status: string;
  netAmount: number;
  customerId: number;
  customer?: { id: number; name: string };
  projectManager?: { id: number; name: string } | null;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface CustomerLookup {
  id: number;
  name: string;
}

interface QuotationLookup {
  id: number;
  quotationNo: string;
  description: string | null;
  customer?: { id: number; name: string };
  netAmount: number;
}

const projectStatusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  active: { label: "Active", variant: "default" },
  on_hold: { label: "On Hold", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

// --- Component ---

export default function ProjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [customerFilter, setCustomerFilter] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [targetProject, setTargetProject] = React.useState<Project | null>(null);
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = React.useState(false);
  const [pendingStatus, setPendingStatus] = React.useState("");
  const [convertDialogOpen, setConvertDialogOpen] = React.useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = React.useState("");

  // --- Data fetching ---

  const buildParams = () => {
    const params = new URLSearchParams({ pageSize: "200" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (customerFilter) params.set("customerId", customerFilter);
    params.set("sortBy", "projectDate");
    params.set("sortOrder", "desc");
    return params.toString();
  };

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ["projects", search, statusFilter, customerFilter],
    queryFn: () => fetchApi<PaginatedResponse<Project>>(`/api/projects?${buildParams()}`),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-lookup"],
    queryFn: () =>
      fetchApi<PaginatedResponse<CustomerLookup>>("/api/setup/customers?pageSize=500").then((r) => r.data),
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ["quotations-for-conversion"],
    queryFn: () =>
      fetchApi<PaginatedResponse<QuotationLookup>>("/api/sales/quotations?status=SUBMITTED&pageSize=500").then((r) => r.data),
    enabled: convertDialogOpen,
  });

  // --- Mutations ---

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/api/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully");
      setDeleteDialogOpen(false);
      setTargetProject(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetchApi(`/api/projects/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project status updated");
      setStatusChangeDialogOpen(false);
      setTargetProject(null);
      setPendingStatus("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // --- Handlers ---

  function handleDelete(project: Project) {
    setTargetProject(project);
    setDeleteDialogOpen(true);
  }

  function handleStatusChange(project: Project, status: string) {
    setTargetProject(project);
    setPendingStatus(status);
    setStatusChangeDialogOpen(true);
  }

  function handleConvertSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedQuotationId) {
      router.push(`/projects/new?quotationId=${selectedQuotationId}`);
      setConvertDialogOpen(false);
      setSelectedQuotationId("");
    }
  }

  // --- Columns ---

  const columns: ColumnDef<Project, unknown>[] = [
    { accessorKey: "projectNo", header: "Project No" },
    {
      accessorKey: "projectDate",
      header: "Date",
      cell: ({ row }) => {
        try {
          return format(new Date(row.original.projectDate), "dd/MM/yyyy");
        } catch {
          return row.original.projectDate;
        }
      },
    },
    {
      id: "customerName",
      header: "Customer",
      accessorFn: (row) => row.customer?.name ?? "-",
    },
    { accessorKey: "projectName", header: "Project Name" },
    {
      id: "pm",
      header: "PM",
      cell: ({ row }) => row.original.projectManager?.name ?? "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} statusMap={projectStatusMap} />
      ),
    },
    {
      accessorKey: "netAmount",
      header: "Net Amount",
      cell: ({ row }) => <CurrencyDisplay amount={Number(row.original.netAmount)} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const p = row.original;
        const isActive = p.status === "ACTIVE";
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="View"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/projects/${p.id}`);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {isActive && (
              <>
                <Select
                  className="h-7 w-[120px] text-xs"
                  value=""
                  onChange={(e) => {
                    e.stopPropagation();
                    if (e.target.value) {
                      handleStatusChange(p, e.target.value);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <SelectOption value="">Status...</SelectOption>
                  <SelectOption value="COMPLETED">Complete</SelectOption>
                  <SelectOption value="ON_HOLD">On Hold</SelectOption>
                  <SelectOption value="CANCELLED">Cancel</SelectOption>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const colorRules: ColorRule<Project>[] = [
    { condition: (row) => row.status === "ACTIVE", className: "" },
    { condition: (row) => row.status === "ON_HOLD", className: "bg-yellow-50 dark:bg-yellow-950/20" },
    { condition: (row) => row.status === "COMPLETED", className: "bg-green-50 dark:bg-green-950/20" },
    { condition: (row) => row.status === "CANCELLED", className: "bg-gray-50/80 dark:bg-gray-900/30 opacity-75" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-zinc-500">
            {projectsData?.total ?? 0} projects total
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search project no, name, customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-[250px]"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 w-[150px]"
        >
          <SelectOption value="">All Status</SelectOption>
          <SelectOption value="ACTIVE">Active</SelectOption>
          <SelectOption value="ON_HOLD">On Hold</SelectOption>
          <SelectOption value="COMPLETED">Completed</SelectOption>
          <SelectOption value="CANCELLED">Cancelled</SelectOption>
        </Select>
        <Select
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="h-8 w-[180px]"
        >
          <SelectOption value="">All Customers</SelectOption>
          {customers.map((c) => (
            <SelectOption key={c.id} value={String(c.id)}>
              {c.name}
            </SelectOption>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={projectsData?.data ?? []}
        searchKey="projectNo"
        searchPlaceholder="Filter by project no..."
        isLoading={isLoading}
        emptyMessage="No projects found."
        colorRules={colorRules}
        onRowClick={(row) => router.push(`/projects/${row.id}`)}
        toolbarActions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setConvertDialogOpen(true)}>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Convert from Quotation
            </Button>
            <Button size="sm" onClick={() => router.push("/projects/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        }
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Project"
        description={`Are you sure you want to delete project "${targetProject?.projectNo}"? This action cannot be undone.`}
        onConfirm={() => targetProject && deleteMutation.mutate(targetProject.id)}
        isLoading={deleteMutation.isPending}
      />

      {/* Status Change Confirmation */}
      <ConfirmDialog
        open={statusChangeDialogOpen}
        onOpenChange={setStatusChangeDialogOpen}
        title="Change Project Status"
        description={`Are you sure you want to change project "${targetProject?.projectNo}" status to ${pendingStatus}?`}
        confirmLabel="Change Status"
        onConfirm={() => targetProject && statusMutation.mutate({ id: targetProject.id, status: pendingStatus })}
        isLoading={statusMutation.isPending}
        variant="default"
      />

      {/* Convert from Quotation Dialog */}
      <FormDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        title="Convert Quotation to Project"
        description="Select a submitted quotation to convert into a project."
        onSubmit={handleConvertSubmit}
        submitLabel="Continue"
      >
        <div className="space-y-1">
          <Label htmlFor="quotationSelect">Quotation</Label>
          <Select
            id="quotationSelect"
            value={selectedQuotationId}
            onChange={(e) => setSelectedQuotationId(e.target.value)}
          >
            <SelectOption value="">Select Quotation</SelectOption>
            {quotations.map((q) => (
              <SelectOption key={q.id} value={String(q.id)}>
                {q.quotationNo} - {q.customer?.name ?? "Unknown"} ({Number(q.netAmount).toFixed(2)})
              </SelectOption>
            ))}
          </Select>
        </div>
      </FormDialog>
    </div>
  );
}
