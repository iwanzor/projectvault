"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-display/data-table";
import { FormDialog } from "@/components/forms/form-dialog";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { fetchApi } from "@/lib/api";

// --- Types ---
interface City {
  id: number;
  cityCode: string;
  name: string;
}

interface Area {
  id: number;
  areaCode: string;
  name: string;
  cityId: number;
  city?: City;
}

interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const areaSchema = z.object({
  areaCode: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(100),
  cityId: z.coerce.number().min(1, "City is required"),
});

type AreaForm = z.infer<typeof areaSchema>;

// --- API ---
const API = "/api/setup/areas";

function fetchAreas() {
  return fetchApi<ListResponse<Area>>(`${API}?pageSize=1000`);
}

function fetchCities() {
  return fetchApi<ListResponse<City>>("/api/setup/cities?pageSize=1000");
}

function createArea(data: AreaForm) {
  return fetchApi<Area>(API, { method: "POST", body: JSON.stringify(data) });
}

function updateArea(id: number, data: AreaForm) {
  return fetchApi<Area>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteArea(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<Area>[] = [
  {
    accessorKey: "areaCode",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Code <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    id: "city",
    header: "City",
    cell: ({ row }) => row.original.city?.name ?? "-",
  },
];

// --- Page ---
export default function AreasPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Area | null>(null);

  const form = useForm<AreaForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(areaSchema) as any,
    defaultValues: { areaCode: "", name: "", cityId: 0 },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["areas"],
    queryFn: fetchAreas,
  });

  const { data: citiesData } = useQuery({
    queryKey: ["cities"],
    queryFn: fetchCities,
  });

  const createMutation = useMutation({
    mutationFn: (values: AreaForm) => createArea(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      toast.success("Area created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: AreaForm) => updateArea(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      toast.success("Area updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteArea(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      toast.success("Area deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ areaCode: "", name: "", cityId: 0 });
    setFormOpen(true);
  }

  function openEdit(area: Area) {
    setSelected(area);
    form.reset({ areaCode: area.areaCode, name: area.name, cityId: area.cityId });
    setFormOpen(true);
  }

  function openDelete(area: Area) {
    setSelected(area);
    setDeleteOpen(true);
  }

  function onSubmit(values: AreaForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<Area>[] = [
    ...columns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => openDelete(row.original)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Areas</h1>
        <p className="text-sm text-zinc-500">Manage area records linked to cities.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search areas..."
        isLoading={isLoading}
        emptyMessage="No areas found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Area
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Area" : "Add Area"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="areaCode">Code</Label>
          <Input id="areaCode" {...form.register("areaCode")} />
          {form.formState.errors.areaCode && (
            <p className="text-sm text-red-500">{form.formState.errors.areaCode.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cityId">City</Label>
          <Select id="cityId" {...form.register("cityId", { valueAsNumber: true })}>
            <SelectOption value="">Select city...</SelectOption>
            {citiesData?.data.map((c) => (
              <SelectOption key={c.id} value={c.id}>
                {c.name}
              </SelectOption>
            ))}
          </Select>
          {form.formState.errors.cityId && (
            <p className="text-sm text-red-500">{form.formState.errors.cityId.message}</p>
          )}
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Area"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
