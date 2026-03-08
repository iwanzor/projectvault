"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Check, Copy, Pencil, Type, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/data-display/currency-display";
import { StatusBadge } from "@/components/data-display/status-badge";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { Badge } from "@/components/ui/badge";

// --- Types ---

interface QuotationDetail {
  id: number;
  serialNo: number;
  itemId: number | null;
  description: string;
  modelNo: string | null;
  location: string | null;
  quantity: number;
  rate: number;
  amount: number;
  fobPrice: number;
  landedCost: number;
  isFreeText: boolean;
  item?: { id: number; name: string; barcode: string; modelNo: string } | null;
}

interface QuotationRemark {
  id: number;
  remark: string;
  createdAt: string;
  createdBy: string | null;
  user?: { name: string } | null;
}

interface Quotation {
  id: number;
  quotationNo: string;
  quotationDate: string;
  description: string | null;
  status: string;
  customerId: number;
  quotationTermsId: number | null;
  totalAmount: number;
  discountPerc: number;
  discountAmount: number;
  netAmount: number;
  vatPerc: number;
  vatAmount: number;
  grossTotal: number;
  customer?: { id: number; name: string; customerCode: string };
  quotationTerms?: { id: number; name: string } | null;
  details: QuotationDetail[];
  remarks?: QuotationRemark[];
}

interface CustomerLookup {
  id: number;
  name: string;
  customerCode: string;
}

interface QuotationTerm {
  id: number;
  name: string;
}

