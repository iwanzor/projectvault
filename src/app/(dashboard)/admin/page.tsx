"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { Users, ShieldCheck, UserCheck } from "lucide-react";
import Link from "next/link";

interface Stats {
  total: number;
  active: number;
  admin: number;
}

export default function AdminPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchApi<Stats>("/api/admin/stats"),
  });

  const cards = [
    {
      label: "Total Users",
      value: stats?.total ?? 0,
      icon: Users,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      label: "Active Users",
      value: stats?.active ?? 0,
      icon: UserCheck,
      color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    },
    {
      label: "Admin Users",
      value: stats?.admin ?? 0,
      icon: ShieldCheck,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Administration</h1>
        <p className="text-sm text-zinc-500">
          Manage users, roles, and system permissions.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500">{card.label}</p>
                  <p className="text-2xl font-semibold">
                    {isLoading ? "-" : card.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/users"
          className="group rounded-lg border border-zinc-200 bg-white p-6 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
        >
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-zinc-400 group-hover:text-blue-600" />
            <div>
              <h3 className="font-medium">User Management</h3>
              <p className="text-sm text-zinc-500">
                Create, edit, and manage user accounts
              </p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/permissions"
          className="group rounded-lg border border-zinc-200 bg-white p-6 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-zinc-400 group-hover:text-blue-600" />
            <div>
              <h3 className="font-medium">Permissions Management</h3>
              <p className="text-sm text-zinc-500">
                Configure module-level access controls
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
