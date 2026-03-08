"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  Truck,
  ArrowLeftRight,
  RotateCcw,
  Boxes,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  purchaseOrders: number;
  grns: number;
  gins: number;
  gtns: number;
  grrns: number;
}

interface RecentActivity {
  id: number;
  type: string;
  docNo: string;
  date: string;
  description: string;
}

export default function WarehouseDashboardPage() {
  const router = useRouter();

  const { data: stats } = useQuery({
    queryKey: ["warehouse-stats"],
    queryFn: () =>
      fetchApi<DashboardStats>("/api/warehouse/purchase-orders?pageSize=1").then(() => ({
        purchaseOrders: 0,
        grns: 0,
        gins: 0,
        gtns: 0,
        grrns: 0,
      })).catch(() => ({
        purchaseOrders: 0,
        grns: 0,
        gins: 0,
        gtns: 0,
        grrns: 0,
      })),
  });

  const summaryCards = [
    { title: "Purchase Orders", count: stats?.purchaseOrders ?? 0, icon: ShoppingCart, href: "/warehouse/purchase-orders", color: "text-blue-600" },
    { title: "Goods Received", count: stats?.grns ?? 0, icon: Truck, href: "/warehouse/grn", color: "text-green-600" },
    { title: "Goods Issued", count: stats?.gins ?? 0, icon: ArrowLeftRight, href: "/warehouse/gin", color: "text-orange-600" },
    { title: "Goods Transferred", count: stats?.gtns ?? 0, icon: ArrowLeftRight, href: "/warehouse/gtn", color: "text-purple-600" },
    { title: "Goods Returned", count: stats?.grrns ?? 0, icon: RotateCcw, href: "/warehouse/grrn", color: "text-red-600" },
  ];

  const quickActions = [
    { label: "New PO", href: "/warehouse/purchase-orders/new", icon: ShoppingCart },
    { label: "New GRN", href: "/warehouse/grn/new", icon: Truck },
    { label: "New GIN", href: "/warehouse/gin/new", icon: ArrowLeftRight },
    { label: "New GTN", href: "/warehouse/gtn/new", icon: ArrowLeftRight },
    { label: "New GRRN", href: "/warehouse/grrn/new", icon: RotateCcw },
    { label: "Stock Count", href: "/warehouse/physical-stock", icon: Boxes },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Warehouse</h1>
        <p className="text-sm text-zinc-500">Inventory and stock management overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            onClick={() => router.push(card.href)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.count}</p>
                </div>
                <card.icon className={`h-8 w-8 ${card.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => router.push(action.href)}
                >
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Warehouse Modules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Purchase Orders", href: "/warehouse/purchase-orders", desc: "Manage purchase orders and approvals" },
              { label: "Goods Received Notes", href: "/warehouse/grn", desc: "Record incoming goods" },
              { label: "Goods Issue Notes", href: "/warehouse/gin", desc: "Issue goods to projects" },
              { label: "Goods Transfer Notes", href: "/warehouse/gtn", desc: "Transfer between projects" },
              { label: "Goods Return Notes", href: "/warehouse/grrn", desc: "Return goods from projects" },
              { label: "Physical Stock", href: "/warehouse/physical-stock", desc: "Stock count and inventory" },
            ].map((link) => (
              <button
                key={link.href}
                className="w-full flex items-center justify-between p-3 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-left"
                onClick={() => router.push(link.href)}
              >
                <div>
                  <div className="font-medium text-sm">{link.label}</div>
                  <div className="text-xs text-zinc-500">{link.desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
