import { z } from "zod/v4";

// ─── Pagination & List Params ────────────────────────

export const listParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type ListParams = z.infer<typeof listParamsSchema>;

// ─── Country ─────────────────────────────────────────

export const createCountrySchema = z.object({
  countryCode: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
});

export const updateCountrySchema = z.object({
  countryCode: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
});

// ─── City ────────────────────────────────────────────

export const createCitySchema = z.object({
  cityCode: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  countryId: z.number().int().positive(),
});

export const updateCitySchema = z.object({
  cityCode: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  countryId: z.number().int().positive().optional(),
});

// ─── Area ────────────────────────────────────────────

export const createAreaSchema = z.object({
  areaCode: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  cityId: z.number().int().positive(),
});

export const updateAreaSchema = z.object({
  areaCode: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  cityId: z.number().int().positive().optional(),
});

// ─── Brand ───────────────────────────────────────────

export const createBrandSchema = z.object({
  brandCode: z.string().min(1).max(50),
  name: z.string().min(1).max(150),
});

export const updateBrandSchema = z.object({
  brandCode: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(150).optional(),
});

// ─── Main Category ───────────────────────────────────

export const createMainCategorySchema = z.object({
  mainCategoryCode: z.string().min(1).max(50),
  name: z.string().min(1).max(150),
});

export const updateMainCategorySchema = z.object({
  mainCategoryCode: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(150).optional(),
});

// ─── SubCategory1 ────────────────────────────────────

export const createSubCategory1Schema = z.object({
  subCategory1Code: z.string().min(1).max(50),
  name: z.string().min(1).max(150),
  mainCategoryId: z.number().int().positive(),
});

export const updateSubCategory1Schema = z.object({
  subCategory1Code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(150).optional(),
  mainCategoryId: z.number().int().positive().optional(),
});

// ─── SubCategory2 ────────────────────────────────────

export const createSubCategory2Schema = z.object({
  subCategory2Code: z.string().min(1).max(50),
  name: z.string().min(1).max(150),
  subCategory1Id: z.number().int().positive(),
});

export const updateSubCategory2Schema = z.object({
  subCategory2Code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(150).optional(),
  subCategory1Id: z.number().int().positive().optional(),
});

// ─── Unit ────────────────────────────────────────────

export const createUnitSchema = z.object({
  unitCode: z.string().min(1).max(50),
  name: z.string().min(1).max(50),
});

export const updateUnitSchema = z.object({
  unitCode: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(50).optional(),
});

// ─── PackingType ─────────────────────────────────────

export const createPackingTypeSchema = z.object({
  packingTypeCode: z.string().min(1).max(50),
  name: z.string().min(1).max(50),
});

export const updatePackingTypeSchema = z.object({
  packingTypeCode: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(50).optional(),
});

// ─── Currency ────────────────────────────────────────

export const createCurrencySchema = z.object({
  currencyCode: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  symbol: z.string().max(50).optional(),
  conversionRate: z.coerce.number().positive().optional(),
});

export const updateCurrencySchema = z.object({
  currencyCode: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  symbol: z.string().max(50).optional(),
  conversionRate: z.coerce.number().positive().optional(),
});

// ─── VatRate ─────────────────────────────────────────

export const createVatRateSchema = z.object({
  vatCode: z.string().min(1).max(50),
  name: z.string().min(1).max(50),
  vatPerc: z.coerce.number().min(0).max(100),
});

export const updateVatRateSchema = z.object({
  vatCode: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(50).optional(),
  vatPerc: z.coerce.number().min(0).max(100).optional(),
});

// ─── QuotationTerms ─────────────────────────────────

export const createQuotationTermsSchema = z.object({
  quotationTermsCode: z.string().min(1).max(50),
  terms: z.string().min(1),
});

export const updateQuotationTermsSchema = z.object({
  quotationTermsCode: z.string().min(1).max(50).optional(),
  terms: z.string().min(1).optional(),
});

// ─── DocumentInfo ────────────────────────────────────

export const createDocumentInfoSchema = z.object({
  documentCode: z.string().min(1).max(50),
  description: z.string().min(1).max(100),
});

export const updateDocumentInfoSchema = z.object({
  documentCode: z.string().min(1).max(50).optional(),
  description: z.string().min(1).max(100).optional(),
});
