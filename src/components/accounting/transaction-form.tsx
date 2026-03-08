"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useQuery } from "@tanstack/react-query";

import { fetchApi } from "@/lib/api";
import { FormDialog } from "@/components/forms/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";

// --- Types ---

interface SelectItem {
  id: number;
  code?: string;
  name: string;
}

interface CurrencyItem {
  id: number;
  code: string;
  name: string;
}

interface ProjectItem {
  id: number;
  projectNo: string;
  name: string;
}

export interface Transaction {
  id: number;
  transactionNo: string;
  category: "INCOME" | "EXPENSE";
  projectNo: string | null;
  purposeCode: string | null;
  description: string | null;
  paymentChannelCode: string | null;
  bankCode: string | null;
  accountNo: string | null;
  paymentTypeCode: string | null;
  currency: string | null;
  amount: number;
  amountPaid: number;
  amountLeft: number;
  bankDocNo: string | null;
  expectedDate: string | null;
  actualDate: string | null;
  internalDocNo: string | null;
  isLocked: boolean;
  isArchived: boolean;
  descriptionLock: string | null;
  descriptionArchive: string | null;
  project?: { projectNo: string; name: string } | null;
  purpose?: { code: string; name: string } | null;
  paymentChannel?: { code: string; name: string } | null;
  bank?: { code: string; name: string } | null;
  paymentType?: { code: string; name: string } | null;
}

// --- Schema ---

