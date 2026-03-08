"use client";

import * as React from "react";
import { fetchApi } from "@/lib/api";
import {
  DataTable,
  ArrowUpDown,
  type ColumnDef,
} from "@/components/data-display/data-table";

interface BrandSummary {
  brand: string;
  totalQty: number;
  totalAmount: number;
  totalFob: number;
  totalLandedCost: number;
  avgMarkup: number;
}

interface BrandCumulativeProps {
  projectId?: number;
  projectIds?: number[];
}

export function BrandCumulative({ projectId, projectIds }: BrandCumulativeProps) {
  const [data, setData] = React.useState<BrandSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const ids = projectIds ?? (projectId ? [projectId] : []);
        if (ids.length === 0) {
          setData([]);
          setIsLoading(false);
          return;
        }

        const params = ids.map((id) => `projectId=${id}`).join("&");
        const result = await fetchApi<{
          data: Array<{
            brandDesc: string | null;
            quantity: number | string;
            amount: number | string;
            fobPrice: number | string;
            landedCost: number | string;
            estMarkup: number | string | null;
          }>;
        }>(`/api/projects/brand-cumulative?${params}`);

        // Group by brand on client side
        const brandMap = new Map<string, BrandSummary>();
        for (const item of result.data || []) {
          const brand = item.brandDesc || "Unknown";
          const existing = brandMap.get(brand) || {
            brand,
            totalQty: 0,
            totalAmount: 0,
            totalFob: 0,
            totalLandedCost: 0,
            avgMarkup: 0,
          };
          existing.totalQty += Number(item.quantity) || 0;
          existing.totalAmount += Number(item.amount) || 0;
          existing.totalFob += Number(item.fobPrice) || 0;
          existing.totalLandedCost += Number(item.landedCost) || 0;
          brandMap.set(brand, existing);
        }

        // Calculate avg markup
        const summaries = Array.from(brandMap.values()).map((b) => ({
          ...b,
          avgMarkup:
            b.totalFob > 0
              ? ((b.totalAmount - b.totalFob) / b.totalFob) * 100
              : 0,
        }));

        setData(summaries);
      } catch {
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [projectId, projectIds]);

  const columns: ColumnDef<BrandSummary, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "brand",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Brand
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("brand")}</span>
        ),
      },
      {
        accessorKey: "totalQty",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Qty
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <span>{(row.getValue("totalQty") as number).toFixed(0)}</span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Amount
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <span>
            {(row.getValue("totalAmount") as number).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        accessorKey: "totalFob",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total FOB
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <span>
            {(row.getValue("totalFob") as number).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        accessorKey: "totalLandedCost",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Landed Cost
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <span>
            {(row.getValue("totalLandedCost") as number).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        accessorKey: "avgMarkup",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Avg Markup %
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <span>{(row.getValue("avgMarkup") as number).toFixed(2)}%</span>
        ),
      },
    ],
    []
  );

  // Calculate totals row
  const totals = React.useMemo(() => {
    const t = data.reduce(
      (acc, row) => ({
        totalQty: acc.totalQty + row.totalQty,
        totalAmount: acc.totalAmount + row.totalAmount,
        totalFob: acc.totalFob + row.totalFob,
        totalLandedCost: acc.totalLandedCost + row.totalLandedCost,
      }),
      { totalQty: 0, totalAmount: 0, totalFob: 0, totalLandedCost: 0 }
    );
    return {
      brand: "TOTAL",
      ...t,
      avgMarkup: t.totalFob > 0 ? ((t.totalAmount - t.totalFob) / t.totalFob) * 100 : 0,
    };
  }, [data]);

  return (
    <div className="space-y-2">
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchKey="brand"
        searchPlaceholder="Search brands..."
        emptyMessage="No brand data available."
        pageSizeOptions={[10, 25, 50]}
      />
      {data.length > 0 && (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid grid-cols-6 gap-4 text-sm font-semibold">
            <span>{totals.brand}</span>
            <span>{totals.totalQty.toFixed(0)}</span>
            <span>
              {totals.totalAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span>
              {totals.totalFob.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span>
              {totals.totalLandedCost.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span>{totals.avgMarkup.toFixed(2)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
