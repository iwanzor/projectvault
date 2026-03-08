import { z } from "zod/v4";

// ─── Material Request Detail Item ──────────────────

const mrItemSchema = z.object({
  barcode: z.string().min(1).max(50),
  modelNo: z.string().min(1).max(50),
  itemDescription: z.string().min(1),
  unitCode: z.string().min(1).max(50),
  quantity: z.coerce.number().positive(),
  landedCostDb: z.coerce.number().min(0).default(0),
  estimatedLandedCostDb: z.coerce.number().min(0).default(0),
  responseLandedCost: z.coerce.number().min(0).default(0),
  currency: z.string().min(1).max(10),
  totCostDb: z.coerce.number().min(0).default(0),
  actualCost: z.coerce.number().min(0).default(0),
  comment: z.string().nullable().optional(),
  barcodeBudget: z.string().max(50).nullable().optional(),
  budgetName: z.string().max(50).nullable().optional(),
  mrDetailType: z.number().int().default(0),
});

// ─── List Material Requests ────────────────────────

export const listMaterialRequestsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  projectId: z.coerce.number().int().positive().optional(),
  mrStatus: z.enum(["DRAFT", "APPROVED", "REJECTED", "COMPLETED"]).optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ─── Create Material Request ───────────────────────

export const createMaterialRequestSchema = z.object({
  projectId: z.number().int().positive(),
  description: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  targetLpoDate: z.coerce.date().nullable().optional(),
  supplierCode: z.string().max(50).nullable().optional(),
  items: z.array(mrItemSchema).min(1),
});

// ─── Update Material Request ───────────────────────

export const updateMaterialRequestSchema = z.object({
  description: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  targetLpoDate: z.coerce.date().nullable().optional(),
  supplierCode: z.string().max(50).nullable().optional(),
  items: z.array(mrItemSchema).optional(),
});

// ─── Approve Material Request ──────────────────────

export const approveMaterialRequestSchema = z.object({
  isApproved: z.boolean(),
});
