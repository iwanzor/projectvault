"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Check, PackageCheck, Pencil } from "lucide-react";
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

interface PODetail {
  id: number;
  serialNo: number;
  barcode: string | null;
  itemDescription: string;
  unitCode: string | null;
  quantity: number;
  defFob: number;
  currency: string | null;
  convRate: number;
  vatPerc: number;
  amount: number;
}

interface PurchaseOrder {
  id: number;
  poNo: string;
  poDate: string;
  description: string | null;
  status: string;
  supplierId: number;
  projectNo: string | null;
  totalAmount: number;
  discountPerc: number;
  discountAmount: number;
  freightCharges: number;
  miscCharges: number;
  netAmount: number;
  vatPerc: number;
  vatAmount: number;
  grossTotal: number;
  supplier?: { id: number; name: string };
  project?: { id: number; projectNo: string; name: string } | null;
  details: PODetail[];
}

interface SupplierLookup { id: number; name: string; }
interface ProjectLookup { id: number; projectNo: string; name: string; }
interface ItemLookup { id: number; barcode: string; name: string; fobPrice: number; }
interface PaginatedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }

const poLineSchema = z.object({
  id: z.number().optional(),
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

const poStatusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  draft: { label: "Draft", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  received: { label: "Received", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const poId = Number(params.id);

  const [isEditing, setIsEditing] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = React.useState(false);
  const [itemSearches, setItemSearches] = React.useState<Record<number, string>>({});
  const [itemResults, setItemResults] = React.useState<Record<number, ItemLookup[]>>({});
  const [showDropdown, setShowDropdown] = React.useState<number | null>(null);
  const searchTimeouts = React.useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const { data: po, isLoading } = useQuery({
    queryKey: ["purchase-order", poId],
    queryFn: () => fetchApi<PurchaseOrder>(`/api/warehouse/purchase-orders/${poId}`),
    enabled: !!poId,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-lookup"],
    queryFn: () => fetchApi<PaginatedResponse<SupplierLookup>>("/api/setup/suppliers?pageSize=500").then((r) => r.data),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-lookup"],
    queryFn: () => fetchApi<PaginatedResponse<ProjectLookup>>("/api/projects?pageSize=500").then((r) => r.data),
  });

  const form = useForm<POFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(poSchema) as any,
    defaultValues: {
      supplierId: 0, projectNo: "", poDate: "", description: "",
      details: [], discountPerc: 0, discountAmount: 0, freightCharges: 0, miscCharges: 0, vatPerc: 5,
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "details" });
  const watchDetails = form.watch("details");
  const watchDiscountPerc = form.watch("discountPerc");
  const watchDiscountAmount = form.watch("discountAmount");
  const watchFreight = form.watch("freightCharges");
  const watchMisc = form.watch("miscCharges");
  const watchVatPerc = form.watch("vatPerc");

  React.useEffect(() => {
    if (po && isEditing) {
      form.reset({
        supplierId: po.supplierId,
        projectNo: po.projectNo ?? "",
        poDate: po.poDate?.split("T")[0] ?? "",
        description: po.description ?? "",
        details: po.details.map((d) => ({
          id: d.id, barcode: d.barcode ?? "", itemDescription: d.itemDescription,
          unitCode: d.unitCode ?? "PCS", quantity: Number(d.quantity), defFob: Number(d.defFob),
          currency: d.currency ?? "AED", convRate: Number(d.convRate), vatPerc: Number(d.vatPerc),
        })),
        discountPerc: Number(po.discountPerc), discountAmount: Number(po.discountAmount),
        freightCharges: Number(po.freightCharges), miscCharges: Number(po.miscCharges), vatPerc: Number(po.vatPerc),
      });
      const searches: Record<number, string> = {};
      po.details.forEach((d, i) => { searches[i] = d.barcode ? `${d.barcode} - ${d.itemDescription}` : d.itemDescription; });
      setItemSearches(searches);
    }
  }, [po, isEditing, form]);

  // Calculations
  const totalAmount = isEditing
    ? (watchDetails?.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.defFob) || 0) * (Number(i.convRate) || 1), 0) ?? 0)
    : Number(po?.totalAmount ?? 0);
  const discountAmt = isEditing
    ? (watchDiscountPerc > 0 ? (totalAmount * watchDiscountPerc) / 100 : Number(watchDiscountAmount) || 0)
    : Number(po?.discountAmount ?? 0);
  const freight = isEditing ? Number(watchFreight) || 0 : Number(po?.freightCharges ?? 0);
  const misc = isEditing ? Number(watchMisc) || 0 : Number(po?.miscCharges ?? 0);
  const netAmount = isEditing ? totalAmount - discountAmt + freight + misc : Number(po?.netAmount ?? 0);
  const vatPerc = isEditing ? Number(watchVatPerc) || 0 : Number(po?.vatPerc ?? 0);
  const vatAmount = isEditing ? (netAmount * vatPerc) / 100 : Number(po?.vatAmount ?? 0);
  const grossTotal = isEditing ? netAmount + vatAmount : Number(po?.grossTotal ?? 0);

  function handleItemSearch(index: number, searchText: string) {
    setItemSearches((prev) => ({ ...prev, [index]: searchText }));
    if (searchTimeouts.current[index]) clearTimeout(searchTimeouts.current[index]);
    if (searchText.length < 2) { setItemResults((prev) => ({ ...prev, [index]: [] })); setShowDropdown(null); return; }
    searchTimeouts.current[index] = setTimeout(async () => {
      try {
        const res = await fetchApi<PaginatedResponse<ItemLookup>>(`/api/setup/items?search=${encodeURIComponent(searchText)}&pageSize=10`);
        setItemResults((prev) => ({ ...prev, [index]: res.data }));
        setShowDropdown(index);
      } catch { setItemResults((prev) => ({ ...prev, [index]: [] })); }
    }, 300);
  }

  function handleSelectItem(index: number, item: ItemLookup) {
    form.setValue(`details.${index}.barcode`, item.barcode);
    form.setValue(`details.${index}.itemDescription`, item.name);
    form.setValue(`details.${index}.defFob`, Number(item.fobPrice));
    setItemSearches((prev) => ({ ...prev, [index]: `${item.barcode} - ${item.name}` }));
    setShowDropdown(null);
  }

  const updateMutation = useMutation({
    mutationFn: (data: POFormData) => {
      const payload = {
        ...data, totalAmount, discountAmount: discountAmt, netAmount, vatAmount, grossTotal,
        details: data.details.map((d, i) => ({ ...d, serialNo: i + 1, amount: (Number(d.quantity) || 0) * (Number(d.defFob) || 0) * (Number(d.convRate) || 1) })),
      };
      return fetchApi<PurchaseOrder>(`/api/warehouse/purchase-orders/${poId}`, { method: "PUT", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order updated"); setIsEditing(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => fetchApi(`/api/warehouse/purchase-orders/${poId}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["purchase-orders"] }); toast.success("Purchase order deleted"); router.push("/warehouse/purchase-orders"); },
    onError: (error: Error) => toast.error(error.message),
  });

  const approveMutation = useMutation({
    mutationFn: () => fetchApi(`/api/warehouse/purchase-orders/${poId}/approve`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order approved"); setApproveDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const receiveMutation = useMutation({
    mutationFn: () => fetchApi(`/api/warehouse/purchase-orders/${poId}/receive`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", poId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order marked as received"); setReceiveDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function onSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    form.handleSubmit((data) => updateMutation.mutate(data))(e);
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="text-zinc-500">Loading purchase order...</div></div>;
  }

  if (!po) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-zinc-500">Purchase order not found</div>
        <Button variant="outline" onClick={() => router.push("/warehouse/purchase-orders")}>Back to List</Button>
      </div>
    );
  }

  const isDraft = po.status === "DRAFT";
  const isApproved = po.status === "APPROVED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/warehouse/purchase-orders")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{po.poNo}</h1>
              <StatusBadge status={po.status} statusMap={poStatusMap} />
            </div>
            <p className="text-sm text-zinc-500">
              {po.supplier?.name} | {format(new Date(po.poDate), "dd/MM/yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && !isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />Edit
            </Button>
          )}
          {isDraft && (
            <Button variant="outline" onClick={() => setApproveDialogOpen(true)}>
              <Check className="mr-2 h-4 w-4" />Approve
            </Button>
          )}
          {isApproved && (
            <Button variant="outline" onClick={() => setReceiveDialogOpen(true)}>
              <PackageCheck className="mr-2 h-4 w-4" />Receive
            </Button>
          )}
          {isDraft && (
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />Delete
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={onSubmitForm} className="space-y-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">PO Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label>Supplier *</Label>
                  <Select {...form.register("supplierId")}>
                    <SelectOption value="0">Select Supplier</SelectOption>
                    {suppliers.map((s) => <SelectOption key={s.id} value={String(s.id)}>{s.name}</SelectOption>)}
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Project</Label>
                  <Select {...form.register("projectNo")}>
                    <SelectOption value="">Select Project</SelectOption>
                    {projects.map((p) => <SelectOption key={p.id} value={p.projectNo}>{p.projectNo} - {p.name}</SelectOption>)}
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Date *</Label>
                  <Input type="date" {...form.register("poDate")} />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Input {...form.register("description")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Line Items</CardTitle>
                <Button type="button" size="sm" onClick={() => append({ barcode: "", itemDescription: "", unitCode: "PCS", quantity: 1, defFob: 0, currency: "AED", convRate: 1, vatPerc: 5 })}>
                  <Plus className="mr-2 h-4 w-4" />Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 border border-dashed rounded-md">No items added yet.</div>
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
                        <th className="w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, index) => {
                        const qty = Number(watchDetails?.[index]?.quantity) || 0;
                        const fob = Number(watchDetails?.[index]?.defFob) || 0;
                        const conv = Number(watchDetails?.[index]?.convRate) || 1;
                        return (
                          <tr key={field.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                            <td className="p-2 text-zinc-400">{index + 1}</td>
                            <td className="p-2 relative">
                              <Input className="h-8 text-xs" placeholder="Search item..." value={itemSearches[index] ?? ""} onChange={(e) => handleItemSearch(index, e.target.value)} onFocus={() => { if ((itemResults[index]?.length ?? 0) > 0) setShowDropdown(index); }} onBlur={() => setTimeout(() => setShowDropdown(null), 200)} />
                              {showDropdown === index && (itemResults[index]?.length ?? 0) > 0 && (
                                <div className="absolute z-50 top-full left-2 right-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                  {itemResults[index].map((item) => (
                                    <button key={item.id} type="button" className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b last:border-b-0" onMouseDown={(e) => { e.preventDefault(); handleSelectItem(index, item); }}>
                                      <div className="font-medium">{item.barcode}</div>
                                      <div className="text-zinc-400">{item.name}</div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="p-2"><Input className="h-8 text-xs" {...form.register(`details.${index}.itemDescription`)} /></td>
                            <td className="p-2"><Input className="h-8 text-xs" {...form.register(`details.${index}.unitCode`)} /></td>
                            <td className="p-2"><Input className="h-8 text-xs text-right" type="number" min="1" {...form.register(`details.${index}.quantity`)} /></td>
                            <td className="p-2"><Input className="h-8 text-xs text-right" type="number" step="0.01" {...form.register(`details.${index}.defFob`)} /></td>
                            <td className="p-2"><Input className="h-8 text-xs" {...form.register(`details.${index}.currency`)} /></td>
                            <td className="p-2"><Input className="h-8 text-xs text-right" type="number" step="0.0001" {...form.register(`details.${index}.convRate`)} /></td>
                            <td className="p-2"><Input className="h-8 text-xs text-right" type="number" step="0.01" {...form.register(`details.${index}.vatPerc`)} /></td>
                            <td className="p-2 text-right"><CurrencyDisplay amount={qty * fob * conv} className="text-xs" /></td>
                            <td className="p-2 text-center"><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(index)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Card className="w-[420px]">
              <CardHeader className="pb-3"><CardTitle className="text-base">Pricing Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span>Total Amount</span><CurrencyDisplay amount={totalAmount} /></div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span>Discount</span>
                  <div className="flex items-center gap-2">
                    <Input type="number" step="0.01" className="h-7 w-16 text-xs text-right" {...form.register("discountPerc")} />
                    <span className="text-zinc-400 text-xs">%</span>
                    <span className="text-zinc-400 text-xs">or</span>
                    <Input type="number" step="0.01" className="h-7 w-24 text-xs text-right" {...form.register("discountAmount")} disabled={watchDiscountPerc > 0} />
                  </div>
                </div>
                {discountAmt > 0 && <div className="flex justify-between text-sm text-red-600"><span>Discount Amount</span><span>-<CurrencyDisplay amount={discountAmt} /></span></div>}
                <div className="flex items-center justify-between gap-2 text-sm"><span>Freight</span><Input type="number" step="0.01" className="h-7 w-28 text-xs text-right" {...form.register("freightCharges")} /></div>
                <div className="flex items-center justify-between gap-2 text-sm"><span>Misc</span><Input type="number" step="0.01" className="h-7 w-28 text-xs text-right" {...form.register("miscCharges")} /></div>
                <div className="flex justify-between text-sm border-t pt-2"><span>Net Amount</span><CurrencyDisplay amount={netAmount} /></div>
                <div className="flex items-center justify-between gap-2 text-sm"><span>VAT</span><div className="flex items-center gap-2"><Input type="number" step="0.01" className="h-7 w-16 text-xs text-right" {...form.register("vatPerc")} /><span className="text-zinc-400 text-xs">%</span><CurrencyDisplay amount={vatAmount} className="text-xs w-24 text-right" /></div></div>
                <div className="flex justify-between text-lg font-bold border-t pt-3"><span>Gross Total</span><CurrencyDisplay amount={grossTotal} className="text-lg font-bold" /></div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">PO Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                <div><div className="text-xs text-zinc-500 mb-1">Supplier</div><div className="font-medium">{po.supplier?.name ?? "-"}</div></div>
                <div><div className="text-xs text-zinc-500 mb-1">Project</div><div className="font-medium">{po.project?.projectNo ?? po.projectNo ?? "-"}</div></div>
                <div><div className="text-xs text-zinc-500 mb-1">Date</div><div className="font-medium">{format(new Date(po.poDate), "dd/MM/yyyy")}</div></div>
                <div><div className="text-xs text-zinc-500 mb-1">Description</div><div className="font-medium">{po.description ?? "-"}</div></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">Line Items ({po.details.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                      <th className="text-left p-2 w-10">#</th>
                      <th className="text-left p-2">Barcode</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-left p-2">Unit</th>
                      <th className="text-right p-2">Qty</th>
                      <th className="text-right p-2">FOB</th>
                      <th className="text-left p-2">Curr</th>
                      <th className="text-right p-2">Conv Rate</th>
                      <th className="text-right p-2">VAT %</th>
                      <th className="text-right p-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {po.details.map((d) => (
                      <tr key={d.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                        <td className="p-2 text-zinc-400">{d.serialNo}</td>
                        <td className="p-2">{d.barcode ?? "-"}</td>
                        <td className="p-2">{d.itemDescription}</td>
                        <td className="p-2">{d.unitCode ?? "-"}</td>
                        <td className="p-2 text-right">{Number(d.quantity)}</td>
                        <td className="p-2 text-right"><CurrencyDisplay amount={Number(d.defFob)} className="text-xs" /></td>
                        <td className="p-2">{d.currency ?? "AED"}</td>
                        <td className="p-2 text-right">{Number(d.convRate)}</td>
                        <td className="p-2 text-right">{Number(d.vatPerc)}%</td>
                        <td className="p-2 text-right"><CurrencyDisplay amount={Number(d.amount)} className="text-xs" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Card className="w-[400px]">
              <CardHeader className="pb-3"><CardTitle className="text-base">Pricing Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span>Total Amount</span><CurrencyDisplay amount={totalAmount} /></div>
                {discountAmt > 0 && <div className="flex justify-between text-sm text-zinc-500"><span>Discount ({Number(po.discountPerc)}%)</span><span>-<CurrencyDisplay amount={discountAmt} /></span></div>}
                {freight > 0 && <div className="flex justify-between text-sm"><span>Freight Charges</span><CurrencyDisplay amount={freight} /></div>}
                {misc > 0 && <div className="flex justify-between text-sm"><span>Misc Charges</span><CurrencyDisplay amount={misc} /></div>}
                <div className="flex justify-between text-sm border-t pt-2"><span>Net Amount</span><CurrencyDisplay amount={netAmount} /></div>
                <div className="flex justify-between text-sm"><span>VAT ({vatPerc}%)</span><CurrencyDisplay amount={vatAmount} /></div>
                <div className="flex justify-between text-lg font-bold border-t pt-3"><span>Gross Total</span><CurrencyDisplay amount={grossTotal} className="text-lg font-bold" /></div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Purchase Order" description={`Are you sure you want to delete "${po.poNo}"? This action cannot be undone.`} onConfirm={() => deleteMutation.mutate()} isLoading={deleteMutation.isPending} />
      <ConfirmDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen} title="Approve Purchase Order" description={`Approve purchase order "${po.poNo}"?`} confirmLabel="Approve" onConfirm={() => approveMutation.mutate()} isLoading={approveMutation.isPending} variant="default" />
      <ConfirmDialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen} title="Receive Purchase Order" description={`Mark "${po.poNo}" as received?`} confirmLabel="Receive" onConfirm={() => receiveMutation.mutate()} isLoading={receiveMutation.isPending} variant="default" />
    </div>
  );
}
