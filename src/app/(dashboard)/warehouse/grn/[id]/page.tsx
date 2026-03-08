"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { WarehouseLineItems } from "@/components/warehouse/warehouse-line-items";

interface GRNDetail {
  id: number;
  lineNo: number;
  barcode: string | null;
  serialNo: string | null;
  model: string | null;
  itemDescription: string;
  location: string | null;
  quantity: number;
  unit: string | null;
}

interface GRN {
  id: number;
  grnNo: string;
  grnDate: string;
  vendorInvoice: string | null;
  description: string | null;
  totalAmount: number;
  supplierId: number;
  poNo: string | null;
  supplier?: { id: number; name: string };
  details: GRNDetail[];
}

interface SupplierLookup { id: number; name: string; }
interface PaginatedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }

const lineItemSchema = z.object({
  id: z.number().optional(),
  barcode: z.string().optional().default(""),
  serialNo: z.string().optional().default(""),
  model: z.string().optional().default(""),
  itemDescription: z.string().min(1, "Description is required"),
  location: z.string().optional().default(""),
  quantity: z.coerce.number().min(1, "Min 1"),
  unit: z.string().optional().default("PCS"),
});

const grnSchema = z.object({
  vendorInvoice: z.string().optional().default(""),
  supplierId: z.coerce.number().min(1, "Supplier is required"),
  poNo: z.string().optional().default(""),
  grnDate: z.string().min(1, "Date is required"),
  description: z.string().optional().default(""),
  details: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

type GRNFormData = z.infer<typeof grnSchema>;

export default function GrnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const grnId = Number(params.id);

  const [isEditing, setIsEditing] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const { data: grn, isLoading } = useQuery({
    queryKey: ["grn", grnId],
    queryFn: () => fetchApi<GRN>(`/api/warehouse/grn/${grnId}`),
    enabled: !!grnId,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-lookup"],
    queryFn: () => fetchApi<PaginatedResponse<SupplierLookup>>("/api/setup/suppliers?pageSize=500").then((r) => r.data),
  });

  const form = useForm<GRNFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(grnSchema) as any,
    defaultValues: { vendorInvoice: "", supplierId: 0, poNo: "", grnDate: "", description: "", details: [] },
  });

  React.useEffect(() => {
    if (grn && isEditing) {
      form.reset({
        vendorInvoice: grn.vendorInvoice ?? "",
        supplierId: grn.supplierId,
        poNo: grn.poNo ?? "",
        grnDate: grn.grnDate?.split("T")[0] ?? "",
        description: grn.description ?? "",
        details: grn.details.map((d) => ({
          id: d.id, barcode: d.barcode ?? "", serialNo: d.serialNo ?? "",
          model: d.model ?? "", itemDescription: d.itemDescription,
          location: d.location ?? "", quantity: Number(d.quantity), unit: d.unit ?? "PCS",
        })),
      });
    }
  }, [grn, isEditing, form]);

  const updateMutation = useMutation({
    mutationFn: (data: GRNFormData) =>
      fetchApi<GRN>(`/api/warehouse/grn/${grnId}`, {
        method: "PUT",
        body: JSON.stringify({ ...data, details: data.details.map((d, i) => ({ ...d, lineNo: i + 1 })) }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grn", grnId] });
      queryClient.invalidateQueries({ queryKey: ["grns"] });
      toast.success("GRN updated"); setIsEditing(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => fetchApi(`/api/warehouse/grn/${grnId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grns"] });
      toast.success("GRN deleted"); router.push("/warehouse/grn");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function onSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    form.handleSubmit((data) => updateMutation.mutate(data))(e);
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="text-zinc-500">Loading GRN...</div></div>;
  if (!grn) return <div className="flex flex-col items-center justify-center h-64 gap-4"><div className="text-zinc-500">GRN not found</div><Button variant="outline" onClick={() => router.push("/warehouse/grn")}>Back to List</Button></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/warehouse/grn")}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-semibold">{grn.grnNo}</h1>
            <p className="text-sm text-zinc-500">{grn.supplier?.name} | {format(new Date(grn.grnDate), "dd/MM/yyyy")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && <Button variant="outline" onClick={() => setIsEditing(true)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>}
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={onSubmitForm} className="space-y-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">GRN Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1"><Label>Vendor Invoice</Label><Input {...form.register("vendorInvoice")} /></div>
                <div className="space-y-1">
                  <Label>Supplier *</Label>
                  <Select {...form.register("supplierId")}>
                    <SelectOption value="0">Select Supplier</SelectOption>
                    {suppliers.map((s) => <SelectOption key={s.id} value={String(s.id)}>{s.name}</SelectOption>)}
                  </Select>
                </div>
                <div className="space-y-1"><Label>PO Number</Label><Input {...form.register("poNo")} /></div>
                <div className="space-y-1"><Label>Date *</Label><Input type="date" {...form.register("grnDate")} /></div>
              </div>
              <div className="mt-4"><Label>Description</Label><Input {...form.register("description")} /></div>
            </CardContent>
          </Card>
          <WarehouseLineItems form={form} fieldName="details" />
          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">GRN Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                <div><div className="text-xs text-zinc-500 mb-1">Vendor Invoice</div><div className="font-medium">{grn.vendorInvoice ?? "-"}</div></div>
                <div><div className="text-xs text-zinc-500 mb-1">Supplier</div><div className="font-medium">{grn.supplier?.name ?? "-"}</div></div>
                <div><div className="text-xs text-zinc-500 mb-1">PO Number</div><div className="font-medium">{grn.poNo ?? "-"}</div></div>
                <div><div className="text-xs text-zinc-500 mb-1">Date</div><div className="font-medium">{format(new Date(grn.grnDate), "dd/MM/yyyy")}</div></div>
              </div>
              {grn.description && <div className="mt-4"><div className="text-xs text-zinc-500 mb-1">Description</div><div className="font-medium">{grn.description}</div></div>}
            </CardContent>
          </Card>
          <WarehouseLineItems form={form} fieldName="details" readOnly />
        </div>
      )}

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete GRN" description={`Delete GRN "${grn.grnNo}"? This action cannot be undone.`} onConfirm={() => deleteMutation.mutate()} isLoading={deleteMutation.isPending} />
    </div>
  );
}
