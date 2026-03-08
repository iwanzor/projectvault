"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, ArrowLeft, Type } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/data-display/currency-display";

// --- Types ---

interface CustomerLookup {
  id: number;
  name: string;
  customerCode: string;
}

interface QuotationTerm {
  id: number;
  name: string;
  description: string | null;
}

interface ItemLookup {
  id: number;
  barcode: string;
  name: string;
  modelNo: string;
  salesRate: number;
  fobPrice: number;
  defaultPrice: number;
  estimatedArrivalPrice: number;
}

interface VatSetting {
  id: number;
  percentage: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---

const lineItemSchema = z.object({
  itemId: z.coerce.number().optional(),
  description: z.string().min(1, "Description is required"),
  modelNo: z.string().optional().default(""),
  location: z.string().optional().default(""),
  quantity: z.coerce.number().min(1, "Min 1"),
  rate: z.coerce.number().min(0, "Min 0"),
  fobPrice: z.coerce.number().optional().default(0),
  landedCost: z.coerce.number().optional().default(0),
  isFreeText: z.boolean().default(false),
});

const quotationSchema = z.object({
  customerId: z.coerce.number().min(1, "Customer is required"),
  quotationDate: z.string().min(1, "Date is required"),
  quotationTermsId: z.coerce.number().optional(),
  description: z.string().optional().default(""),
  details: z.array(lineItemSchema).min(1, "At least one line item is required"),
  discountPerc: z.coerce.number().min(0).max(100).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
  vatPerc: z.coerce.number().min(0).default(5),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

// --- Component ---

export default function NewQuotationPage() {
  const router = useRouter();
  const [itemSearches, setItemSearches] = React.useState<Record<number, string>>({});
  const [itemResults, setItemResults] = React.useState<Record<number, ItemLookup[]>>({});
  const [showDropdown, setShowDropdown] = React.useState<number | null>(null);
  const searchTimeouts = React.useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const form = useForm<QuotationFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(quotationSchema) as any,
    defaultValues: {
      customerId: 0,
      quotationDate: format(new Date(), "yyyy-MM-dd"),
      quotationTermsId: undefined,
      description: "",
      details: [],
      discountPerc: 0,
      discountAmount: 0,
      vatPerc: 5,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "details",
  });

  const watchDetails = form.watch("details");
  const watchDiscountPerc = form.watch("discountPerc");
  const watchDiscountAmount = form.watch("discountAmount");
  const watchVatPerc = form.watch("vatPerc");

  // --- Data fetching ---

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-lookup"],
    queryFn: () =>
      fetchApi<PaginatedResponse<CustomerLookup>>("/api/setup/customers?pageSize=500").then((r) => r.data),
  });

  const { data: terms = [] } = useQuery({
    queryKey: ["quotation-terms-lookup"],
    queryFn: () =>
      fetchApi<PaginatedResponse<QuotationTerm>>("/api/setup/quotation-terms?pageSize=500").then((r) => r.data),
  });

  const { data: vatSettings } = useQuery({
    queryKey: ["vat-settings"],
    queryFn: () => fetchApi<VatSetting>("/api/setup/vat"),
  });

  React.useEffect(() => {
    if (vatSettings?.percentage != null) {
      form.setValue("vatPerc", vatSettings.percentage);
    }
  }, [vatSettings, form]);

  // --- Item search ---

  function handleItemSearch(index: number, searchText: string) {
    setItemSearches((prev) => ({ ...prev, [index]: searchText }));

    if (searchTimeouts.current[index]) {
      clearTimeout(searchTimeouts.current[index]);
    }

    if (searchText.length < 2) {
      setItemResults((prev) => ({ ...prev, [index]: [] }));
      setShowDropdown(null);
      return;
    }

    searchTimeouts.current[index] = setTimeout(async () => {
      try {
        const res = await fetchApi<PaginatedResponse<ItemLookup>>(
          `/api/setup/items?search=${encodeURIComponent(searchText)}&pageSize=10`
        );
        setItemResults((prev) => ({ ...prev, [index]: res.data }));
        setShowDropdown(index);
      } catch {
        setItemResults((prev) => ({ ...prev, [index]: [] }));
      }
    }, 300);
  }

