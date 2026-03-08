import { z } from "zod/v4";

export const createSupplierSchema = z.object({
  supplierCode: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  address: z.string().max(250).nullable().optional(),
  areaId: z.number().int().positive().nullable().optional(),
  cityId: z.number().int().positive().nullable().optional(),
  phone: z.string().max(250).nullable().optional(),
  fax: z.string().max(50).nullable().optional(),
  mobile: z.string().max(50).nullable().optional(),
  email: z.string().email().max(100).nullable().optional(),
  other: z.string().max(50).nullable().optional(),
  contactPerson1: z.string().max(50).nullable().optional(),
  cp1Designation: z.string().max(50).nullable().optional(),
  cp1Email: z.string().max(50).nullable().optional(),
  cp1Mobile: z.string().max(50).nullable().optional(),
  contactPerson2: z.string().max(50).nullable().optional(),
  cp2Designation: z.string().max(50).nullable().optional(),
  cp2Email: z.string().max(50).nullable().optional(),
  cp2Mobile: z.string().max(50).nullable().optional(),
  contactPerson3: z.string().max(50).nullable().optional(),
  cp3Designation: z.string().max(50).nullable().optional(),
  cp3Email: z.string().max(50).nullable().optional(),
  cp3Mobile: z.string().max(50).nullable().optional(),
  currencyCode: z.string().max(50).nullable().optional(),
  vendorCode: z.string().max(50).nullable().optional(),
  isImport: z.boolean().default(false),
  terms: z.string().nullable().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();