export const transactionSchema = z.object({
  projectNo: z.string().optional().default(""),
  purposeCode: z.string().optional().default(""),
  description: z.string().optional().default(""),
  paymentChannelCode: z.string().optional().default(""),
  bankCode: z.string().optional().default(""),
  accountNo: z.string().optional().default(""),
  paymentTypeCode: z.string().optional().default(""),
  currency: z.string().optional().default("AED"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  amountPaid: z.coerce.number().min(0, "Amount paid must be positive").default(0),
  bankDocNo: z.string().optional().default(""),
  expectedDate: z.string().optional().default(""),
  actualDate: z.string().optional().default(""),
  internalDocNo: z.string().optional().default(""),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

// --- Component ---

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  defaultValues?: Partial<TransactionFormData>;
  onSubmit: (data: TransactionFormData) => void;
  isSubmitting: boolean;
}

export function TransactionForm({
  open,
  onOpenChange,
  title,
  defaultValues,
  onSubmit,
  isSubmitting,
}: TransactionFormProps) {
  const form = useForm<TransactionFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      projectNo: "",
      purposeCode: "",
      description: "",
      paymentChannelCode: "",
      bankCode: "",
      accountNo: "",
      paymentTypeCode: "",
      currency: "AED",
      amount: 0,
      amountPaid: 0,
      bankDocNo: "",
      expectedDate: "",
      actualDate: "",
      internalDocNo: "",
      ...defaultValues,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        projectNo: "",
        purposeCode: "",
        description: "",
        paymentChannelCode: "",
        bankCode: "",
        accountNo: "",
        paymentTypeCode: "",
        currency: "AED",
        amount: 0,
        amountPaid: 0,
        bankDocNo: "",
        expectedDate: "",
        actualDate: "",
        internalDocNo: "",
        ...defaultValues,
      });
    }
  }, [open, defaultValues, form]);

  // --- Lookup data ---

  const { data: projects = [] } = useQuery({
    queryKey: ["acc-projects-lookup"],
    queryFn: () => fetchApi<ProjectItem[]>("/api/accounting/acc-projects"),
  });

  const { data: purposes = [] } = useQuery({
    queryKey: ["purposes-lookup"],
    queryFn: () => fetchApi<SelectItem[]>("/api/accounting/purposes"),
  });

  const { data: paymentChannels = [] } = useQuery({
    queryKey: ["payment-channels-lookup"],
    queryFn: () => fetchApi<SelectItem[]>("/api/accounting/payment-channels"),
  });

  const { data: banks = [] } = useQuery({
    queryKey: ["banks-lookup"],
    queryFn: () => fetchApi<SelectItem[]>("/api/accounting/banks"),
  });

  const { data: paymentTypes = [] } = useQuery({
    queryKey: ["payment-types-lookup"],
    queryFn: () => fetchApi<SelectItem[]>("/api/accounting/payment-types"),
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ["currencies-lookup"],
    queryFn: () => fetchApi<CurrencyItem[]>("/api/setup/currencies"),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    form.handleSubmit((data) => {
      onSubmit(data);
    })(e);
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      className="max-w-3xl"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="projectNo">Project</Label>
          <Select id="projectNo" {...form.register("projectNo")}>
            <SelectOption value="">Select Project</SelectOption>
            {projects.map((p) => (
              <SelectOption key={p.id} value={p.projectNo}>
                {p.projectNo} - {p.name}
              </SelectOption>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="purposeCode">Purpose</Label>
          <Select id="purposeCode" {...form.register("purposeCode")}>
            <SelectOption value="">Select Purpose</SelectOption>
            {purposes.map((p) => (
              <SelectOption key={p.id} value={p.code ?? String(p.id)}>
                {p.name}
              </SelectOption>
            ))}
          </Select>
        </div>

        <div className="col-span-2 space-y-1">
          <Label htmlFor="description">Description</Label>
          <Input id="description" {...form.register("description")} placeholder="Transaction description..." />
        </div>

        <div className="space-y-1">
          <Label htmlFor="paymentChannelCode">Payment Channel</Label>
          <Select id="paymentChannelCode" {...form.register("paymentChannelCode")}>
            <SelectOption value="">Select Channel</SelectOption>
            {paymentChannels.map((c) => (
              <SelectOption key={c.id} value={c.code ?? String(c.id)}>
                {c.name}
              </SelectOption>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="paymentTypeCode">Payment Type</Label>
          <Select id="paymentTypeCode" {...form.register("paymentTypeCode")}>
            <SelectOption value="">Select Type</SelectOption>
            {paymentTypes.map((t) => (
              <SelectOption key={t.id} value={t.code ?? String(t.id)}>
                {t.name}
              </SelectOption>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="bankCode">Bank</Label>
          <Select id="bankCode" {...form.register("bankCode")}>
            <SelectOption value="">Select Bank</SelectOption>
            {banks.map((b) => (
              <SelectOption key={b.id} value={b.code ?? String(b.id)}>
                {b.name}
              </SelectOption>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="accountNo">Account No</Label>
          <Input id="accountNo" {...form.register("accountNo")} placeholder="Account number" />
        </div>

        <div className="space-y-1">
          <Label htmlFor="currency">Currency</Label>
          <Select id="currency" {...form.register("currency")}>
            <SelectOption value="AED">AED</SelectOption>
            {currencies.map((c) => (
              <SelectOption key={c.id} value={c.code}>
                {c.code} - {c.name}
              </SelectOption>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="amount">Amount *</Label>
          <Input id="amount" type="number" step="0.01" min="0" {...form.register("amount")} />
          {form.formState.errors.amount && (
            <p className="text-xs text-red-500">{form.formState.errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="amountPaid">Amount Paid</Label>
          <Input id="amountPaid" type="number" step="0.01" min="0" {...form.register("amountPaid")} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="bankDocNo">Bank Doc No</Label>
          <Input id="bankDocNo" {...form.register("bankDocNo")} placeholder="Bank document number" />
        </div>

        <div className="space-y-1">
          <Label htmlFor="expectedDate">Expected Date</Label>
          <Input id="expectedDate" type="date" {...form.register("expectedDate")} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="actualDate">Actual Date</Label>
          <Input id="actualDate" type="date" {...form.register("actualDate")} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="internalDocNo">Internal Doc No</Label>
          <Input id="internalDocNo" {...form.register("internalDocNo")} placeholder="Internal document number" />
        </div>
      </div>
    </FormDialog>
  );
}
