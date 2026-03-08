"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Clock, Users, FolderKanban } from "lucide-react";

import { fetchApi } from "@/lib/api";
import { DataTable } from "@/components/data-display/data-table";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ExportButton } from "@/components/reports/export-button";
import { ReportSummaryCard } from "@/components/reports/report-summary-card";
import { Select, SelectOption } from "@/components/ui/select";

interface TimesheetDetail {
  id: number;
  date: string;
  employeeName: string;
  projectNo: string;
  departmentName: string;
  regularHours: number;
  extraHours: number;
  totalHours: number;
}

interface TimesheetReportData {
  summary: {
    totalRegular: number;
    totalExtra: number;
    totalHours: number;
    byEmployee: Record<string, number>;
    byProject: Record<string, number>;
  };
  details: TimesheetDetail[];
}

interface SelectItem {
  id: number;
  name: string;
}

interface ProjectItem {
  id: number;
  projectNo: string;
  name: string;
}

export default function TimesheetReportPage() {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [employeeId, setEmployeeId] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");

  const buildParams = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (employeeId) params.set("employeeId", employeeId);
    if (projectId) params.set("projectId", projectId);
    if (departmentId) params.set("departmentId", departmentId);
    return params.toString();
  };

  const { data, isLoading } = useQuery({
    queryKey: ["reports-timesheets", from, to, employeeId, projectId, departmentId],
    queryFn: () => fetchApi<TimesheetReportData>(`/api/reports/timesheets?${buildParams()}`),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-lookup"],
    queryFn: () => fetchApi<SelectItem[]>("/api/accounting/employees"),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["acc-projects-lookup"],
    queryFn: () => fetchApi<ProjectItem[]>("/api/accounting/acc-projects"),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments-lookup"],
    queryFn: () => fetchApi<SelectItem[]>("/api/accounting/departments"),
  });

  const columns: ColumnDef<TimesheetDetail, unknown>[] = [
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
    { accessorKey: "employeeName", header: "Employee" },
    { accessorKey: "projectNo", header: "Project" },
    { accessorKey: "departmentName", header: "Department" },
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
  ];

  const exportParams: Record<string, string> = {};
  if (from) exportParams.from = from;
  if (to) exportParams.to = to;
  if (employeeId) exportParams.employeeId = employeeId;
  if (projectId) exportParams.projectId = projectId;
  if (departmentId) exportParams.departmentId = departmentId;

  return (
    <PermissionGate module="REPORTS" action="viewAll" fallback={<p>You do not have permission to view reports.</p>}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Timesheet Report</h1>
            <p className="text-sm text-zinc-500">Employee hours tracking and analysis</p>
          </div>
          <ExportButton
            endpoint="/api/reports/export/timesheets"
            filename="timesheets-report.csv"
            params={exportParams}
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <DateRangePicker from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
          <Select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="h-8 w-[170px]"
          >
            <SelectOption value="">All Employees</SelectOption>
            {employees.map((emp) => (
              <SelectOption key={emp.id} value={String(emp.id)}>{emp.name}</SelectOption>
            ))}
          </Select>
          <Select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-8 w-[170px]"
          >
            <SelectOption value="">All Projects</SelectOption>
            {projects.map((p) => (
              <SelectOption key={p.id} value={String(p.id)}>{p.projectNo} - {p.name}</SelectOption>
            ))}
          </Select>
          <Select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="h-8 w-[160px]"
          >
            <SelectOption value="">All Departments</SelectOption>
            {departments.map((d) => (
              <SelectOption key={d.id} value={String(d.id)}>{d.name}</SelectOption>
            ))}
          </Select>
        </div>

        {data?.summary && (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <ReportSummaryCard icon={Clock} label="Total Regular Hours" value={Number(data.summary.totalRegular).toFixed(1)} />
              <ReportSummaryCard icon={Clock} label="Total Extra Hours" value={Number(data.summary.totalExtra).toFixed(1)} />
              <ReportSummaryCard icon={Clock} label="Total Hours" value={Number(data.summary.totalHours).toFixed(1)} />
            </div>

            {/* By Employee */}
            {Object.keys(data.summary.byEmployee).length > 0 && (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                <h3 className="text-sm font-medium mb-2">By Employee</h3>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {Object.entries(data.summary.byEmployee).map(([name, hours]) => (
                    <div key={name} className="text-sm">
                      <span className="text-zinc-500">{name}:</span>{" "}
                      <span className="font-medium">{Number(hours).toFixed(1)} hrs</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By Project */}
            {Object.keys(data.summary.byProject).length > 0 && (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                <h3 className="text-sm font-medium mb-2">By Project</h3>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {Object.entries(data.summary.byProject).map(([project, hours]) => (
                    <div key={project} className="text-sm">
                      <span className="text-zinc-500">{project}:</span>{" "}
                      <span className="font-medium">{Number(hours).toFixed(1)} hrs</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <DataTable
          columns={columns}
          data={data?.details ?? []}
          searchKey="employeeName"
          searchPlaceholder="Filter by employee..."
          isLoading={isLoading}
          emptyMessage="No timesheet data found."
        />
      </div>
    </PermissionGate>
  );
}
