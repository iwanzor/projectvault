import type { Decimal } from "@/generated/prisma/internal/prismaNamespace";

export interface QuotationDetail {
  id: number;
  serialNo: number;
  barcode: string;
  itemDescription: string;
  model: string;
  location: string | null;
  mainLocation: string | null;
  quantity: Decimal;
  rate: Decimal;
  amount: Decimal;
  brandDesc: string | null;
}

export interface QuotationCustomer {
  id: number;
  customerCode: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  contactPerson1: string | null;
}

export interface QuotationTermsData {
  id: number;
  quotationTermsCode: string;
  terms: string;
}

export interface QuotationWithDetails {
  id: number;
  quotationNo: string;
  branchCode: string;
  quotationDate: Date;
  description: string | null;
  status: string;
  revisionNo: number;
  totalAmount: Decimal;
  discountPercentage: Decimal;
  discountAmount: Decimal;
  netAmount: Decimal;
  vatPerc: Decimal;
  vatAmount: Decimal;
  grossTotal: Decimal;
  customer: QuotationCustomer;
  quotationTerms: QuotationTermsData | null;
  details: QuotationDetail[];
}

export type PdfFormat =
  | "standard"
  | "subcategory"
  | "grandtotal"
  | "quantity"
  | "combo";

export function toNum(val: Decimal | number | null | undefined): number {
  if (val == null) return 0;
  return typeof val === "number" ? val : Number(val);
}

export function fmtCurrency(val: number): string {
  return val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtQty(val: number): string {
  return val.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function fmtDate(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}
