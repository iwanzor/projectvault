import { z } from "zod/v4";

// ─── Date Range ─────────────────────────────────────

export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// ─── SQ Report ──────────────────────────────────────

export const sqReportSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  status: z.enum(["QUOTATION", "SUBMITTED", "PROJECT", "ARCHIVED"]).optional(),
  customerId: z.coerce.number().int().positive().optional(),
  sortBy: z.string().default("quotationDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ─── Currency Report ────────────────────────────────

export const currencyReportSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  currencyCode: z.string().optional(),
});

// ─── Activity Log ───────────────────────────────────

export const activityLogSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  userId: z.coerce.number().int().positive().optional(),
  module: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
});

// ─── Project Report ─────────────────────────────────

export const projectReportSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  sortBy: z.string().default("projectDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ─── Financial Report ───────────────────────────────

export const financialReportSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  category: z.enum(["INCOME", "EXPENSE"]).optional(),
  projectNo: z.string().optional(),
});

// ─── Warehouse Report ───────────────────────────────

export const warehouseReportSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  projectNo: z.string().optional(),
  type: z.enum(["GRN", "GIN", "GTN", "GRRN"]).optional(),
});

// ─── Timesheet Report ───────────────────────────────

export const timesheetReportSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  projectId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
});

// ─── FSF Master ─────────────────────────────────────

export const fsfMasterSchema = z.object({
  branchCode: z.string().min(1).max(50),
  note: z.coerce.number().int(),
  description: z.string().min(1).max(150),
  type: z.string().min(1).max(50),
  reportMode: z.string().min(1).max(50),
  nature: z.string().min(1).max(50),
  nGroup: z.string().min(1).max(50),
  serial: z.coerce.number().int(),
  fsfCategory: z.string().min(1).max(50),
  amount: z.coerce.number().optional(),
});

// ─── FSF Detail ─────────────────────────────────────

export const fsfDetailSchema = z.object({
  fsfMasterId: z.coerce.number().int().positive(),
  branchCode: z.string().min(1).max(50),
  note: z.coerce.number().int(),
  accountCode: z.string().min(1).max(150),
  type: z.string().min(1).max(50),
  reportMode: z.string().min(1).max(50),
  nature: z.string().min(1).max(50),
  nGroup: z.string().min(1).max(50),
  serial: z.coerce.number().int(),
  fsfCategory: z.string().min(1).max(50),
  amount: z.coerce.number(),
});

// ─── FSF List Params ────────────────────────────────

export const listFsfSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  branchCode: z.string().optional(),
  type: z.string().optional(),
  fsfCategory: z.string().optional(),
});
