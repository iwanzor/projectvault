import { z } from "zod/v4";

// ─── Purchase Order Detail Item ────────────────────

const purchaseOrderItemSchema = z.object({
  barcode: z.string().min(1).max(50),
  unitCode: z.string().min(1).max(50),
  itemDescription: z.string().nullable().optional(),
  quantity: z.coerce.number().positive(),
  defFob: z.coerce.number().min(0).default(0),
  currency: z.string().min(1).max(10),
  totDefFobAmount: z.coerce.number().min(0).default(0),
  actualFob: z.coerce.number().min(0).default(0),
  actualCurrency: z.string().min(1).max(10),
  totActualFobAmount: z.coerce.number().min(0).default(0),
  convRate: z.coerce.number().min(0).default(1),
  actualFobAed: z.coerce.number().min(0).default(0),
  totActualFobAed: z.coerce.number().min(0).default(0),
  vatPerc: z.coerce.number().min(0).default(0),
  vatAmount: z.coerce.number().min(0).default(0),
});

// ─── GRN Detail Item ──────────────────────────────

const grnItemSchema = z.object({
  barcode: z.string().min(1).max(50),
  purchaseOrderNo: z.string().min(1).max(50),
  projectNo: z.string().min(1).max(50),
  model: z.string().min(1).max(250),
  itemDescription: z.string().min(1).max(1500),
  location: z.string().min(1).max(250),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1).max(50),
});

// ─── GIN Detail Item ──────────────────────────────

const ginItemSchema = z.object({
  barcode: z.string().min(1).max(50),
  projectNo: z.string().min(1).max(50),
  model: z.string().min(1).max(250),
  itemDescription: z.string().min(1).max(1500),
  location: z.string().min(1).max(250),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1).max(50),
});

// ─── GTN Detail Item ──────────────────────────────

const gtnItemSchema = z.object({
  barcode: z.string().min(1).max(50),
  model: z.string().min(1).max(250),
  itemDescription: z.string().min(1).max(1500),
  location: z.string().min(1).max(250),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1).max(50),
});

// ─── GRRN Detail Item ─────────────────────────────

const grrnItemSchema = z.object({
  barcode: z.string().min(1).max(50),
  projectNo: z.string().min(1).max(50),
  model: z.string().min(1).max(250),
  itemDescription: z.string().min(1).max(1500),
  location: z.string().min(1).max(250),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1).max(50),
});

// ═══════════════════════════════════════════════════
// Purchase Orders
// ═══════════════════════════════════════════════════

export const listPurchaseOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  status: z.enum(["DRAFT", "APPROVED", "RECEIVED", "CANCELLED"]).optional(),
  supplierId: z.coerce.number().int().positive().optional(),
  projectNo: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createPurchaseOrderSchema = z.object({
  purchaseOrderDate: z.coerce.date().optional(),
  supplierId: z.number().int().positive(),
  projectNo: z.string().min(1).max(50),
  description: z.string().max(250).nullable().optional(),
  discountPercentage: z.coerce.number().min(0).max(100).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
  freightCharges: z.coerce.number().min(0).default(0),
  miscCharges: z.coerce.number().min(0).default(0),
  vatPerc: z.coerce.number().min(0).max(100).default(0),
  shipTo: z.string().max(250).nullable().optional(),
  estArrivalDays: z.coerce.date().nullable().optional(),
  items: z.array(purchaseOrderItemSchema).default([]),
});

export const updatePurchaseOrderSchema = z.object({
  purchaseOrderDate: z.coerce.date().optional(),
  supplierId: z.number().int().positive().optional(),
  projectNo: z.string().min(1).max(50).optional(),
  description: z.string().max(250).nullable().optional(),
  discountPercentage: z.coerce.number().min(0).max(100).optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  freightCharges: z.coerce.number().min(0).optional(),
  miscCharges: z.coerce.number().min(0).optional(),
  vatPerc: z.coerce.number().min(0).max(100).optional(),
  shipTo: z.string().max(250).nullable().optional(),
  estArrivalDays: z.coerce.date().nullable().optional(),
  items: z.array(purchaseOrderItemSchema).optional(),
});

// ═══════════════════════════════════════════════════
// GRN (Goods Received Note)
// ═══════════════════════════════════════════════════

export const listGrnsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  supplierId: z.coerce.number().int().positive().optional(),
  purchaseOrderNo: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createGrnSchema = z.object({
  grnDate: z.coerce.date().optional(),
  vendorInvoice: z.string().min(1).max(50),
  supplierId: z.number().int().positive(),
  purchaseOrderNo: z.string().min(1).max(50),
  description: z.string().nullable().optional(),
  items: z.array(grnItemSchema).min(1),
});

export const updateGrnSchema = z.object({
  grnDate: z.coerce.date().optional(),
  vendorInvoice: z.string().min(1).max(50).optional(),
  supplierId: z.number().int().positive().optional(),
  purchaseOrderNo: z.string().min(1).max(50).optional(),
  description: z.string().nullable().optional(),
  items: z.array(grnItemSchema).optional(),
});

