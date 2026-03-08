import { z } from "zod/v4";

// ─── Project Detail Line Item ──────────────────────

const projectItemSchema = z.object({
  barcode: z.string().min(1).max(50),
  itemDescription: z.string().min(1),
  model: z.string().min(1).max(250),
  location: z.string().max(250).optional().default(""),
  mainLocation: z.string().max(50).nullable().optional(),
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
  vatPerc: z.coerce.number().min(0).default(0),
  vatAmount: z.coerce.number().min(0).default(0),
  rowColor: z.number().int().nullable().optional(),
});

// ─── List Projects ─────────────────────────────────

export const listProjectsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  customerId: z.coerce.number().int().positive().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ─── Create Project ────────────────────────────────

export const createProjectSchema = z.object({
  quotationId: z.number().int().positive().nullable().optional(),
  customerId: z.number().int().positive(),
  projectDate: z.coerce.date().optional(),
  projectName: z.string().min(1).max(500),
  projectTags: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  assignPmCode: z.string().max(50).nullable().optional(),
  assignTlCode: z.string().max(50).nullable().optional(),
  handoverDate: z.coerce.date().nullable().optional(),
  commissionDate: z.coerce.date().nullable().optional(),
  programDate: z.coerce.date().nullable().optional(),
  targetLpoDate: z.coerce.date().nullable().optional(),
  targetShipmentDate: z.coerce.date().nullable().optional(),
  deliverySiteDate: z.coerce.date().nullable().optional(),
  installationDate: z.coerce.date().nullable().optional(),
  discountPercentage: z.coerce.number().min(0).max(100).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
  vatPerc: z.coerce.number().min(0).max(100).default(0),
  items: z.array(projectItemSchema).default([]),
});

// ─── Update Project ────────────────────────────────

export const updateProjectSchema = z.object({
  customerId: z.number().int().positive().optional(),
  projectDate: z.coerce.date().optional(),
  projectName: z.string().min(1).max(500).optional(),
  projectTags: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  assignPmCode: z.string().max(50).nullable().optional(),
  assignTlCode: z.string().max(50).nullable().optional(),
  handoverDate: z.coerce.date().nullable().optional(),
  commissionDate: z.coerce.date().nullable().optional(),
  programDate: z.coerce.date().nullable().optional(),
  targetLpoDate: z.coerce.date().nullable().optional(),
  targetShipmentDate: z.coerce.date().nullable().optional(),
  deliverySiteDate: z.coerce.date().nullable().optional(),
  installationDate: z.coerce.date().nullable().optional(),
  discountPercentage: z.coerce.number().min(0).max(100).optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  vatPerc: z.coerce.number().min(0).max(100).optional(),
  allowedAmount: z.coerce.number().min(0).optional(),
  boqFilePath: z.string().nullable().optional(),
  items: z.array(projectItemSchema).optional(),
});

// ─── Update Status ─────────────────────────────────

export const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]),
});

// ─── Project Role ──────────────────────────────────

export const addProjectRoleSchema = z.object({
  userId: z.number().int().positive(),
  roleCode: z.string().min(1).max(50),
  userRole: z.string().max(50).nullable().optional(),
});

// ─── Project Remark ────────────────────────────────

export const addProjectRemarkSchema = z.object({
  remarks: z.string().min(1).max(500),
  manualRemarks: z.string().max(500).nullable().optional(),
});

export const updateProjectRemarkSchema = z.object({
  remarks: z.string().min(1).max(500).optional(),
  manualRemarks: z.string().max(500).nullable().optional(),
});

// ─── Document Detail ───────────────────────────────

export const addDocumentDetailSchema = z.object({
  documentId: z.number().int().positive(),
  targetDate: z.coerce.date(),
  destinationPath: z.string().min(1).max(255),
});

export const updateDocumentDetailSchema = z.object({
  isSelected: z.boolean().optional(),
  targetDate: z.coerce.date().optional(),
  destinationPath: z.string().min(1).max(255).optional(),
  uploadDocumentDate: z.coerce.date().nullable().optional(),
});

// ─── Cumulative LPO Date ───────────────────────────

export const addCumulativeLpoSchema = z.object({
  modelNo: z.string().min(1).max(50),
  quantity: z.coerce.number().nullable().optional(),
  lpoDate: z.coerce.date().nullable().optional(),
  arrivalDate: z.coerce.date().nullable().optional(),
});

export const updateCumulativeLpoSchema = z.object({
  modelNo: z.string().min(1).max(50).optional(),
  quantity: z.coerce.number().nullable().optional(),
  lpoDate: z.coerce.date().nullable().optional(),
  arrivalDate: z.coerce.date().nullable().optional(),
});
