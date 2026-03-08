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

interface ProjectLookup { id: number; projectNo: string; name: string; }
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

const grrnSchema = z.object({
  returnedBy: z.string().optional().default(""),
  projectNo: z.string().optional().default(""),
  grrnDate: z.string().min(1, "Date is required"),
  description: z.string().optional().default(""),
  details: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

type GRRNFormData = z.infer<typeof grrnSchema>;

export default function NewGrrnPage() {
  const router = useRouter();

  const form = useForm<GRRNFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(grrnSchema) as any,
    defaultValues: {
      returnedBy: "",
      projectNo: "",
      grrnDate: format(new Date(), "yyyy-MM-dd"),
      description: "",
      details: [],
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-lookup"],
    queryFn: () =>
      fetchApi<PaginatedResponse<ProjectLookup>>("/api/projects?pageSize=500").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: GRRNFormData) =>
      fetchApi<{ id: number }>("/api/warehouse/grrn", {
        method: "POST",
        body: JSON.stringify({ ...data, details: data.details.map((d, i) => ({ ...d, lineNo: i + 1 })) }),
      }),
    onSuccess: (data) => {
      toast.success("GRRN created successfully");
      router.push(`/warehouse/grrn/${data.id}`);
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
        <Button variant="ghost" size="icon" onClick={() => router.push("/warehouse/grrn")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">New Goods Return Note</h1>
          <p className="text-sm text-zinc-500">Return goods from project to warehouse</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-4"><CardTitle className="text-base">GRRN Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label>Returned By</Label>
                <Input {...form.register("returnedBy")} placeholder="Name..." />
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
                <Input type="date" {...form.register("grrnDate")} />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input {...form.register("description")} placeholder="GRRN description..." />
              </div>
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
          <Button type="button" variant="outline" onClick={() => router.push("/warehouse/grrn")}>Cancel</Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Saving..." : "Save GRRN"}
          </Button>
        </div>
      </form>
    </div>
  );
}