interface ItemLookup {
  id: number;
  barcode: string;
  name: string;
  modelNo: string;
  salesRate: number;
  fobPrice: number;
  estimatedArrivalPrice: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---

const lineItemSchema = z.object({
  id: z.number().optional(),
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

const quotationStatusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  quotation: { label: "Quotation", variant: "secondary" },
  submitted: { label: "Submitted", variant: "success" },
  project: { label: "Project", variant: "default" },
  archived: { label: "Archived", variant: "warning" },
};

// --- Component ---

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const quotationId = Number(params.id);

  const [isEditing, setIsEditing] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = React.useState(false);
  const [newRemark, setNewRemark] = React.useState("");
  const [editingRemarkId, setEditingRemarkId] = React.useState<number | null>(null);
  const [editingRemarkText, setEditingRemarkText] = React.useState("");
  const [deleteRemarkId, setDeleteRemarkId] = React.useState<number | null>(null);

  const [itemSearches, setItemSearches] = React.useState<Record<number, string>>({});
  const [itemResults, setItemResults] = React.useState<Record<number, ItemLookup[]>>({});
  const [showDropdown, setShowDropdown] = React.useState<number | null>(null);
  const searchTimeouts = React.useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // --- Data fetching ---

  const { data: quotation, isLoading } = useQuery({
    queryKey: ["quotation", quotationId],
    queryFn: () => fetchApi<Quotation>(`/api/sales/quotations/${quotationId}`),
    enabled: !!quotationId,
  });

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

  // --- Form ---

  const form = useForm<QuotationFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(quotationSchema) as any,
    defaultValues: {
      customerId: 0,
      quotationDate: "",
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

  // Reset form when quotation data loads or editing starts
  React.useEffect(() => {
    if (quotation && isEditing) {
      form.reset({
        customerId: quotation.customerId,
        quotationDate: quotation.quotationDate?.split("T")[0] ?? "",
        quotationTermsId: quotation.quotationTermsId ?? undefined,
        description: quotation.description ?? "",
        details: quotation.details.map((d) => ({
          id: d.id,
          itemId: d.itemId ?? undefined,
          description: d.description,
          modelNo: d.modelNo ?? "",
          location: d.location ?? "",
          quantity: Number(d.quantity),
          rate: Number(d.rate),
          fobPrice: Number(d.fobPrice),
          landedCost: Number(d.landedCost),
          isFreeText: d.isFreeText,
        })),
        discountPerc: Number(quotation.discountPerc),
        discountAmount: Number(quotation.discountAmount),
        vatPerc: Number(quotation.vatPerc),
      });

      // Pre-fill item search names
      const searches: Record<number, string> = {};
      quotation.details.forEach((d, i) => {
        searches[i] = d.item?.name ?? d.description;
      });
      setItemSearches(searches);
    }
  }, [quotation, isEditing, form]);

  // --- Calculations ---

  const totalAmount = isEditing
    ? (watchDetails?.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0) ?? 0)
    : Number(quotation?.totalAmount ?? 0);

  const discountAmt = isEditing
    ? (watchDiscountPerc > 0 ? (totalAmount * watchDiscountPerc) / 100 : Number(watchDiscountAmount) || 0)
    : Number(quotation?.discountAmount ?? 0);

  const netAmount = isEditing ? totalAmount - discountAmt : Number(quotation?.netAmount ?? 0);

  const vatPerc = isEditing ? Number(watchVatPerc) || 0 : Number(quotation?.vatPerc ?? 0);
  const vatAmount = isEditing ? (netAmount * vatPerc) / 100 : Number(quotation?.vatAmount ?? 0);
  const grossTotal = isEditing ? netAmount + vatAmount : Number(quotation?.grossTotal ?? 0);

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

  // --- Mutations ---

  const updateMutation = useMutation({
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
      return fetchApi<Quotation>(`/api/sales/quotations/${quotationId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation", quotationId] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation updated successfully");
      setIsEditing(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => fetchApi(`/api/sales/quotations/${quotationId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation deleted");
      router.push("/sales/quotations");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      fetchApi(`/api/sales/quotations/${quotationId}/submit`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation", quotationId] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation submitted");
      setSubmitDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reviseMutation = useMutation({
    mutationFn: () =>
      fetchApi<Quotation>(`/api/sales/quotations/${quotationId}/revise`, { method: "POST" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation revised - opening new copy");
      router.push(`/sales/quotations/${data.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // --- Remarks ---

  const addRemarkMutation = useMutation({
    mutationFn: (remark: string) =>
      fetchApi(`/api/sales/quotations/${quotationId}/remarks`, {
        method: "POST",
        body: JSON.stringify({ remark }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation", quotationId] });
      toast.success("Remark added");
      setNewRemark("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateRemarkMutation = useMutation({
    mutationFn: ({ remarkId, remark }: { remarkId: number; remark: string }) =>
      fetchApi(`/api/sales/quotations/${quotationId}/remarks/${remarkId}`, {
        method: "PUT",
        body: JSON.stringify({ remark }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation", quotationId] });
      toast.success("Remark updated");
      setEditingRemarkId(null);
      setEditingRemarkText("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteRemarkMutation = useMutation({
    mutationFn: (remarkId: number) =>
      fetchApi(`/api/sales/quotations/${quotationId}/remarks/${remarkId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation", quotationId] });
      toast.success("Remark deleted");
      setDeleteRemarkId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function onSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    form.handleSubmit((data) => {
      updateMutation.mutate(data);
    })(e);
  }

  // --- Loading / Not found ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading quotation...</div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-zinc-500">Quotation not found</div>
        <Button variant="outline" onClick={() => router.push("/sales/quotations")}>
          Back to List
        </Button>
      </div>
    );
  }

  const isQuotationStatus = quotation.status === "QUOTATION";
  const isSubmitted = quotation.status === "SUBMITTED";
  const isReadOnly = !isQuotationStatus || !isEditing;

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/sales/quotations")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{quotation.quotationNo}</h1>
              <StatusBadge status={quotation.status} statusMap={quotationStatusMap} />
            </div>
            <p className="text-sm text-zinc-500">
              {quotation.customer?.name} | {format(new Date(quotation.quotationDate), "dd/MM/yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isQuotationStatus && !isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {isQuotationStatus && (
            <Button
              variant="outline"
              onClick={() => setSubmitDialogOpen(true)}
            >
              <Check className="mr-2 h-4 w-4" />
              Submit
            </Button>
          )}
          {isSubmitted && (
            <Button
              variant="outline"
              onClick={() => reviseMutation.mutate()}
              disabled={reviseMutation.isPending}
            >
              <Copy className="mr-2 h-4 w-4" />
              {reviseMutation.isPending ? "Revising..." : "Revise"}
            </Button>
          )}
          {isQuotationStatus && (
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        /* --- EDIT MODE --- */
        <form onSubmit={onSubmitForm} className="space-y-6">
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
                  <Input id="quotationDate" type="date" {...form.register("quotationDate")} />
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
                  <Input id="description" {...form.register("description")} />
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
                  No items added yet.
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
                          <tr key={field.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
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
                              <Input className="h-8 text-xs" {...form.register(`details.${index}.description`)} />
                            </td>
                            <td className="p-2">
                              <Input className="h-8 text-xs" {...form.register(`details.${index}.modelNo`)} />
                            </td>
                            <td className="p-2">
                              <Input className="h-8 text-xs" {...form.register(`details.${index}.location`)} />
                            </td>
                            <td className="p-2">
                              <Input className="h-8 text-xs text-right" type="number" min="1" {...form.register(`details.${index}.quantity`)} />
                            </td>
                            <td className="p-2">
                              <Input className="h-8 text-xs text-right" type="number" step="0.01" min="0" {...form.register(`details.${index}.rate`)} />
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
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      ) : (
        /* --- READ-ONLY VIEW --- */
        <div className="space-y-6">
          {/* Quotation Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Quotation Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Customer</div>
                  <div className="font-medium">{quotation.customer?.name ?? "-"}</div>
                  {quotation.customer?.customerCode && (
                    <div className="text-xs text-zinc-400">{quotation.customer.customerCode}</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Date</div>
                  <div className="font-medium">{format(new Date(quotation.quotationDate), "dd/MM/yyyy")}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Terms</div>
                  <div className="font-medium">{quotation.quotationTerms?.name ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Description</div>
                  <div className="font-medium">{quotation.description ?? "-"}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items (Read Only) */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Line Items ({quotation.details.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                      <th className="text-left p-2 w-10">#</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-left p-2 w-[120px]">Model</th>
                      <th className="text-left p-2 w-[100px]">Location</th>
                      <th className="text-right p-2 w-[80px]">Qty</th>
                      <th className="text-right p-2 w-[110px]">Rate</th>
                      <th className="text-right p-2 w-[120px]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.details.map((detail) => (
                      <tr key={detail.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                        <td className="p-2 text-zinc-400">{detail.serialNo}</td>
                        <td className="p-2">
                          <div>{detail.description}</div>
                          {detail.isFreeText && (
                            <Badge variant="secondary" className="text-[10px] mt-1">Free Text</Badge>
                          )}
                        </td>
                        <td className="p-2 text-zinc-600">{detail.modelNo ?? "-"}</td>
                        <td className="p-2 text-zinc-600">{detail.location ?? "-"}</td>
                        <td className="p-2 text-right">{Number(detail.quantity)}</td>
                        <td className="p-2 text-right">
                          <CurrencyDisplay amount={Number(detail.rate)} className="text-xs" />
                        </td>
                        <td className="p-2 text-right">
                          <CurrencyDisplay amount={Number(detail.amount)} className="text-xs" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Summary (Read Only) */}
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
                {discountAmt > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-zinc-500">
                      <span>Discount ({Number(quotation.discountPerc)}%)</span>
                      <span>-<CurrencyDisplay amount={discountAmt} /></span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-sm border-t pt-2">
                  <span>Net Amount</span>
                  <CurrencyDisplay amount={netAmount} />
                </div>
                <div className="flex justify-between text-sm">
                  <span>VAT ({vatPerc}%)</span>
                  <CurrencyDisplay amount={vatAmount} />
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Gross Total</span>
                  <CurrencyDisplay amount={grossTotal} className="text-lg font-bold" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Remarks Section */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Remarks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Remarks */}
              {quotation.remarks && quotation.remarks.length > 0 ? (
                <div className="space-y-3">
                  {quotation.remarks.map((remark) => (
                    <div key={remark.id} className="border rounded-md p-3">
                      {editingRemarkId === remark.id ? (
                        <div className="space-y-2">
                          <textarea
                            className="flex w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:border-zinc-700"
                            rows={2}
                            value={editingRemarkText}
                            onChange={(e) => setEditingRemarkText(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                updateRemarkMutation.mutate({
                                  remarkId: remark.id,
                                  remark: editingRemarkText,
                                })
                              }
                              disabled={updateRemarkMutation.isPending}
                            >
                              {updateRemarkMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingRemarkId(null);
                                setEditingRemarkText("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm">{remark.remark}</p>
                              <p className="text-xs text-zinc-400 mt-1">
                                {remark.user?.name ?? remark.createdBy ?? "System"} -{" "}
                                {format(new Date(remark.createdAt), "dd/MM/yyyy HH:mm")}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditingRemarkId(remark.id);
                                  setEditingRemarkText(remark.remark);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setDeleteRemarkId(remark.id)}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400">No remarks yet.</p>
              )}

              {/* Add Remark */}
              <div className="flex gap-2 pt-2 border-t">
                <textarea
                  className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:border-zinc-700"
                  rows={2}
                  placeholder="Add a remark..."
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                />
                <Button
                  onClick={() => {
                    if (newRemark.trim()) {
                      addRemarkMutation.mutate(newRemark.trim());
                    }
                  }}
                  disabled={!newRemark.trim() || addRemarkMutation.isPending}
                  className="self-end"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {addRemarkMutation.isPending ? "Adding..." : "Add"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialogs */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Quotation"
        description={`Are you sure you want to delete quotation "${quotation.quotationNo}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
      />

      <ConfirmDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        title="Submit Quotation"
        description={`Are you sure you want to submit quotation "${quotation.quotationNo}"? Once submitted, it cannot be directly edited.`}
        confirmLabel="Submit"
        onConfirm={() => submitMutation.mutate()}
        isLoading={submitMutation.isPending}
        variant="default"
      />

      <ConfirmDialog
        open={deleteRemarkId !== null}
        onOpenChange={(open) => { if (!open) setDeleteRemarkId(null); }}
        title="Delete Remark"
        description="Are you sure you want to delete this remark?"
        onConfirm={() => deleteRemarkId !== null && deleteRemarkMutation.mutate(deleteRemarkId)}
        isLoading={deleteRemarkMutation.isPending}
      />
    </div>
  );
}
