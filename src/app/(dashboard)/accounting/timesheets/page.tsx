"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { fetchApi } from "@/lib/api";
import { DataTable } from "@/components/data-display/data-table";
import { FormDialog } from "@/components/forms/form-dialog";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";

// --- Types ---

interface SelectItem {
  id: number;
  code?: string;
  name: string;
}

interface ProjectItem {
  id: number;
  projectNo: string;
  name: string;
}

interface Timesheet {
  id: number;
  date: string;
  employeeId: number;
  projectId: number;
  positionId: number | null;
  departmentId: number | null;
  statusId: number | null;
  regularHours: number;
  extraHours: number;
  totalHours: number;
  remarkId: number | null;
  employee?: { id: number; name: string };
  project?: { id: number; projectNo: string; name: string };
  position?: { id: number; name: string } | null;
  department?: { id: number; name: string } | null;
  status?: { id: number; name: string } | null;
  remark?: { id: number; name: string } | null;
}

interface TimesheetSummary {
  totalRegularHours: number;
  totalExtraHours: number;
  totalHours: number;
}

// --- Schema ---

const timesheetSchema = z.object({
  date: z.string().min(1, "Date is required"),
  employeeId: z.coerce.number().min(1, "Employee is required"),
  projectId: z.coerce.number().min(1, "Project is required"),
  positionId: z.coerce.number().optional(),
  departmentId: z.coerce.number().optional(),
  statusId: z.coerce.number().optional(),
  regularHours: z.coerce.number().min(0, "Min 0").default(0),
  extraHours: z.coerce.number().min(0, "Min 0").default(0),
  remarkId: z.coerce.number().optional(),
});

type TimesheetFormData = z.infer<typeof timesheetSchema>;

// --- Component ---

