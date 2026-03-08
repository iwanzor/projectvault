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

const gtnSchema = z.object({
  requestedBy: z.string().optional().default(""),
  approvedBy: z.string().optional().default(""),
  fromProjectNo: z.string().optional().default(""),
  toProjectNo: z.string().optional().default(""),
  gtnDate: z.string().min(1, "Date is required"),
  description: z.string().optional().default(""),
  details: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

type GTNFormData = z.infer<typeof gtnSchema>;

export default function NewGtnPage() {
  const router = useRouter();

  const form = useForm<GTNFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(gtnSchema) as any,
    defaultValues: {
      requestedBy: "",
      approvedBy: "",
      fromProjectNo: "",
      toProjectNo: "",
      gtnDate: format(new Date(), "yyyy-MM-dd"),
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
    mutationFn: (data: GTNFormData) =>
      fetchApi<{ id: number }>("/api/warehouse/gtn", {
        method: "POST",
        body: JSON.stringify({ ...data, details: data.details.map((d, i) => ({ ...d, lineNo: i + 1 })) }),
      }),
    onSuccess: (data) => {
      toast.success("GTN created successfully");
      router.push(`/warehouse/gtn/${data.id}`);
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
        <Button variant="ghost" size="icon" onClick={() => router.push("/warehouse/gtn")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">New Goods Transfer Note</h1>
          <p className="text-sm text-zinc-500">Transfer goods between projects</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-4"><CardTitle className="text-base">GTN Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label>Requested By</Label>
                <Input {...form.register("requestedBy")} placeholder="Name..." />
              </div>
              <div className="space-y-1">
                <Label>Approved By</Label>
                <Input {...form.register("approvedBy")} placeholder="Name..." />
              </div>
              <div className="space-y-1">
                <Label>From Project</Label>
                <Select {...form.register("fromProjectNo")}>
                  <SelectOption value="">Select Project</SelectOption>
                  {projects.map((p) => <SelectOption key={p.id} value={p.projectNo}>{p.projectNo} - {p.name}</SelectOption>)}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>To Project</Label>
                <Select {...form.register("toProjectNo")}>
                  <SelectOption value="">Select Project</SelectOption>
                  {projects.map((p) => <SelectOption key={p.id} value={p.projectNo}>{p.projectNo} - {p.name}</SelectOption>)}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <Label>Date *</Label>
                <Input type="date" {...form.register("gtnDate")} />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input {...form.register("description")} placeholder="GTN description..." />
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
          <Button type="button" variant="outline" onClick={() => router.push("/warehouse/gtn")}>Cancel</Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Saving..." : "Save GTN"}
          </Button>
        </div>
      </form>
    </div>
  );
}
