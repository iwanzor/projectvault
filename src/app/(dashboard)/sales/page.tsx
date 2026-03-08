"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";

interface QuotationReport {
  data: unknown[];
  total: number;
  page: number;
  pageSize: number;
}

export default function SalesPage() {
  const now = new Date();
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const { data, isLoading } = useQuery({
    queryKey: ["sales-overview", from, to],
    queryFn: () =>
      fetchApi<QuotationReport>(
        `/api/reports/quotations?from=${from}&to=${to}&page=1&pageSize=5`
      ).catch(() => null),
  });

  const summaryCards = [
    {
      label: "Total Quotations",
      value: data?.total ?? "--",
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      label: "This Month",
      value: data?.total ?? "--",
      icon: TrendingUp,
      color: "bg-green-500",
    },
  ];

  const quickLinks = [
    {
      label: "Quotations",
      description: "View and manage all sales quotations",
      href: "/sales/quotations",
      icon: ShoppingCart,
    },
    {
      label: "Currency Preview",
      description: "Preview quotations in different currencies",
      href: "/sales/currency-preview",
      icon: DollarSign,
    },
    {
      label: "New Quotation",
      description: "Create a new sales quotation",
      href: "/sales/quotations/new",
      icon: FileText,
    },
    {
      label: "Quotation Reports",
      description: "Generate sales quotation reports",
      href: "/reports/quotations",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
        <p className="mt-1 text-gray-600">
          Sales quotation management with pricing, revisions, and PDF
          generation.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.color} text-white`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{card.label}</p>
                  {isLoading ? (
                    <div className="mt-1 h-7 w-12 animate-pulse rounded bg-gray-200" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value}
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
          Quick Links
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {link.label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {link.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
