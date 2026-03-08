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
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api";

// --- Types ---
interface Country {
  id: number;
  countryCode: string;
  name: string;
}

interface City {
  id: number;
  cityCode: string;
  name: string;
  countryId: number;
  country?: Country;
  _count?: { areas: number };
}

interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const citySchema = z.object({
  cityCode: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(100),
  countryId: z.number().min(1, "Country is required"),
});

type CityForm = z.infer<typeof citySchema>;

// --- API ---
const API = "/api/setup/cities";

function fetchCities() {
  return fetchApi<ListResponse<City>>(`${API}?pageSize=1000`);
}

function fetchCountries() {
  return fetchApi<ListResponse<Country>>("/api/setup/countries?pageSize=1000");
}

function createCity(data: CityForm) {
  return fetchApi<City>(API, { method: "POST", body: JSON.stringify(data) });
}

function updateCity(id: number, data: CityForm) {
  return fetchApi<City>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteCity(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

// --- Columns ---
const columns: ColumnDef<City>[] = [
  {
    accessorKey: "cityCode",
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
    id: "country",
    header: "Country",
    cell: ({ row }) => row.original.country?.name ?? "-",
  },
  {
    id: "areas",
    header: "Areas",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original._count?.areas ?? 0}</Badge>
    ),
  },
];

// --- Page ---
export default function CitiesPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<City | null>(null);

  const form = useForm<CityForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(citySchema) as any,
    defaultValues: { cityCode: "", name: "", countryId: 0 },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["cities"],
    queryFn: fetchCities,
  });

  const { data: countriesData } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
  });

  const createMutation = useMutation({
    mutationFn: (values: CityForm) => createCity(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast.success("City created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: CityForm) => updateCity(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast.success("City updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCity(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast.success("City deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ cityCode: "", name: "", countryId: 0 });
    setFormOpen(true);
  }

  function openEdit(city: City) {
    setSelected(city);
    form.reset({ cityCode: city.cityCode, name: city.name, countryId: city.countryId });
    setFormOpen(true);
  }

  function openDelete(city: City) {
    setSelected(city);
    setDeleteOpen(true);
  }

  function onSubmit(values: CityForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<City>[] = [
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
        <h1 className="text-2xl font-semibold">Cities</h1>
        <p className="text-sm text-zinc-500">Manage city records linked to countries.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search cities..."
        isLoading={isLoading}
        emptyMessage="No cities found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add City
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit City" : "Add City"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="cityCode">Code</Label>
          <Input id="cityCode" {...form.register("cityCode")} />
          {form.formState.errors.cityCode && (
            <p className="text-sm text-red-500">{form.formState.errors.cityCode.message}</p>
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
          <Label htmlFor="countryId">Country</Label>
          <Select id="countryId" {...form.register("countryId", { valueAsNumber: true })}>
            <SelectOption value="">Select country...</SelectOption>
            {countriesData?.data.map((c) => (
              <SelectOption key={c.id} value={c.id}>
                {c.name}
              </SelectOption>
            ))}
          </Select>
          {form.formState.errors.countryId && (
            <p className="text-sm text-red-500">{form.formState.errors.countryId.message}</p>
          )}
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete City"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
