"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

export interface ColorRule<TData> {
  condition: (row: TData) => boolean;
  className: string;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  loadingRows?: number;
  emptyMessage?: string;
  colorRules?: ColorRule<TData>[];
  toolbarActions?: React.ReactNode;
  pageSizeOptions?: number[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  onRowClick,
  isLoading = false,
  loadingRows = 5,
  emptyMessage = "No results found.",
  colorRules = [],
  toolbarActions,
  pageSizeOptions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  function getRowClassName(rowData: TData): string {
    for (const rule of colorRules) {
      if (rule.condition(rowData)) {
        return rule.className;
      }
    }
    return "";
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between py-4">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                {columns.map((_, i) => (
                  <th key={i} className="h-10 px-4 text-left align-middle font-medium">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: loadingRows }).map((_, rowIdx) => (
                <tr key={rowIdx} className="border-b border-zinc-200 dark:border-zinc-800">
                  {columns.map((_, colIdx) => (
                    <td key={colIdx} className="p-4 align-middle">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <DataTableToolbar
        table={table}
        searchKey={searchKey}
        searchPlaceholder={searchPlaceholder}
      >
        {toolbarActions}
      </DataTableToolbar>
      <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
        <table className="w-full caption-bottom text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-zinc-200 dark:border-zinc-800">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-10 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-zinc-200 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900",
                    onRowClick && "cursor-pointer",
                    getRowClassName(row.original)
                  )}
                  onClick={() => onRowClick?.(row.original)}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-24 text-center text-zinc-500 dark:text-zinc-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
    </div>
  );
}

export { ArrowUpDown };
export type { ColumnDef, SortingState };
