"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUpDown, Check, X } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-display/data-table";
import { FormDialog } from "@/components/forms/form-dialog";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectOption } from "@/components/ui/select";
import { fetchApi } from "@/lib/api";

// --- Types ---
interface Bank {
  id: number;
  bankCode: string;
  branchCode: string | null;
  name: string;
  address: string | null;
  cityId: number | null;
  city?: { id: number; name: string } | null;
  phone: string | null;
  fax: string | null;
  mobile: string | null;
  contactPerson1: string | null;
  contactPerson2: string | null;
  contactPerson3: string | null;
  isGst: boolean;
  isCreditCard: boolean;
  _count?: { bankAccounts: number };
}

interface City {
  id: number;
  name: string;
}

interface ListResponse {
  data: Bank[];
  total: number;
  page: number;
  pageSize: number;
}

interface CityListResponse {
  data: City[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const bankSchema = z.object({
  bankCode: z.string().min(1, "Bank code is required").max(50),
  branchCode: z.string().max(50).optional().default(""),
  name: z.string().min(1, "Name is required").max(200),
  address: z.string().max(500).optional().default(""),
  cityId: z.union([z.number(), z.string()]).optional().transform((val) => {
    if (val === "" || val === undefined || val === null) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }),
  phone: z.string().max(50).optional().default(""),
  fax: z.string().max(50).optional().default(""),
  mobile: z.string().max(50).optional().default(""),
  contactPerson1: z.string().max(100).optional().default(""),
  contactPerson2: z.string().max(100).optional().default(""),
  contactPerson3: z.string().max(100).optional().default(""),
  isGst: z.boolean().optional().default(false),
  isCreditCard: z.boolean().optional().default(false),
});

type BankForm = z.infer<typeof bankSchema>;

// --- API ---
const API = "/api/accounting/banks";

function fetchBanks() {
  return fetchApi<ListResponse>(`${API}?pageSize=1000`);
}

function createBank(data: BankForm) {
  return fetchApi<Bank>(API, { method: "POST", body: JSON.stringify(data) });
}

function updateBank(id: number, data: BankForm) {
  return fetchApi<Bank>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteBank(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

function fetchCities() {
  return fetchApi<CityListResponse>("/api/setup/cities?pageSize=1000");
}

// --- Columns ---
const columns: ColumnDef<Bank>[] = [
  {
    accessorKey: "bankCode",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Bank Code <ArrowUpDown className="ml-2 h-4 w-4" />
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
    accessorKey: "branchCode",
    header: "Branch",
    cell: ({ row }) => row.original.branchCode || "-",
  },
  {
    id: "city",
    header: "City",
    cell: ({ row }) => row.original.city?.name || "-",
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => row.original.phone || "-",
  },
  {
    id: "isGst",
    header: "GST",
    cell: ({ row }) =>
      row.original.isGst ? (
        <Badge variant="secondary"><Check className="h-3 w-3" /></Badge>
      ) : (
        <X className="h-3 w-3 text-zinc-400" />
      ),
  },
  {
    id: "isCreditCard",
    header: "Credit Card",
    cell: ({ row }) =>
      row.original.isCreditCard ? (
        <Badge variant="secondary"><Check className="h-3 w-3" /></Badge>
      ) : (
        <X className="h-3 w-3 text-zinc-400" />
      ),
  },
];

// --- Page ---
export default function BanksPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Bank | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({ resolver: zodResolver(bankSchema) as any, defaultValues: {
    bankCode: "", branchCode: "", name: "", address: "", cityId: "",
    phone: "", fax: "", mobile: "", contactPerson1: "", contactPerson2: "", contactPerson3: "",
    isGst: false, isCreditCard: false,
  }});

  const { data, isLoading } = useQuery({ queryKey: ["banks"], queryFn: fetchBanks });
  const { data: citiesData } = useQuery({ queryKey: ["cities"], queryFn: fetchCities });

  const createMutation = useMutation({
    mutationFn: (values: BankForm) => createBank(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast.success("Bank created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: BankForm) => updateBank(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast.success("Bank updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBank(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast.success("Bank deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({
      bankCode: "", branchCode: "", name: "", address: "", cityId: "",
      phone: "", fax: "", mobile: "", contactPerson1: "", contactPerson2: "", contactPerson3: "",
      isGst: false, isCreditCard: false,
    });
    setFormOpen(true);
  }

  function openEdit(bank: Bank) {
    setSelected(bank);
    form.reset({
      bankCode: bank.bankCode,
      branchCode: bank.branchCode ?? "",
      name: bank.name,
      address: bank.address ?? "",
      cityId: bank.cityId ?? "",
      phone: bank.phone ?? "",
      fax: bank.fax ?? "",
      mobile: bank.mobile ?? "",
      contactPerson1: bank.contactPerson1 ?? "",
      contactPerson2: bank.contactPerson2 ?? "",
      contactPerson3: bank.contactPerson3 ?? "",
      isGst: bank.isGst,
      isCreditCard: bank.isCreditCard,
    });
    setFormOpen(true);
  }

  function openDelete(bank: Bank) {
    setSelected(bank);
    setDeleteOpen(true);
  }

  function onSubmit(values: BankForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columnsWithActions: ColumnDef<Bank>[] = [
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
        <h1 className="text-2xl font-semibold">Banks</h1>
        <p className="text-sm text-zinc-500">Manage bank records for financial transactions.</p>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search banks..."
        isLoading={isLoading}
        emptyMessage="No banks found."
        toolbarActions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Bank
          </Button>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Bank" : "Add Bank"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bankCode">Bank Code</Label>
            <Input id="bankCode" {...form.register("bankCode")} />
            {form.formState.errors.bankCode && (
              <p className="text-sm text-red-500">{form.formState.errors.bankCode.message as string}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="branchCode">Branch Code</Label>
            <Input id="branchCode" {...form.register("branchCode")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message as string}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...form.register("address")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cityId">City</Label>
            <Select id="cityId" {...form.register("cityId")}>
              <SelectOption value="">-- Select City --</SelectOption>
              {(citiesData?.data ?? []).map((city) => (
                <SelectOption key={city.id} value={city.id}>
                  {city.name}
                </SelectOption>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fax">Fax</Label>
            <Input id="fax" {...form.register("fax")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile</Label>
            <Input id="mobile" {...form.register("mobile")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPerson1">Contact Person 1</Label>
          <Input id="contactPerson1" {...form.register("contactPerson1")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactPerson2">Contact Person 2</Label>
            <Input id="contactPerson2" {...form.register("contactPerson2")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPerson3">Contact Person 3</Label>
            <Input id="contactPerson3" {...form.register("contactPerson3")} />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("isGst")} className="rounded border-zinc-300" />
            GST
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("isCreditCard")} className="rounded border-zinc-300" />
            Credit Card
          </label>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Bank"
        description={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
