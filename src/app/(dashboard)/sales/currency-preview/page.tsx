"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectOption } from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { fetchApi } from "@/lib/api";
import { DollarSign, RefreshCw } from "lucide-react";

interface Currency {
  id: number;
  currencyCode: string;
  name: string;
  symbol: string | null;
  conversionRate: number | null;
}

interface QuotationListItem {
  id: number;
  quotationNo: string;
  grossTotal: number;
}

export default function CurrencyPreviewPage() {
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [quotationData, currencyData] = await Promise.allSettled([
          fetchApi<{ data: QuotationListItem[] }>(
            "/api/sales/quotations?limit=100"
          ),
          fetchApi<{ data: Currency[] }>("/api/settings/currencies"),
        ]);
        if (quotationData.status === "fulfilled") {
          setQuotations(quotationData.value.data || []);
        }
        if (currencyData.status === "fulfilled") {
          setCurrencies(currencyData.value.data || []);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedQt = quotations.find(
    (q) => q.id === Number(selectedQuotation)
  );
  const baseAmount = selectedQt ? Number(selectedQt.grossTotal) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <DollarSign className="h-6 w-6 text-zinc-500" />
        <h1 className="text-xl font-semibold">Currency Preview</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Quotation Currency Conversion
          </CardTitle>
          <CardDescription>
            View quotation amounts converted to different currencies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                Select Quotation
              </label>
              <Select
                value={selectedQuotation}
                onChange={(e) => setSelectedQuotation(e.target.value)}
              >
                <SelectOption value="">-- Select a quotation --</SelectOption>
                {quotations.map((q) => (
                  <SelectOption key={q.id} value={String(q.id)}>
                    {q.quotationNo} - Total:{" "}
                    {Number(q.grossTotal).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </SelectOption>
                ))}
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-5"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {loading && (
            <p className="text-sm text-zinc-500">Loading data...</p>
          )}

          {!loading && selectedQt && currencies.length > 0 && (
            <div className="rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                      Currency
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                      Symbol
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                      Conversion Rate
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                      Converted Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currencies.map((currency, index) => {
                    const rate = Number(currency.conversionRate || 1);
                    const converted = baseAmount * rate;
                    return (
                      <tr
                        key={currency.id}
                        className={
                          index % 2 === 0
                            ? ""
                            : "bg-zinc-50/50 dark:bg-zinc-800/20"
                        }
                      >
                        <td className="px-4 py-2.5 font-medium">
                          {currency.name}{" "}
                          <span className="text-zinc-400">
                            ({currency.currencyCode})
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-zinc-500">
                          {currency.symbol || "-"}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {rate.toFixed(4)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                          {currency.symbol || ""}
                          {converted.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !selectedQt && (
            <div className="text-center py-12 text-zinc-400">
              <DollarSign className="mx-auto h-10 w-10 mb-3 opacity-50" />
              <p>Select a quotation to see currency conversions.</p>
            </div>
          )}

          {!loading && selectedQt && currencies.length === 0 && (
            <p className="text-sm text-zinc-500">
              No currencies configured. Add currencies in Settings to see
              conversions.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
