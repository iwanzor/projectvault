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
interface BankAccount {
  id: number;
  bankId: number;
  bank?: { id: number; name: string } | null;
  accountNo: string;
  accountType: string | null;
  currencyCode: string | null;
  currency?: { currencyCode: string; name: string } | null;
  amount: number | string | null;
}

interface Bank {
  id: number;
  name: string;
}

interface Currency {
  id: number;
  currencyCode: string;
  name: string;
}

interface ListResponse {
  data: BankAccount[];
  total: number;
  page: number;
  pageSize: number;
}

interface BankListResponse {
  data: Bank[];
  total: number;
  page: number;
  pageSize: number;
}

interface CurrencyListResponse {
  data: Currency[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Schema ---
const bankAccountSchema = z.object({
  bankId: z.union([z.number(), z.string()]).transform((val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }).pipe(z.number().min(1, "Bank is required")),
  accountNo: z.string().min(1, "Account number is required").max(100),
  accountType: z.string().max(100).optional().default(""),
  currencyCode: z.string().max(50).optional().default(""),
  amount: z.union([z.number(), z.string()]).optional().default(0).transform((val) => {
    if (val === "" || val === undefined || val === null) return 0;
    return Number(val);
  }),
});

type BankAccountForm = z.infer<typeof bankAccountSchema>;

// --- API ---
const API = "/api/accounting/bank-accounts";

function fetchBankAccounts(bankId?: number) {
  const params = new URLSearchParams({ pageSize: "1000" });
  if (bankId) params.set("bankId", String(bankId));
  return fetchApi<ListResponse>(`${API}?${params}`);
}

function createBankAccount(data: BankAccountForm) {
  return fetchApi<BankAccount>(API, { method: "POST", body: JSON.stringify(data) });
}

function updateBankAccount(id: number, data: BankAccountForm) {
  return fetchApi<BankAccount>(`${API}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function deleteBankAccount(id: number) {
  return fetchApi(`${API}/${id}`, { method: "DELETE" });
}

function fetchBanks() {
  return fetchApi<BankListResponse>("/api/accounting/banks?pageSize=1000");
}

function fetchCurrencies() {
  return fetchApi<CurrencyListResponse>("/api/setup/currencies?pageSize=1000");
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// --- Page ---
export default function BankAccountsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<BankAccount | null>(null);
  const [filterBankId, setFilterBankId] = useState<number | undefined>(undefined);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({ resolver: zodResolver(bankAccountSchema) as any, defaultValues: {
    bankId: "", accountNo: "", accountType: "", currencyCode: "", amount: 0,
  }});

  const { data, isLoading } = useQuery({
    queryKey: ["bank-accounts", filterBankId],
    queryFn: () => fetchBankAccounts(filterBankId),
  });

  const { data: banksData } = useQuery({ queryKey: ["banks"], queryFn: fetchBanks });
  const { data: currenciesData } = useQuery({ queryKey: ["currencies"], queryFn: fetchCurrencies });

  const createMutation = useMutation({
    mutationFn: (values: BankAccountForm) => createBankAccount(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Bank account created");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: BankAccountForm) => updateBankAccount(selected!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Bank account updated");
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBankAccount(selected!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Bank account deleted");
      setDeleteOpen(false);
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setSelected(null);
    form.reset({ bankId: "", accountNo: "", accountType: "", currencyCode: "", amount: 0 });
    setFormOpen(true);
  }

  function openEdit(item: BankAccount) {
    setSelected(item);
    form.reset({
      bankId: item.bankId,
      accountNo: item.accountNo,
      accountType: item.accountType ?? "",
      currencyCode: item.currencyCode ?? "",
      amount: Number(item.amount ?? 0),
    });
    setFormOpen(true);
  }

  function openDelete(item: BankAccount) {
    setSelected(item);
    setDeleteOpen(true);
  }

  function onSubmit(values: BankAccountForm) {
    if (selected) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const columns: ColumnDef<BankAccount>[] = [
    {
      id: "bank",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting()}>
          Bank Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      accessorFn: (row) => row.bank?.name ?? "-",
    },
    {
      accessorKey: "accountNo",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting()}>
          Account No <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "accountType",
      header: "Account Type",
      cell: ({ row }) => row.original.accountType || "-",
    },
    {
      accessorKey: "currencyCode",
      header: "Currency",
      cell: ({ row }) => row.original.currencyCode || "-",
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting()}>
          Amount <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => currencyFormatter.format(Number(row.original.amount ?? 0)),
    },
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
        <h1 className="text-2xl font-semibold">Bank Accounts</h1>
        <p className="text-sm text-zinc-500">Manage bank account records and details.</p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="accountNo"
        searchPlaceholder="Search by account number..."
        isLoading={isLoading}
        emptyMessage="No bank accounts found."
        toolbarActions={
          <div className="flex items-center gap-2">
            <Select
              value={filterBankId ?? ""}
              onChange={(e) => setFilterBankId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-48"
            >
              <SelectOption value="">All Banks</SelectOption>
              {(banksData?.data ?? []).map((bank) => (
                <SelectOption key={bank.id} value={bank.id}>
                  {bank.name}
                </SelectOption>
              ))}
            </Select>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add Account
            </Button>
          </div>
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? "Edit Bank Account" : "Add Bank Account"}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="bankId">Bank</Label>
          <Select id="bankId" {...form.register("bankId")}>
            <SelectOption value="">-- Select Bank --</SelectOption>
            {(banksData?.data ?? []).map((bank) => (
              <SelectOption key={bank.id} value={bank.id}>
                {bank.name}
              </SelectOption>
            ))}
          </Select>
          {form.formState.errors.bankId && (
            <p className="text-sm text-red-500">{form.formState.errors.bankId.message as string}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountNo">Account Number</Label>
          <Input id="accountNo" {...form.register("accountNo")} />
          {form.formState.errors.accountNo && (
            <p className="text-sm text-red-500">{form.formState.errors.accountNo.message as string}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountType">Account Type</Label>
          <Input id="accountType" {...form.register("accountType")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currencyCode">Currency</Label>
            <Select id="currencyCode" {...form.register("currencyCode")}>
              <SelectOption value="">-- Select Currency --</SelectOption>
              {(currenciesData?.data ?? []).map((c) => (
                <SelectOption key={c.currencyCode} value={c.currencyCode}>
                  {c.currencyCode} - {c.name}
                </SelectOption>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" step="0.01" {...form.register("amount", { valueAsNumber: true })} />
          </div>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Bank Account"
        description={`Are you sure you want to delete account "${selected?.accountNo}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}
