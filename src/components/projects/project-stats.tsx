"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api";
import {
  FolderKanban,
  Activity,
  PauseCircle,
  CheckCircle2,
  DollarSign,
} from "lucide-react";

interface ProjectStatsData {
  total: number;
  active: number;
  onHold: number;
  completed: number;
  totalValue: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconClassName?: string;
}

function StatCard({ title, value, icon: Icon, iconClassName }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              iconClassName
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(2);
}

export function ProjectStats() {
  const [stats, setStats] = React.useState<ProjectStatsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchApi<{
          data: Array<{
            status: string;
            netAmount: number | string;
          }>;
          total: number;
        }>("/api/projects?pageSize=500&fields=status,netAmount");

        const projects = data.data || [];
        const total = projects.length;
        let active = 0;
        let onHold = 0;
        let completed = 0;
        let totalValue = 0;

        for (const p of projects) {
          const status = (p.status || "").toUpperCase();
          if (status === "ACTIVE") {
            active++;
            totalValue += Number(p.netAmount) || 0;
          } else if (status === "ON_HOLD") {
            onHold++;
          } else if (status === "COMPLETED") {
            completed++;
          }
        }

        setStats({ total, active, onHold, completed, totalValue });
      } catch {
        // If the API is not available yet, show zeros
        setStats({ total: 0, active: 0, onHold: 0, completed: 0, totalValue: 0 });
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total Projects"
        value={stats.total}
        icon={FolderKanban}
        iconClassName="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
      />
      <StatCard
        title="Active"
        value={stats.active}
        icon={Activity}
        iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
      />
      <StatCard
        title="On Hold"
        value={stats.onHold}
        icon={PauseCircle}
        iconClassName="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
      />
      <StatCard
        title="Completed"
        value={stats.completed}
        icon={CheckCircle2}
        iconClassName="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
      />
      <StatCard
        title="Active Value"
        value={formatCurrency(stats.totalValue)}
        icon={DollarSign}
        iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
      />
    </div>
  );
}
