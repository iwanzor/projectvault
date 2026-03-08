"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  FolderKanban,
  Package,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface DashboardMetrics {
  quotationsThisMonth: number;
  quotationsThisYear: number;
  activeProjects: number;
  totalTransactions: number;
  totalIncome: number | null;
  totalExpense: number | null;
  stockValue: number | null;
  stockRecords: number;
  timesheetEntriesThisMonth: number;
}

const quickLinks = [
  { label: "New Quotation", href: "/sales/quotations/new", icon: ShoppingCart },
  { label: "View Projects", href: "/projects", icon: FolderKanban },
  { label: "Manage Items", href: "/setup/items", icon: Package },
  { label: "Sales Reports", href: "/reports/quotations", icon: TrendingUp },
];

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => fetchApi<DashboardMetrics>("/api/reports/dashboard"),
  });

  const stats = [
    {
      label: "Quotations This Month",
      value: data?.quotationsThisMonth,
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      label: "Active Projects",
      value: data?.activeProjects,
      icon: FolderKanban,
      color: "bg-green-500",
    },
    {
      label: "Stock Records",
      value: data?.stockRecords,
      icon: Package,
      color: "bg-purple-500",
    },
    {
      label: "Quotations This Year",
      value: data?.quotationsThisYear,
      icon: Users,
      color: "bg-orange-500",
    },
  ];

  const financialStats = [
    {
      label: "Total Income",
      value: data?.totalIncome != null ? `AED ${Number(data.totalIncome).toLocaleString()}` : "--",
      icon: TrendingUp,
      color: "bg-emerald-500",
    },
    {
      label: "Total Expense",
      value: data?.totalExpense != null ? `AED ${Number(data.totalExpense).toLocaleString()}` : "--",
      icon: DollarSign,
      color: "bg-red-500",
    },
    {
      label: "Transactions",
      value: data?.totalTransactions,
      icon: DollarSign,
      color: "bg-indigo-500",
    },
    {
      label: "Timesheets This Month",
      value: data?.timesheetEntriesThisMonth,
      icon: Clock,
      color: "bg-cyan-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome to ProjectVault
        </h2>
        <p className="mt-1 text-gray-600">
          Your enterprise resource planning dashboard. Manage quotations,
          projects, inventory, and more.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color} text-white`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  {isLoading ? (
                    <div className="mt-1 h-7 w-12 animate-pulse rounded bg-gray-200" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value ?? "--"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {financialStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color} text-white`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  {isLoading ? (
                    <div className="mt-1 h-7 w-12 animate-pulse rounded bg-gray-200" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value ?? "--"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-gray-900">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                <Icon className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  {link.label}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
