"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
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

interface SupplierLookup {
  id: number;
  name: string;
}

interface ProjectLookup {
  id: number;
  projectNo: string;
  name: string;
}

interface ItemLookup {
  id: number;
  barcode: string;
  name: string;
  modelNo: string;
  fobPrice: number;
  defaultPrice: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

const poLineSchema = z.object({
  barcode: z.string().optional().default(""),
  itemDescription: z.string().min(1, "Description is required"),
  unitCode: z.string().optional().default("PCS"),
  quantity: z.coerce.number().min(1, "Min 1"),
  defFob: z.coerce.number().min(0).default(0),
  currency: z.string().optional().default("AED"),
  convRate: z.coerce.number().min(0).default(1),
  vatPerc: z.coerce.number().min(0).default(5),
});

const poSchema = z.object({
  supplierId: z.coerce.number().min(1, "Supplier is required"),
  projectNo: z.string().optional().default(""),
  poDate: z.string().min(1, "Date is required"),
  description: z.string().optional().default(""),
  details: z.array(poLineSchema).min(1, "At least one line item is required"),
  discountPerc: z.coerce.number().min(0).max(100).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
  freightCharges: z.coerce.number().min(0).default(0),
  miscCharges: z.coerce.number().min(0).default(0),
  vatPerc: z.coerce.number().min(0).default(5),
});

type POFormData = z.infer<typeof poSchema>;

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [itemSearches, setItemSearches] = React.useState<Record<number, string>>({});
  const [itemResults, setItemResults] = React.useState<Record<number, ItemLookup[]>>({});
  const [showDropdown, setShowDropdown] = React.useState<number | null>(null);
  const searchTimeouts = React.useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const form = useForm<POFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(poSchema) as any,
    defaultValues: {
      supplierId: 0,
      projectNo: "",
      poDate: format(new Date(), "yyyy-MM-dd"),
      description: "",
      details: [],
      discountPerc: 0,
      discountAmount: 0,
      freightCharges: 0,
      miscCharges: 0,
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
  const watchFreight = form.watch("freightCharges");
  const watchMisc = form.watch("miscCharges");
  const watchVatPerc = form.watch("vatPerc");

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-lookup"],
    queryFn: () =>
      fetchApi<PaginatedResponse<SupplierLookup>>("/api/setup/suppliers?pageSize=500").then((r) => r.data),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-lookup"],
    queryFn: () =>
      fetchApi<PaginatedResponse<ProjectLookup>>("/api/projects?pageSize=500").then((r) => r.data),
  });

  function handleItemSearch(index: number, searchText: string) {
    setItemSearches((prev) => ({ ...prev, [index]: searchText }));
    if (searchTimeouts.current[index]) clearTimeout(searchTimeouts.current[index]);
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
    form.setValue(`details.${index}.barcode`, item.barcode);
    form.setValue(`details.${index}.itemDescription`, item.name);
    form.setValue(`details.${index}.defFob`, Number(item.fobPrice));
    setItemSearches((prev) => ({ ...prev, [index]: `${item.barcode} - ${item.name}` }));
    setShowDropdown(null);
    setItemResults((prev) => ({ ...prev, [index]: [] }));
  }

  function handleAddItem() {
    append({
      barcode: "",
      itemDescription: "",
      unitCode: "PCS",
      quantity: 1,
      defFob: 0,
      currency: "AED",
      convRate: 1,
      vatPerc: 5,
    });
  }

  // Calculations
  const totalAmount = watchDetails?.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.defFob) || 0) * (Number(item.convRate) || 1);
  }, 0) ?? 0;

  const discountAmt = watchDiscountPerc > 0
    ? (totalAmount * watchDiscountPerc) / 100
    : Number(watchDiscountAmount) || 0;

  const netAmount = totalAmount - discountAmt + (Number(watchFreight) || 0) + (Number(watchMisc) || 0);
  const vatAmount = (netAmount * (Number(watchVatPerc) || 0)) / 100;
  const grossTotal = netAmount + vatAmount;

  const createMutation = useMutation({
    mutationFn: (data: POFormData) => {
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
          amount: (Number(d.quantity) || 0) * (Number(d.defFob) || 0) * (Number(d.convRate) || 1),
        })),
      };
      return fetchApi<{ id: number }>("/api/warehouse/purchase-orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      toast.success("Purchase order created successfully");
      router.push(`/warehouse/purchase-orders/${data.id}`);
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/warehouse/purchase-orders")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">New Purchase Order</h1>
          <p className="text-sm text-zinc-500">Create a new purchase order</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">PO Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label htmlFor="supplierId">Supplier *</Label>
                <Select id="supplierId" {...form.register("supplierId")}>
                  <SelectOption value="0">Select Supplier</SelectOption>
                  {suppliers.map((s) => (
                    <SelectOption key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectOption>
                  ))}
                </Select>
                {form.formState.errors.supplierId && (
                  <p className="text-xs text-red-500">{form.formState.errors.supplierId.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="projectNo">Project</Label>
                <Select id="projectNo" {...form.register("projectNo")}>
                  <SelectOption value="">Select Project</SelectOption>
                  {projects.map((p) => (
                    <SelectOption key={p.id} value={p.projectNo}>
                      {p.projectNo} - {p.name}
                    </SelectOption>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="poDate">Date *</Label>
                <Input id="poDate" type="date" {...form.register("poDate")} />
                {form.formState.errors.poDate && (
                  <p className="text-xs text-red-500">{form.formState.errors.poDate.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...form.register("description")} placeholder="PO description..." />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Line Items</CardTitle>
              <Button type="button" size="sm" onClick={handleAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 border border-dashed rounded-md">
                No items added yet. Click &quot;Add Item&quot; to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="text-left p-2 w-10">#</th>
                      <th className="text-left p-2 w-[200px]">Barcode / Item</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-left p-2 w-[70px]">Unit</th>
                      <th className="text-right p-2 w-[70px]">Qty</th>
                      <th className="text-right p-2 w-[100px]">FOB</th>
                      <th className="text-left p-2 w-[70px]">Curr</th>
                      <th className="text-right p-2 w-[80px]">Conv Rate</th>
                      <th className="text-right p-2 w-[70px]">VAT %</th>
                      <th className="text-right p-2 w-[110px]">Amount</th>
                      <th className="text-center p-2 w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => {
                      const qty = Number(watchDetails?.[index]?.quantity) || 0;
                      const fob = Number(watchDetails?.[index]?.defFob) || 0;
                      const conv = Number(watchDetails?.[index]?.convRate) || 1;
                      const amount = qty * fob * conv;

                      return (
                        <tr key={field.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                          <td className="p-2 text-zinc-400">{index + 1}</td>
                          <td className="p-2 relative">
                            <Input
                              className="h-8 text-xs"
                              placeholder="Search item..."
                              value={itemSearches[index] ?? ""}
                              onChange={(e) => handleItemSearch(index, e.target.value)}
                              onFocus={() => {
                                if ((itemResults[index]?.length ?? 0) > 0) setShowDropdown(index);
                              }}
                              onBlur={() => setTimeout(() => setShowDropdown(null), 200)}
                            />
                            {showDropdown === index && (itemResults[index]?.length ?? 0) > 0 && (
                              <div className="absolute z-50 top-full left-2 right-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {itemResults[index].map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b last:border-b-0"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleSelectItem(index, item);
                                    }}
                                  >
                                    <div className="font-medium">{item.barcode}</div>
                                    <div className="text-zinc-400">{item.name}</div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-2">
                            <Input className="h-8 text-xs" {...form.register(`details.${index}.itemDescription`)} placeholder="Description" />
                          </td>
                          <td className="p-2">
                            <Input className="h-8 text-xs" {...form.register(`details.${index}.unitCode`)} />
                          </td>
                          <td className="p-2">
                            <Input className="h-8 text-xs text-right" type="number" min="1" {...form.register(`details.${index}.quantity`)} />
                          </td>
                          <td className="p-2">
                            <Input className="h-8 text-xs text-right" type="number" step="0.01" min="0" {...form.register(`details.${index}.defFob`)} />
                          </td>
                          <td className="p-2">
                            <Input className="h-8 text-xs" {...form.register(`details.${index}.currency`)} />
                          </td>
                          <td className="p-2">
                            <Input className="h-8 text-xs text-right" type="number" step="0.0001" min="0" {...form.register(`details.${index}.convRate`)} />
                          </td>
                          <td className="p-2">
                            <Input className="h-8 text-xs text-right" type="number" step="0.01" min="0" {...form.register(`details.${index}.vatPerc`)} />
                          </td>
                          <td className="p-2 text-right">
                            <CurrencyDisplay amount={amount} className="text-xs" />
                          </td>
                          <td className="p-2 text-center">
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(index)}>
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
          <Card className="w-[420px]">
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
                  <Input type="number" step="0.01" min="0" max="100" className="h-7 w-16 text-xs text-right" placeholder="%" {...form.register("discountPerc")} />
                  <span className="text-zinc-400 text-xs">%</span>
                  <span className="text-zinc-400 text-xs">or</span>
                  <Input type="number" step="0.01" min="0" className="h-7 w-24 text-xs text-right" placeholder="Amount" {...form.register("discountAmount")} disabled={watchDiscountPerc > 0} />
                </div>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount Amount</span>
                  <span>-<CurrencyDisplay amount={discountAmt} /></span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>Freight Charges</span>
                <Input type="number" step="0.01" min="0" className="h-7 w-28 text-xs text-right" {...form.register("freightCharges")} />
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>Misc Charges</span>
                <Input type="number" step="0.01" min="0" className="h-7 w-28 text-xs text-right" {...form.register("miscCharges")} />
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span>Net Amount</span>
                <CurrencyDisplay amount={netAmount} />
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>VAT</span>
                <div className="flex items-center gap-2">
                  <Input type="number" step="0.01" min="0" className="h-7 w-16 text-xs text-right" {...form.register("vatPerc")} />
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

        <div className="flex items-center justify-end gap-3 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => router.push("/warehouse/purchase-orders")}>
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