export default function TimesheetsPage() {
  const queryClient = useQueryClient();
  const [employeeFilter, setEmployeeFilter] = React.useState("");
  const [projectFilter, setProjectFilter] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingTimesheet, setEditingTimesheet] = React.useState<Timesheet | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [targetTimesheet, setTargetTimesheet] = React.useState<Timesheet | null>(null);

  const form = useForm<TimesheetFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(timesheetSchema) as any,
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      employeeId: 0,
      projectId: 0,
      positionId: undefined,
      departmentId: undefined,
      statusId: undefined,
      regularHours: 0,
      extraHours: 0,
      remarkId: undefined,
    },
  });

  const watchRegular = form.watch("regularHours");
  const watchExtra = form.watch("extraHours");
  const totalHours = (Number(watchRegular) || 0) + (Number(watchExtra) || 0);

  // --- Data fetching ---

  const buildParams = () => {
    const params = new URLSearchParams();
    if (employeeFilter) params.set("employeeId", employeeFilter);
    if (projectFilter) params.set("projectId", projectFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params.toString();
  };

  const { data: timesheetsResponse, isLoading } = useQuery({
    queryKey: ["timesheets", employeeFilter, projectFilter, departmentFilter, dateFrom, dateTo],
    queryFn: () => fetchApi<{ data: Timesheet[] }>(`/api/accounting/timesheets?pageSize=1000&${buildParams()}`),
  });
  const timesheets = timesheetsResponse?.data ?? [];

  const { data: summary } = useQuery({
    queryKey: ["timesheets-summary", dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      return fetchApi<TimesheetSummary>(`/api/accounting/timesheets/summary?${params.toString()}`);
    },
  });

  const { data: employeesResponse } = useQuery({
    queryKey: ["employees-lookup"],
    queryFn: () => fetchApi<{ data: SelectItem[] }>("/api/accounting/employees?pageSize=1000"),
  });
  const employees = employeesResponse?.data ?? [];

  const { data: projectsResponse } = useQuery({
    queryKey: ["acc-projects-lookup"],
    queryFn: () => fetchApi<{ data: ProjectItem[] }>("/api/accounting/acc-projects?pageSize=1000"),
  });
  const projects = projectsResponse?.data ?? [];

  const { data: positionsResponse } = useQuery({
    queryKey: ["positions-lookup"],
    queryFn: () => fetchApi<{ data: SelectItem[] }>("/api/accounting/positions?pageSize=1000"),
  });
  const positions = positionsResponse?.data ?? [];

  const { data: departmentsResponse } = useQuery({
    queryKey: ["departments-lookup"],
    queryFn: () => fetchApi<{ data: SelectItem[] }>("/api/accounting/departments?pageSize=1000"),
  });
  const departments = departmentsResponse?.data ?? [];

  const { data: employeeStatusesResponse } = useQuery({
    queryKey: ["employee-statuses-lookup"],
    queryFn: () => fetchApi<{ data: SelectItem[] }>("/api/accounting/employee-statuses?pageSize=1000"),
  });
  const employeeStatuses = employeeStatusesResponse?.data ?? [];

  const { data: remarksResponse } = useQuery({
    queryKey: ["remarks-lookup"],
    queryFn: () => fetchApi<{ data: SelectItem[] }>("/api/accounting/remarks?pageSize=1000"),
  });
  const remarks = remarksResponse?.data ?? [];

  // Client-side filter for department
  const filteredTimesheets = React.useMemo(() => {
    if (!departmentFilter) return timesheets;
    return timesheets.filter((t) => String(t.departmentId) === departmentFilter);
  }, [timesheets, departmentFilter]);

  // --- Mutations ---

  const createMutation = useMutation({
    mutationFn: (data: TimesheetFormData) =>
      fetchApi("/api/accounting/timesheets", {
        method: "POST",
        body: JSON.stringify({ ...data, totalHours: (Number(data.regularHours) || 0) + (Number(data.extraHours) || 0) }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["timesheets-summary"] });
      toast.success("Timesheet entry created");
      setFormOpen(false);
      setEditingTimesheet(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TimesheetFormData }) =>
      fetchApi(`/api/accounting/timesheets/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...data, totalHours: (Number(data.regularHours) || 0) + (Number(data.extraHours) || 0) }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["timesheets-summary"] });
      toast.success("Timesheet entry updated");
      setFormOpen(false);
      setEditingTimesheet(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/api/accounting/timesheets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["timesheets-summary"] });
      toast.success("Timesheet entry deleted");
      setDeleteDialogOpen(false);
      setTargetTimesheet(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // --- Handlers ---

  function handleCreate() {
    setEditingTimesheet(null);
    form.reset({
      date: format(new Date(), "yyyy-MM-dd"),
      employeeId: 0,
      projectId: 0,
      positionId: undefined,
      departmentId: undefined,
      statusId: undefined,
      regularHours: 0,
      extraHours: 0,
      remarkId: undefined,
    });
    setFormOpen(true);
  }

  function handleEdit(ts: Timesheet) {
    setEditingTimesheet(ts);
    form.reset({
      date: ts.date?.split("T")[0] ?? "",
      employeeId: ts.employeeId,
      projectId: ts.projectId,
      positionId: ts.positionId ?? undefined,
      departmentId: ts.departmentId ?? undefined,
      statusId: ts.statusId ?? undefined,
      regularHours: Number(ts.regularHours),
      extraHours: Number(ts.extraHours),
      remarkId: ts.remarkId ?? undefined,
    });
    setFormOpen(true);
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    form.handleSubmit((data) => {
      if (editingTimesheet) {
        updateMutation.mutate({ id: editingTimesheet.id, data });
      } else {
        createMutation.mutate(data);
      }
    })(e);
  }

  // --- Columns ---

  const columns: ColumnDef<Timesheet, unknown>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        try {
          return format(new Date(row.original.date), "dd/MM/yyyy");
        } catch {
          return row.original.date;
        }
      },
    },
    {
      id: "employee",
      header: "Employee",
      accessorFn: (row) => row.employee?.name ?? "-",
    },
    {
      id: "project",
      header: "Project",
      accessorFn: (row) => row.project?.projectNo ?? "-",
    },
    {
      id: "position",
      header: "Position",
      accessorFn: (row) => row.position?.name ?? "-",
    },
    {
      id: "department",
      header: "Department",
      accessorFn: (row) => row.department?.name ?? "-",
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (row) => row.status?.name ?? "-",
    },
    {
      accessorKey: "regularHours",
      header: "Regular Hrs",
      cell: ({ row }) => Number(row.original.regularHours).toFixed(1),
    },
    {
      accessorKey: "extraHours",
      header: "Extra Hrs",
      cell: ({ row }) => Number(row.original.extraHours).toFixed(1),
    },
    {
      accessorKey: "totalHours",
      header: "Total Hrs",
      cell: ({ row }) => (
        <span className="font-medium">{Number(row.original.totalHours).toFixed(1)}</span>
      ),
    },
    {
      id: "remark",
      header: "Remark",
      accessorFn: (row) => row.remark?.name ?? "-",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const ts = row.original;
        return (
          <div className="flex items-center gap-1">
            <PermissionGate module="ACCOUNT" action="edit">
              <Button
                variant="ghost"
                size="icon"
                title="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(ts);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </PermissionGate>
            <PermissionGate module="ACCOUNT" action="delete">
              <Button
                variant="ghost"
                size="icon"
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  setTargetTimesheet(ts);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </PermissionGate>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Timesheets</h1>
          <p className="text-sm text-zinc-500">
            {filteredTimesheets.length} entries
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
          className="h-8 w-[180px]"
        >
          <SelectOption value="">All Employees</SelectOption>
          {employees.map((emp) => (
            <SelectOption key={emp.id} value={String(emp.id)}>
              {emp.name}
            </SelectOption>
          ))}
        </Select>
        <Select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="h-8 w-[180px]"
        >
          <SelectOption value="">All Projects</SelectOption>
          {projects.map((p) => (
            <SelectOption key={p.id} value={String(p.id)}>
              {p.projectNo} - {p.name}
            </SelectOption>
          ))}
        </Select>
        <Select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="h-8 w-[170px]"
        >
          <SelectOption value="">All Departments</SelectOption>
          {departments.map((d) => (
            <SelectOption key={d.id} value={String(d.id)}>
              {d.name}
            </SelectOption>
          ))}
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-8 w-[140px]"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-8 w-[140px]"
        />
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-xs text-zinc-500">Total Regular Hours</p>
            <p className="text-lg font-semibold">{Number(summary.totalRegularHours).toFixed(1)}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-xs text-zinc-500">Total Extra Hours</p>
            <p className="text-lg font-semibold">{Number(summary.totalExtraHours).toFixed(1)}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-xs text-zinc-500">Total Hours</p>
            <p className="text-lg font-semibold">{Number(summary.totalHours).toFixed(1)}</p>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredTimesheets}
        searchKey="date"
        searchPlaceholder="Filter by date..."
        isLoading={isLoading}
        emptyMessage="No timesheet entries found."
        toolbarActions={
          <PermissionGate module="ACCOUNT" action="add">
            <Button size="sm" onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </PermissionGate>
        }
      />

      {/* Timesheet Form Dialog */}
      <FormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTimesheet(null);
        }}
        title={editingTimesheet ? "Edit Timesheet Entry" : "New Timesheet Entry"}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        className="max-w-2xl"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="ts-date">Date *</Label>
            <Input id="ts-date" type="date" {...form.register("date")} />
            {form.formState.errors.date && (
              <p className="text-xs text-red-500">{form.formState.errors.date.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="ts-employee">Employee *</Label>
            <Select id="ts-employee" {...form.register("employeeId")}>
              <SelectOption value="0">Select Employee</SelectOption>
              {employees.map((emp) => (
                <SelectOption key={emp.id} value={String(emp.id)}>
                  {emp.name}
                </SelectOption>
              ))}
            </Select>
            {form.formState.errors.employeeId && (
              <p className="text-xs text-red-500">{form.formState.errors.employeeId.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="ts-project">Project *</Label>
            <Select id="ts-project" {...form.register("projectId")}>
              <SelectOption value="0">Select Project</SelectOption>
              {projects.map((p) => (
                <SelectOption key={p.id} value={String(p.id)}>
                  {p.projectNo} - {p.name}
                </SelectOption>
              ))}
            </Select>
            {form.formState.errors.projectId && (
              <p className="text-xs text-red-500">{form.formState.errors.projectId.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="ts-position">Position</Label>
            <Select id="ts-position" {...form.register("positionId")}>
              <SelectOption value="">Select Position</SelectOption>
              {positions.map((p) => (
                <SelectOption key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectOption>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ts-department">Department</Label>
            <Select id="ts-department" {...form.register("departmentId")}>
              <SelectOption value="">Select Department</SelectOption>
              {departments.map((d) => (
                <SelectOption key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectOption>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ts-status">Status</Label>
            <Select id="ts-status" {...form.register("statusId")}>
              <SelectOption value="">Select Status</SelectOption>
              {employeeStatuses.map((s) => (
                <SelectOption key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectOption>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ts-regular">Regular Hours</Label>
            <Input id="ts-regular" type="number" step="0.5" min="0" {...form.register("regularHours")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ts-extra">Extra Hours</Label>
            <Input id="ts-extra" type="number" step="0.5" min="0" {...form.register("extraHours")} />
          </div>
          <div className="space-y-1">
            <Label>Total Hours</Label>
            <Input type="number" value={totalHours.toFixed(1)} disabled className="bg-zinc-50 dark:bg-zinc-900" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ts-remark">Remark</Label>
            <Select id="ts-remark" {...form.register("remarkId")}>
              <SelectOption value="">Select Remark</SelectOption>
              {remarks.map((r) => (
                <SelectOption key={r.id} value={String(r.id)}>
                  {r.name}
                </SelectOption>
              ))}
            </Select>
          </div>
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Timesheet Entry"
        description="Are you sure you want to delete this timesheet entry? This action cannot be undone."
        onConfirm={() => targetTimesheet && deleteMutation.mutate(targetTimesheet.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
