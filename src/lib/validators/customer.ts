import { z } from "zod/v4";

export const createCustomerSchema = z.object({
  customerCode: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  address: z.string().max(250).nullable().optional(),
  areaId: z.number().int().positive().nullable().optional(),
  cityId: z.number().int().positive().nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
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
  gpCustomerId: z.string().max(10).nullable().optional(),
  isExport: z.boolean().default(false),
});

export const updateCustomerSchema = createCustomerSchema.partial();