// ═══════════════════════════════════════════════════
// GIN (Goods Issue Note)
// ═══════════════════════════════════════════════════

export const listGinsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  projectNo: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createGinSchema = z.object({
  ginDate: z.coerce.date().optional(),
  requestedBy: z.string().min(1).max(50),
  projectNo: z.string().min(1).max(50),
  description: z.string().nullable().optional(),
  items: z.array(ginItemSchema).min(1),
});

export const updateGinSchema = z.object({
  ginDate: z.coerce.date().optional(),
  requestedBy: z.string().min(1).max(50).optional(),
  projectNo: z.string().min(1).max(50).optional(),
  description: z.string().nullable().optional(),
  items: z.array(ginItemSchema).optional(),
});

// ═══════════════════════════════════════════════════
// GTN (Goods Transfer Note)
// ═══════════════════════════════════════════════════

export const listGtnsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  fromProjectNo: z.string().optional(),
  toProjectNo: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createGtnSchema = z.object({
  gtnDate: z.coerce.date().optional(),
  requestedBy: z.string().min(1).max(50),
  approvedBy: z.string().min(1).max(50),
  fromProjectNo: z.string().min(1).max(50),
  toProjectNo: z.string().min(1).max(50),
  description: z.string().nullable().optional(),
  items: z.array(gtnItemSchema).min(1),
});

export const updateGtnSchema = z.object({
  gtnDate: z.coerce.date().optional(),
  requestedBy: z.string().min(1).max(50).optional(),
  approvedBy: z.string().min(1).max(50).optional(),
  fromProjectNo: z.string().min(1).max(50).optional(),
  toProjectNo: z.string().min(1).max(50).optional(),
  description: z.string().nullable().optional(),
  items: z.array(gtnItemSchema).optional(),
});

// ═══════════════════════════════════════════════════
// GRRN (Goods Return Note)
// ═══════════════════════════════════════════════════

export const listGrrnsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  projectNo: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createGrrnSchema = z.object({
  grrnDate: z.coerce.date().optional(),
  returnedBy: z.string().min(1).max(50),
  projectNo: z.string().min(1).max(50),
  description: z.string().nullable().optional(),
  items: z.array(grrnItemSchema).min(1),
});

export const updateGrrnSchema = z.object({
  grrnDate: z.coerce.date().optional(),
  returnedBy: z.string().min(1).max(50).optional(),
  projectNo: z.string().min(1).max(50).optional(),
  description: z.string().nullable().optional(),
  items: z.array(grrnItemSchema).optional(),
});

// ═══════════════════════════════════════════════════
// Physical Stock
// ═══════════════════════════════════════════════════

export const listPhysicalStocksSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  projectNo: z.string().optional(),
  barcode: z.string().optional(),
  psStatus: z.string().optional(),
  psState: z.string().optional(),
  isAccessories: z.coerce.boolean().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createPhysicalStockSchema = z.object({
  docNo: z.string().min(1).max(50),
  docDate: z.coerce.date().optional(),
  projectNo: z.string().min(1).max(50),
  barcode: z.string().min(1).max(50),
  location: z.string().min(1).max(250),
  serialNo: z.string().min(1).max(50),
  quantity: z.coerce.number().int().min(0),
  psStatus: z.string().min(1).max(20),
  psState: z.string().min(1).max(20),
  autoGenerate: z.coerce.number().int().min(0),
  defFob: z.coerce.number().min(0).default(0),
  defCur: z.string().min(1).max(10),
  totDefFobAmount: z.coerce.number().min(0).default(0),
  convRate: z.coerce.number().min(0).default(1),
  fobPriceAed: z.coerce.number().min(0).default(0),
  totFobPriceAed: z.coerce.number().min(0).default(0),
  isAccessories: z.boolean().nullable().optional(),
  landedCost: z.coerce.number().min(0).nullable().optional(),
});

export const updatePhysicalStockSchema = z.object({
  docNo: z.string().min(1).max(50).optional(),
  docDate: z.coerce.date().optional(),
  projectNo: z.string().min(1).max(50).optional(),
  barcode: z.string().min(1).max(50).optional(),
  location: z.string().min(1).max(250).optional(),
  serialNo: z.string().min(1).max(50).optional(),
  quantity: z.coerce.number().int().min(0).optional(),
  psStatus: z.string().min(1).max(20).optional(),
  psState: z.string().min(1).max(20).optional(),
  autoGenerate: z.coerce.number().int().min(0).optional(),
  defFob: z.coerce.number().min(0).optional(),
  defCur: z.string().min(1).max(10).optional(),
  totDefFobAmount: z.coerce.number().min(0).optional(),
  convRate: z.coerce.number().min(0).optional(),
  fobPriceAed: z.coerce.number().min(0).optional(),
  totFobPriceAed: z.coerce.number().min(0).optional(),
  isAccessories: z.boolean().nullable().optional(),
  landedCost: z.coerce.number().min(0).nullable().optional(),
});
