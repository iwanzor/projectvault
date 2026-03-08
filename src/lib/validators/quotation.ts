import { z } from "zod/v4";

// ─── Line Item Schema ───────────────────────────────

const lineItemSchema = z.object({
  barcode: z.string().min(1).max(50),
  itemDescription: z.string().min(1),
  model: z.string().min(1).max(250),
  location: z.string().max(500).nullable().optional(),
  mainLocation: z.string().max(500).nullable().optional(),
  quantity: z.coerce.number().positive(),
  rate: z.coerce.number().min(0),
  fobPrice: z.coerce.number().min(0).default(0),
  landedCost: z.coerce.number().min(0).default(0),
  brandDesc: z.string().max(50).nullable().optional(),
  estShipPara: z.coerce.number().min(0).default(0),
  estAmount: z.coerce.number().min(0).default(0),
  estFobPrice: z.coerce.number().min(0).default(0),
  estLandedCost: z.coerce.number().min(0).default(0),
  estUnitPrice: z.coerce.number().min(0).default(0),
  estDefFob: z.coerce.number().nullable().optional(),
  estMarkup: z.coerce.number().nullable().optional(),
  estCustPara: z.coerce.number().nullable().optional(),
  exchangeRate: z.coerce.number().nullable().optional(),
  vatAmount: z.coerce.number().min(0).default(0),
});

// ─── List Quotations ────────────────────────────────

export const listQuotationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  status: z.enum(["QUOTATION", "SUBMITTED", "PROJECT", "ARCHIVED"]).optional(),
  customerId: z.coerce.number().int().positive().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ─── Create Quotation ───────────────────────────────

export const createQuotationSchema = z.object({
  customerId: z.number().int().positive(),
  quotationDate: z.coerce.date().optional(),
  quotationTermsId: z.number().int().positive().nullable().optional(),
  description: z.string().nullable().optional(),
  discountPercentage: z.coerce.number().min(0).max(100).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
  vatPerc: z.coerce.number().min(0).max(100).default(0),
  commPerc: z.coerce.number().nullable().optional(),
  commAmount: z.coerce.number().nullable().optional(),
  items: z.array(lineItemSchema).default([]),
});

// ─── Update Quotation ───────────────────────────────

export const updateQuotationSchema = z.object({
  customerId: z.number().int().positive().optional(),
  quotationDate: z.coerce.date().optional(),
  quotationTermsId: z.number().int().positive().nullable().optional(),
  description: z.string().nullable().optional(),
  discountPercentage: z.coerce.number().min(0).max(100).optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  vatPerc: z.coerce.number().min(0).max(100).optional(),
  commPerc: z.coerce.number().nullable().optional(),
  commAmount: z.coerce.number().nullable().optional(),
  items: z.array(lineItemSchema).optional(),
});

// ─── Add Single Line Item ───────────────────────────

export const addLineItemSchema = lineItemSchema;

// ─── Update Line Item ───────────────────────────────

export const updateLineItemSchema = lineItemSchema.partial();

// ─── Add Remark ─────────────────────────────────────

export const addRemarkSchema = z.object({
  remarks: z.string().min(1).max(5000),
});

// ─── Update Remark ──────────────────────────────────

export const updateRemarkSchema = z.object({
  remarks: z.string().min(1).max(5000),
});
