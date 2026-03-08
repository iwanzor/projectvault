"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Activity } from "lucide-react";

import { fetchApi } from "@/lib/api";
import { DataTable } from "@/components/data-display/data-table";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { Select, SelectOption } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ActivityItem {
  id: number;
  date: string;
  user: string;
  module: string;
  action: string;
  description: string;
}

interface ActivityResponse {
  data: ActivityItem[];
  total: number;
}

const moduleOptions = ["", "SALES", "SETUP", "PROJECT", "ACCOUNT", "WAREHOUSE", "REPORTS", "ADMIN"];

export default function ActivityLogPage() {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [module, setModule] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 50;

  const buildParams = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (module) params.set("module", module);
    if (userId) params.set("userId", userId);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    return params.toString();
  };

  const { data, isLoading } = useQuery({
    queryKey: ["reports-activity", from, to, module, userId, page],
    queryFn: () => fetchApi<ActivityResponse>(`/api/reports/activity?${buildParams()}`),
  });

  const columns: ColumnDef<ActivityItem, unknown>[] = [
    {
      accessorKey: "date",
      header: "Date/Time",
      cell: ({ row }) => {
        try {
          return format(new Date(row.original.date), "dd/MM/yyyy HH:mm");
        } catch {
          return row.original.date;
        }
      },
    },
    { accessorKey: "user", header: "User" },
    { accessorKey: "module", header: "Module" },
    { accessorKey: "action", header: "Action" },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="max-w-[300px] truncate block">{row.original.description}</span>
      ),
    },
  ];

  const totalPages = Math.ceil((data?.total ?? 0) / pageSize);

  return (
    <PermissionGate module="REPORTS" action="viewAll" fallback={<p>You do not have permission to view reports.</p>}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Activity Log</h1>
          <p className="text-sm text-zinc-500">
            System activity audit trail
            {data?.total ? ` - ${data.total} total entries` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <DateRangePicker from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
          <Select
            value={module}
            onChange={(e) => { setModule(e.target.value); setPage(1); }}
            className="h-8 w-[150px]"
          >
            <SelectOption value="">All Modules</SelectOption>
            {moduleOptions.filter(Boolean).map((m) => (
              <SelectOption key={m} value={m}>{m}</SelectOption>
            ))}
          </Select>
          <input
            type="text"
            placeholder="User ID..."
            value={userId}
            onChange={(e) => { setUserId(e.target.value); setPage(1); }}
            className="flex h-8 w-[120px] rounded-md border border-zinc-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:placeholder:text-zinc-500"
          />
        </div>

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          searchKey="user"
          searchPlaceholder="Filter by user..."
          isLoading={isLoading}
          emptyMessage="No activity found."
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-zinc-500">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
