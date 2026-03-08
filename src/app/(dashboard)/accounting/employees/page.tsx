"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, type ColorRule } from "@/components/data-display/data-table";
import { FormDialog } from "@/components/forms/form-dialog";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api";

// --- Types ---
interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  nickName: string | null;
  monthlySalary: number | string | null;
  isActive: boolean;
}

interface ListResponse {
  data: Employee[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const employeeSchema = z.object({
  employeeCode: z.string().min(1, "Code is required").max(50),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  nickName: z.string().max(100).optional().default(""),
  monthlySalary: z.union([z.number(), z.string()]).optional().default(0).transform((val) => {
    if (val === "" || val === undefined || val === null) return 0;
    return Number(val);
  }),
  isActive: z.boolean().optional().default(true),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

// --- API ---
const API = "/api/accounting/employees";

function fetchEmployees() {
  return fetchApi<ListResponse>(`${API}?pageSize=1000`);
}

function createEmployee(data: EmployeeForm) {
  return fetchApi<Employee>(API, { method: "POST", body: JSON.stringify(data) });
}

function updateEmployee(id: number, data: EmployeeForm) {
  return fetchApi<Employee>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteEmployee(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

const salaryFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// --- Color rules ---
const colorRules: ColorRule<Employee>[] = [
  {
    condition: (row) => !row.isActive,
    className: "opacity-50",
  },
];

// --- Columns ---
const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: "employeeCode",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Code <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "firstName",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        First Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "lastName",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Last Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "nickName",
    header: "Nick Name",
    cell: ({ row }) => row.original.nickName || "-",
  },
  {
    accessorKey: "monthlySalary",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Monthly Salary <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => salaryFormatter.format(Number(row.original.monthlySalary ?? 0)),
  },
  {
    id: "isActive",
    header: "Active",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "secondary"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

// --- Page ---
export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<EmployeeForm>({ resolver: zodResolver(employeeSchema) as any, defaultValues: {
    employeeCode: "", firstName: "", lastName: "", nickName: "", monthlySalary: 0, isActive: true,
  }});

  const { data, isLoading } = useQuery({ queryKey: ["employees"], queryFn: fetchEmployees });

  const createMutation = useMutation({
    mutationFn: (values: EmployeeForm) => createEmployee(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: EmployeeForm) => updateEmployee(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEmployee(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ employeeCode: "", firstName: "", lastName: "", nickName: "", monthlySalary: 0, isActive: true });
    setFormOpen(true);
  }

  function openEdit(item: Employee) {
    setSelected(item);
    form.reset({
      employeeCode: item.employeeCode,
      firstName: item.firstName,
      lastName: item.lastName,
      nickName: item.nickName ?? "",
      monthlySalary: Number(item.monthlySalary ?? 0),
      isActive: item.isActive,
    });
    setFormOpen(true);
  }

  function openDelete(item: Employee) {
    setSelected(item);
    setDeleteOpen(true);
  }

  function onSubmit(values: EmployeeForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<Employee>[] = [
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
        <h1 className="text-2xl font-semibold">Employees</h1>
        <p className="text-sm text-zinc-500">Manage employee records and salary information.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="firstName"
        searchPlaceholder="Search employees..."
        isLoading={isLoading}
        emptyMessage="No employees found."
        colorRules={colorRules}
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Employee" : "Add Employee"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="employeeCode">Employee Code</Label>
          <Input id="employeeCode" {...form.register("employeeCode")} />
          {form.formState.errors.employeeCode && (
            <p className="text-sm text-red-500">{form.formState.errors.employeeCode.message}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" {...form.register("firstName")} />
            {form.formState.errors.firstName && (
              <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" {...form.register("lastName")} />
            {form.formState.errors.lastName && (
              <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nickName">Nick Name</Label>
            <Input id="nickName" {...form.register("nickName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthlySalary">Monthly Salary</Label>
            <Input id="monthlySalary" type="number" step="0.01" {...form.register("monthlySalary", { valueAsNumber: true })} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register("isActive")} className="rounded border-zinc-300" />
          Active
        </label>
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Employee"
        description={`Are you sure you want to delete "${selected?.firstName} ${selected?.lastName}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
