"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, Search, Package } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface Item {
  id: number;
  itemCode: string;
  name: string;
  barcode?: string;
  brand?: { name: string };
  category?: { name: string };
  unit?: { name: string };
}

interface ItemsResponse {
  data: Item[];
  total: number;
}

export default function LabelsPage() {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["label-items", search],
    queryFn: () =>
      fetchApi<ItemsResponse>(
        `/api/setup/items?search=${encodeURIComponent(search)}&pageSize=10`
      ),
    enabled: search.length >= 2,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Label Printing</h1>
        <p className="mt-1 text-gray-600">
          Search for items and print barcode labels for warehouse inventory.
        </p>
      </div>

      {/* Search */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <label
          htmlFor="item-search"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Search by item code, name, or barcode
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="item-search"
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedItem(null);
            }}
            placeholder="Enter item code, name, or barcode..."
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Search results */}
        {isLoading && search.length >= 2 && (
          <div className="mt-3 text-sm text-gray-500">Searching...</div>
        )}
        {data && data.data.length > 0 && !selectedItem && (
          <div className="mt-3 max-h-60 overflow-y-auto rounded-md border border-gray-200">
            {data.data.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left text-sm transition-colors last:border-0 hover:bg-gray-50"
              >
                <Package className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">
                    {item.itemCode} - {item.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.barcode && `Barcode: ${item.barcode}`}
                    {item.brand && ` | ${item.brand.name}`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        {data && data.data.length === 0 && search.length >= 2 && (
          <div className="mt-3 text-sm text-gray-500">
            No items found matching &ldquo;{search}&rdquo;
          </div>
        )}
      </div>

      {/* Selected Item Details */}
      {selectedItem && (
        <div
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none"
          id="print-label"
        >
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Item Label Preview
          </h3>
          <div className="space-y-3 rounded-md border border-dashed border-gray-300 p-6">
            <div className="text-lg font-bold text-gray-900">
              {selectedItem.name}
            </div>
            <div className="text-sm text-gray-600">
              Code: {selectedItem.itemCode}
            </div>
            {selectedItem.barcode && (
              <div className="font-mono text-2xl tracking-widest text-gray-800">
                {selectedItem.barcode}
              </div>
            )}
            <div className="flex gap-4 text-xs text-gray-500">
              {selectedItem.brand && <span>Brand: {selectedItem.brand.name}</span>}
              {selectedItem.category && (
                <span>Category: {selectedItem.category.name}</span>
              )}
              {selectedItem.unit && <span>Unit: {selectedItem.unit.name}</span>}
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 print:hidden"
          >
            <Printer className="h-4 w-4" />
            Print Label
          </button>
        </div>
      )}

      {/* Info */}
      {!selectedItem && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            Search for a warehouse item above to preview and print its label.
            Labels include item code, name, barcode, and classification details.
          </p>
        </div>
      )}
    </div>
  );
}
