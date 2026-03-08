"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  BarChart3,
  FileText,
  DollarSign,
  FolderKanban,
  Warehouse,
  Clock,
  Activity,
  BookOpen,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { format } from "date-fns";

import { fetchApi } from "@/lib/api";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { ReportSummaryCard } from "@/components/reports/report-summary-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardData {
  quotationsThisMonth: number;
  activeProjects: number;
  totalTransactions: number;
  stockValue: number;
  recentActivity: Array<{
    id: number;
    date: string;
    user: string;
    module: string;
    action: string;
    description: string;
  }>;
}

const currencyFmt = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  minimumFractionDigits: 2,
});

const reportLinks = [
  { label: "SQ Reports", href: "/reports/quotations", icon: FileText, description: "Sales quotation analytics" },
  { label: "Currency Report", href: "/reports/currency", icon: DollarSign, description: "Multi-currency analysis" },
  { label: "Project Report", href: "/reports/projects", icon: FolderKanban, description: "Project status overview" },
  { label: "Financial Report", href: "/reports/financial", icon: TrendingUp, description: "Income & expense reports" },
  { label: "Warehouse Report", href: "/reports/warehouse", icon: Warehouse, description: "Warehouse operations" },
  { label: "Timesheet Report", href: "/reports/timesheets", icon: Clock, description: "Employee hours tracking" },
  { label: "Activity Log", href: "/reports/activity", icon: Activity, description: "System activity audit" },
  { label: "Financial Statements", href: "/reports/financial-statements", icon: BookOpen, description: "FSF management" },
];

export default function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports-dashboard"],
    queryFn: () => fetchApi<DashboardData>("/api/reports/dashboard"),
  });

  return (
    <PermissionGate module="REPORTS" action="viewAll" fallback={<p>You do not have permission to view reports.</p>}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Reports Dashboard</h1>
          <p className="text-sm text-zinc-500">Overview of key metrics and quick access to all reports</p>
        </div>

        {/* Key Metrics */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <ReportSummaryCard
              icon={FileText}
              label="Quotations This Month"
              value={data?.quotationsThisMonth ?? 0}
            />
            <ReportSummaryCard
              icon={FolderKanban}
              label="Active Projects"
              value={data?.activeProjects ?? 0}
            />
            <ReportSummaryCard
              icon={TrendingUp}
              label="Total Transactions"
              value={data?.totalTransactions ?? 0}
            />
            <ReportSummaryCard
              icon={Warehouse}
              label="Stock Value"
              value={currencyFmt.format(data?.stockValue ?? 0)}
            />
          </div>
        )}

        {/* Quick Links */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Reports</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {reportLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium">{link.label}</p>
                    <p className="text-xs text-zinc-500">{link.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : data?.recentActivity?.length ? (
              <div className="space-y-2">
                {data.recentActivity.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2 text-sm dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="font-medium">{item.user}</span>
                      <span className="text-zinc-500">{item.action}</span>
                      <span className="text-zinc-400">{item.description}</span>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {(() => {
                        try {
                          return format(new Date(item.date), "dd/MM/yyyy HH:mm");
                        } catch {
                          return item.date;
                        }
                      })()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