  function handleSelectItem(index: number, item: ItemLookup) {
    form.setValue(`details.${index}.itemId`, item.id);
    form.setValue(`details.${index}.description`, item.name);
    form.setValue(`details.${index}.modelNo`, item.modelNo);
    form.setValue(`details.${index}.rate`, Number(item.salesRate));
    form.setValue(`details.${index}.fobPrice`, Number(item.fobPrice));
    form.setValue(`details.${index}.landedCost`, Number(item.estimatedArrivalPrice));
    form.setValue(`details.${index}.isFreeText`, false);
    setItemSearches((prev) => ({ ...prev, [index]: item.name }));
    setShowDropdown(null);
    setItemResults((prev) => ({ ...prev, [index]: [] }));
  }

  function handleAddItem() {
    append({
      itemId: undefined,
      description: "",
      modelNo: "",
      location: "",
      quantity: 1,
      rate: 0,
      fobPrice: 0,
      landedCost: 0,
      isFreeText: false,
    });
  }

  function handleAddFreeText() {
    append({
      itemId: undefined,
      description: "",
      modelNo: "",
      location: "",
      quantity: 1,
      rate: 0,
      fobPrice: 0,
      landedCost: 0,
      isFreeText: true,
    });
  }

  // --- Calculations ---

  const totalAmount = watchDetails?.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0);
  }, 0) ?? 0;

  const discountAmt = watchDiscountPerc > 0
    ? (totalAmount * watchDiscountPerc) / 100
    : Number(watchDiscountAmount) || 0;

  const netAmount = totalAmount - discountAmt;
  const vatAmount = (netAmount * (Number(watchVatPerc) || 0)) / 100;
  const grossTotal = netAmount + vatAmount;

  // --- Submit ---

  const createMutation = useMutation({
    mutationFn: (data: QuotationFormData) => {
      const payload = {
        ...data,
        totalAmount,
        discountAmount: discountAmt,
        netAmount,
        vatAmount,
        grossTotal,
        details: data.details.map((d, i) => ({
          ...d,
          serialNo: i + 1,
          amount: (Number(d.quantity) || 0) * (Number(d.rate) || 0),
        })),
      };
      return fetchApi<{ id: number }>("/api/sales/quotations", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      toast.success("Quotation created successfully");
      router.push(`/sales/quotations/${data.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    form.handleSubmit((data) => {
      createMutation.mutate(data);
    })(e);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/sales/quotations")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">New Quotation</h1>
          <p className="text-sm text-zinc-500">Create a new sales quotation</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Header Fields */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Quotation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label htmlFor="customerId">Customer *</Label>
                <Select id="customerId" {...form.register("customerId")}>
                  <SelectOption value="0">Select Customer</SelectOption>
                  {customers.map((c) => (
                    <SelectOption key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectOption>
                  ))}
                </Select>
                {form.formState.errors.customerId && (
                  <p className="text-xs text-red-500">{form.formState.errors.customerId.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="quotationDate">Date *</Label>
                <Input
                  id="quotationDate"
                  type="date"
                  {...form.register("quotationDate")}
                />
                {form.formState.errors.quotationDate && (
                  <p className="text-xs text-red-500">{form.formState.errors.quotationDate.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="quotationTermsId">Terms</Label>
                <Select id="quotationTermsId" {...form.register("quotationTermsId")}>
                  <SelectOption value="">Select Terms</SelectOption>
                  {terms.map((t) => (
                    <SelectOption key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectOption>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  {...form.register("description")}
                  placeholder="Quotation description..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Line Items</CardTitle>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={handleAddFreeText}>
                  <Type className="mr-2 h-4 w-4" />
                  Add Free Text
                </Button>
                <Button type="button" size="sm" onClick={handleAddItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 border border-dashed rounded-md">
                No items added yet. Click &quot;Add Item&quot; or &quot;Add Free Text&quot; to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="text-left p-2 w-10">#</th>
                      <th className="text-left p-2 w-[220px]">Item / Search</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-left p-2 w-[120px]">Model</th>
                      <th className="text-left p-2 w-[100px]">Location</th>
                      <th className="text-right p-2 w-[80px]">Qty</th>
                      <th className="text-right p-2 w-[110px]">Rate</th>
                      <th className="text-right p-2 w-[120px]">Amount</th>
                      <th className="text-center p-2 w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => {
                      const qty = Number(watchDetails?.[index]?.quantity) || 0;
                      const rate = Number(watchDetails?.[index]?.rate) || 0;
                      const amount = qty * rate;
                      const isFreeText = watchDetails?.[index]?.isFreeText;

                      return (
                        <tr
                          key={field.id}
                          className="border-b border-zinc-100 dark:border-zinc-800/50"
                        >
                          <td className="p-2 text-zinc-400">{index + 1}</td>
                          <td className="p-2 relative">
                            {isFreeText ? (
                              <span className="text-xs text-zinc-400 italic">Free text</span>
                            ) : (
                              <>
                                <Input
                                  className="h-8 text-xs"
                                  placeholder="Search item..."
                                  value={itemSearches[index] ?? ""}
                                  onChange={(e) => handleItemSearch(index, e.target.value)}
                                  onFocus={() => {
                                    if ((itemResults[index]?.length ?? 0) > 0) {
                                      setShowDropdown(index);
                                    }
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => setShowDropdown(null), 200);
                                  }}
                                />
                                {showDropdown === index && (itemResults[index]?.length ?? 0) > 0 && (
                                  <div className="absolute z-50 top-full left-2 right-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {itemResults[index].map((item) => (
                                      <button
                                        key={item.id}
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b last:border-b-0 border-zinc-100 dark:border-zinc-800"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          handleSelectItem(index, item);
                                        }}
                                      >
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-zinc-400">
                                          {item.barcode} | {item.modelNo} | Rate: {Number(item.salesRate).toFixed(2)}
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                          <td className="p-2">
                            <Input
                              className="h-8 text-xs"
                              {...form.register(`details.${index}.description`)}
                              placeholder="Description"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              className="h-8 text-xs"
                              {...form.register(`details.${index}.modelNo`)}
                              placeholder="Model"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              className="h-8 text-xs"
                              {...form.register(`details.${index}.location`)}
                              placeholder="Location"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              className="h-8 text-xs text-right"
                              type="number"
                              min="1"
                              {...form.register(`details.${index}.quantity`)}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              className="h-8 text-xs text-right"
                              type="number"
                              step="0.01"
                              min="0"
                              {...form.register(`details.${index}.rate`)}
                            />
                          </td>
                          <td className="p-2 text-right">
                            <CurrencyDisplay amount={amount} className="text-xs" />
                          </td>
                          <td className="p-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {form.formState.errors.details && (
              <p className="text-xs text-red-500 mt-2">
                {typeof form.formState.errors.details.message === "string"
                  ? form.formState.errors.details.message
                  : "Please check line items"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pricing Summary */}
        <div className="flex justify-end">
          <Card className="w-[400px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pricing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Total Amount</span>
                <CurrencyDisplay amount={totalAmount} />
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>Discount</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="h-7 w-16 text-xs text-right"
                    placeholder="%"
                    {...form.register("discountPerc")}
                  />
                  <span className="text-zinc-400 text-xs">%</span>
                  <span className="text-zinc-400 text-xs">or</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-7 w-24 text-xs text-right"
                    placeholder="Amount"
                    {...form.register("discountAmount")}
                    disabled={watchDiscountPerc > 0}
                  />
                </div>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount Amount</span>
                  <span>-<CurrencyDisplay amount={discountAmt} /></span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t pt-2">
                <span>Net Amount</span>
                <CurrencyDisplay amount={netAmount} />
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>VAT</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-7 w-16 text-xs text-right"
                    {...form.register("vatPerc")}
                  />
                  <span className="text-zinc-400 text-xs">%</span>
                  <CurrencyDisplay amount={vatAmount} className="text-xs w-24 text-right" />
                </div>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Gross Total</span>
                <CurrencyDisplay amount={grossTotal} className="text-lg font-bold" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/sales/quotations")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Saving..." : "Save as Draft"}
          </Button>
        </div>
      </form>
    </div>
  );
}
