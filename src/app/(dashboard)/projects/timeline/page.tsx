"use client";

import * as React from "react";
import { GanttChart, type GanttGroup } from "@/components/projects/gantt-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/lib/api";
import { parseISO } from "date-fns";

interface TimelineProject {
  id: number;
  projectNo: string;
  projectName: string;
  status: string;
  customerName?: string;
  programDate: string | null;
  targetLpoDate: string | null;
  targetShipmentDate: string | null;
  deliverySiteDate: string | null;
  installationDate: string | null;
  commissionDate: string | null;
  handoverDate: string | null;
}

const PHASE_DEFINITIONS = [
  { name: "Planning", startKey: "programDate", endKey: "targetLpoDate" },
  { name: "Procurement", startKey: "targetLpoDate", endKey: "targetShipmentDate" },
  { name: "Shipping", startKey: "targetShipmentDate", endKey: "deliverySiteDate" },
  { name: "Installation", startKey: "deliverySiteDate", endKey: "installationDate" },
  { name: "Commissioning", startKey: "installationDate", endKey: "commissionDate" },
  { name: "Handover", startKey: "commissionDate", endKey: "handoverDate" },
] as const;

function safeParse(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  try {
    const d = parseISO(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export default function TimelinePage() {
  const [groups, setGroups] = React.useState<GanttGroup[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("ACTIVE");
  const [customerFilter, setCustomerFilter] = React.useState("");
  const [customers, setCustomers] = React.useState<string[]>([]);

  React.useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ pageSize: "100" });
        if (statusFilter) params.set("status", statusFilter);

        const result = await fetchApi<{
          data: TimelineProject[];
        }>(`/api/projects?${params.toString()}`);

        const projects = result.data || [];

        // Extract unique customer names
        const custNames = new Set<string>();
        for (const p of projects) {
          if (p.customerName) custNames.add(p.customerName);
        }
        setCustomers(Array.from(custNames).sort());

        // Filter by customer if set
        const filtered = customerFilter
          ? projects.filter((p) => p.customerName === customerFilter)
          : projects;

        // Build Gantt groups
        const ganttGroups: GanttGroup[] = [];
        for (const project of filtered) {
          const tasks = [];
          for (const phase of PHASE_DEFINITIONS) {
            const start = safeParse(
              project[phase.startKey as keyof TimelineProject] as string | null
            );
            const end = safeParse(
              project[phase.endKey as keyof TimelineProject] as string | null
            );
            // Only add if at least one date exists
            if (start || end) {
              tasks.push({
                id: `${project.id}-${phase.name}`,
                name: phase.name,
                start,
                end,
              });
            }
          }

          if (tasks.length > 0) {
            ganttGroups.push({
              id: String(project.id),
              name: `${project.projectNo} - ${project.projectName}`,
              tasks,
            });
          }
        }

        setGroups(ganttGroups);
      } catch {
        setGroups([]);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [statusFilter, customerFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Project Timeline</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Gantt chart view of all project phases and milestones.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Customer
          </label>
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          ) : groups.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
              No projects with timeline dates found.
            </div>
          ) : (
            <GanttChart groups={groups} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
