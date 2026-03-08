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

interface GTNDetail {
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

interface GTN {
  id: number;
  gtnNo: string;
  gtnDate: string;
  fromProjectNo: string | null;
  toProjectNo: string | null;
  requestedBy: string | null;
  approvedBy: string | null;
  description: string | null;
  totalAmount: number;
  details: GTNDetail[];
}

interface ProjectLookup { id: number; projectNo: string; name: string; }
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

export default function GtnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const gtnId = Number(params.id);

  const [isEditing, setIsEditing] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const { data: gtn, isLoading } = useQuery({
    queryKey: ["gtn", gtnId],
    queryFn: () => fetchApi<GTN>(`/api/warehouse/gtn/${gtnId}`),
    enabled: !!gtnId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-lookup"],
    queryFn: () => fetchApi<PaginatedResponse<ProjectLookup>>("/api/projects?pageSize=500").then((r) => r.data),
  });

  const form = useForm<GTNFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(gtnSchema) as any,
    defaultValues: { requestedBy: "", approvedBy: "", fromProjectNo: "", toProjectNo: "", gtnDate: "", description: "", details: [] },
  });

  React.useEffect(() => {
    if (gtn && isEditing) {
      form.reset({
        requestedBy: gtn.requestedBy ?? "",
        approvedBy: gtn.approvedBy ?? "",
        fromProjectNo: gtn.fromProjectNo ?? "",
        toProjectNo: gtn.toProjectNo ?? "",
        gtnDate: gtn.gtnDate?.split("T")[0] ?? "",
        description: gtn.description ?? "",
        details: gtn.details.map((d) => ({
          id: d.id, barcode: d.barcode ?? "", serialNo: d.serialNo ?? "",
          model: d.model ?? "", itemDescription: d.itemDescription,
          location: d.location ?? "", quantity: Number(d.quantity), unit: d.unit ?? "PCS",
        })),
      });
    }
  }, [gtn, isEditing, form]);

  const updateMutation = useMutation({
    mutationFn: (data: GTNFormData) =>
      fetchApi<GTN>(`/api/warehouse/gtn/${gtnId}`, {
        method: "PUT",
        body: JSON.stringify({ ...data, details: data.details.map((d, i) => ({ ...d, lineNo: i + 1 })) }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gtn", gtnId] });
      queryClient.invalidateQueries({ queryKey: ["gtns"] });
      toast.success("GTN updated"); setIsEditing(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => fetchApi(`/api/warehouse/gtn/${gtnId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gtns"] });
      toast.success("GTN deleted"); router.push("/warehouse/gtn");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function onSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    form.handleSubmit((data) => updateMutation.mutate(data))(e);
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="text-zinc-500">Loading GTN...</div></div>;
  if (!gtn) return <div className="flex flex-col items-center justify-center h-64 gap-4"><div className="text-zinc-500">GTN not found</div><Button variant="outline" onClick={() => router.push("/warehouse/gtn")}>Back to List</Button></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/warehouse/gtn")}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-semibold">{gtn.gtnNo}</h1>
            <p className="text-sm text-zinc-500">{gtn.fromProjectNo ?? "N/A"} to {gtn.toProjectNo ?? "N/A"} | {format(new Date(gtn.gtnDate), "dd/MM/yyyy")}</p>
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
            <CardHeader className="pb-4"><CardTitle className="text-base">GTN Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1"><Label>Requested By</Label><Input {...form.register("requestedBy")} /></div>
                <div className="space-y-1"><Label>Approved By</Label><Input {...form.register("approvedBy")} /></div>
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
                <div className="space-y-1"><Label>Date *</Label><Input type="date" {...form.register("gtnDate")} /></div>
                <div className="space-y-1"><Label>Description</Label><Input {...form.register("description")} /></div>
              </div>
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
            <CardHeader className="pb-4"><CardTitle className="text-base">GTN Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                <div><div className="text-xs text-zinc-500 mb-1">Requested By</div><div className="font-medium">{gtn.requestedBy ?? "-"}</div></div>
                <div><div className="text-xs text-zinc-500 mb-1">Approved By</div><div className="font-medium">{gtn.approvedBy ?? "-"}</div></div>
                <div><div className="text-xs text-zinc-500 mb-1">From Project</div><div className="font-medium">{gtn.fromProjectNo ?? "-"}</div></div>
                <div><div className="text-xs text-zinc-500 mb-1">To Project</div><div className="font-medium">{gtn.toProjectNo ?? "-"}</div></div>
              </div>
              <div className="grid grid-cols-2 gap-6 mt-4">
                <div><div className="text-xs text-zinc-500 mb-1">Date</div><div className="font-medium">{format(new Date(gtn.gtnDate), "dd/MM/yyyy")}</div></div>
                <div><div className="text-xs text-zinc-500 mb-1">Description</div><div className="font-medium">{gtn.description ?? "-"}</div></div>
              </div>
            </CardContent>
          </Card>
          <WarehouseLineItems form={form} fieldName="details" readOnly />
        </div>
      )}

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete GTN" description={`Delete GTN "${gtn.gtnNo}"? This action cannot be undone.`} onConfirm={() => deleteMutation.mutate()} isLoading={deleteMutation.isPending} />
    </div>
  );
}
