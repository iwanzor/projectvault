"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WarehouseLineItems } from "@/components/warehouse/warehouse-line-items";

interface SupplierLookup { id: number; name: string; }
interface PaginatedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }

const lineItemSchema = z.object({
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

export default function NewGrnPage() {
  const router = useRouter();

  const form = useForm<GRNFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(grnSchema) as any,
    defaultValues: {
      vendorInvoice: "",
      supplierId: 0,
      poNo: "",
      grnDate: format(new Date(), "yyyy-MM-dd"),
      description: "",
      details: [],
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-lookup"],
    queryFn: () =>
      fetchApi<PaginatedResponse<SupplierLookup>>("/api/setup/suppliers?pageSize=500").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: GRNFormData) =>
      fetchApi<{ id: number }>("/api/warehouse/grn", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          details: data.details.map((d, i) => ({ ...d, lineNo: i + 1 })),
        }),
      }),
    onSuccess: (data) => {
      toast.success("GRN created successfully");
      router.push(`/warehouse/grn/${data.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    form.handleSubmit((data) => createMutation.mutate(data))(e);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/warehouse/grn")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">New Goods Received Note</h1>
          <p className="text-sm text-zinc-500">Record received goods</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-4"><CardTitle className="text-base">GRN Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label>Vendor Invoice</Label>
                <Input {...form.register("vendorInvoice")} placeholder="Invoice number..." />
              </div>
              <div className="space-y-1">
                <Label>Supplier *</Label>
                <Select {...form.register("supplierId")}>
                  <SelectOption value="0">Select Supplier</SelectOption>
                  {suppliers.map((s) => <SelectOption key={s.id} value={String(s.id)}>{s.name}</SelectOption>)}
                </Select>
                {form.formState.errors.supplierId && <p className="text-xs text-red-500">{form.formState.errors.supplierId.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>PO Number</Label>
                <Input {...form.register("poNo")} placeholder="PO reference..." />
              </div>
              <div className="space-y-1">
                <Label>Date *</Label>
                <Input type="date" {...form.register("grnDate")} />
              </div>
            </div>
            <div className="mt-4">
              <Label>Description</Label>
              <Input {...form.register("description")} placeholder="GRN description..." />
            </div>
          </CardContent>
        </Card>

        <WarehouseLineItems form={form} fieldName="details" />

        {form.formState.errors.details && (
          <p className="text-xs text-red-500">
            {typeof form.formState.errors.details.message === "string" ? form.formState.errors.details.message : "Please check line items"}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => router.push("/warehouse/grn")}>Cancel</Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Saving..." : "Save GRN"}
          </Button>
        </div>
      </form>
    </div>
  );
}
