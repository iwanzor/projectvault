"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  ClipboardList,
  Archive,
  Calculator,
} from "lucide-react";

import { fetchApi } from "@/lib/api";
import { CurrencyDisplay } from "@/components/data-display/currency-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/components/accounting/transaction-form";

// --- Types ---

interface TransactionSummary {
  totalAmount: number;
  totalAmountPaid: number;
  totalAmountLeft: number;
}

// --- Component ---

export default function AccountingDashboardPage() {
  const router = useRouter();

  const { data: receivableSummary } = useQuery({
    queryKey: ["dashboard-receivables-summary"],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("category", "INCOME");
      return fetchApi<TransactionSummary>(`/api/accounting/transactions/summary?${params.toString()}`);
    },
  });

  const { data: payableSummary } = useQuery({
    queryKey: ["dashboard-payables-summary"],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("category", "EXPENSE");
      return fetchApi<TransactionSummary>(`/api/accounting/transactions/summary?${params.toString()}`);
    },
  });

  const { data: recentTransactions = [] } = useQuery({
    queryKey: ["dashboard-recent-transactions"],
    queryFn: () => fetchApi<Transaction[]>("/api/accounting/transactions?isArchived=false"),
    select: (data) => data.slice(0, 10),
  });

  const totalReceivables = receivableSummary?.totalAmountLeft ?? 0;
  const totalPayables = payableSummary?.totalAmountLeft ?? 0;
  const netPosition = totalReceivables - totalPayables;

  const moduleLinks = [
    { label: "Payables", href: "/accounting/payables", icon: CreditCard, color: "text-red-500" },
    { label: "Receivables", href: "/accounting/receivables", icon: DollarSign, color: "text-green-500" },
    { label: "Expected AP", href: "/accounting/expected-payables", icon: CreditCard, color: "text-orange-500" },
    { label: "Expected AR", href: "/accounting/expected-receivables", icon: DollarSign, color: "text-emerald-500" },
    { label: "Timesheets", href: "/accounting/timesheets", icon: Clock, color: "text-blue-500" },
    { label: "LPO Tracking", href: "/accounting/lpo", icon: ClipboardList, color: "text-purple-500" },
    { label: "Archive", href: "/accounting/archive", icon: Archive, color: "text-zinc-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Accounting Overview</h1>
        <p className="text-sm text-zinc-500">Financial summary and quick actions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Receivables</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <CurrencyDisplay amount={totalReceivables} className="text-2xl font-bold" />
            <p className="text-xs text-zinc-500 mt-1">Outstanding income</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Payables</CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <CurrencyDisplay amount={totalPayables} className="text-2xl font-bold" />
            <p className="text-xs text-zinc-500 mt-1">Outstanding expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Net Position</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <CurrencyDisplay amount={netPosition} className="text-2xl font-bold" />
            <p className="text-xs text-zinc-500 mt-1">Receivables - Payables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Recent Activity</CardTitle>
            <Calculator className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{recentTransactions.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Recent transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => router.push("/accounting/payables")} variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Payment
        </Button>
        <Button onClick={() => router.push("/accounting/receivables")} variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Receipt
        </Button>
        <Button onClick={() => router.push("/accounting/payables")} variant="outline" size="sm">
          <CreditCard className="mr-2 h-4 w-4" />
          View Payables
        </Button>
        <Button onClick={() => router.push("/accounting/receivables")} variant="outline" size="sm">
          <DollarSign className="mr-2 h-4 w-4" />
          View Receivables
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4 text-center">No recent transactions</p>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            t.category === "INCOME" ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <span className="text-sm font-medium truncate">{t.transactionNo}</span>
                      </div>
                      <p className="text-xs text-zinc-500 ml-4 truncate">
                        {t.description ?? t.purpose?.name ?? "-"}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <CurrencyDisplay
                        amount={Number(t.amount)}
                        className={`text-sm font-medium ${
                          t.category === "INCOME" ? "text-green-600" : "text-red-600"
                        }`}
                      />
                      <p className="text-xs text-zinc-500">
                        {t.actualDate
                          ? (() => {
                              try {
                                return format(new Date(t.actualDate), "dd/MM/yyyy");
                              } catch {
                                return "-";
                              }
                            })()
                          : "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Module Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accounting Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {moduleLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className="w-full flex items-center justify-between p-3 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <link.icon className={`h-4 w-4 ${link.color}`} />
                    <span className="text-sm font-medium">{link.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-400" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
